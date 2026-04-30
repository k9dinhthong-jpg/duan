const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");

const app = express();
app.use(express.json());

const mariaPool = mysql.createPool({
  host: process.env.MARIA_HOST || "127.0.0.1",
  port: Number(process.env.MARIA_PORT || 3306),
  user: process.env.MARIA_USER || "adminmct_api",
  password: process.env.MARIA_PASSWORD || "MctApi@2026!DB",
  database: process.env.MARIA_DB || "maycongtrinh_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim() !== "") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "";
}

function getUserAgent(req) {
  return typeof req.headers["user-agent"] === "string"
    ? req.headers["user-agent"]
    : "";
}

async function logSecurity(adminId, action, req, meta = {}) {
  try {
    await mariaPool.execute(
      "INSERT INTO security_logs (admin_id, action, ip_address, user_agent, meta_json) VALUES (?, ?, ?, ?, ?)",
      [
        adminId,
        action,
        getClientIp(req),
        getUserAgent(req),
        JSON.stringify(meta),
      ],
    );
  } catch (err) {
    console.error("logSecurity error:", err);
  }
}

function getBearerToken(authHeader) {
  if (typeof authHeader !== "string") {
    return "";
  }
  if (!authHeader.startsWith("Bearer ")) {
    return "";
  }
  return authHeader.slice(7).trim();
}

function randomBase32(length = 32) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes = crypto.randomBytes(length);
  let output = "";
  for (let i = 0; i < bytes.length; i += 1) {
    output += alphabet[bytes[i] % alphabet.length];
  }
  return output;
}

function base32ToBuffer(base32) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  const clean = String(base32 || "")
    .toUpperCase()
    .replace(/=+$/g, "");

  for (const char of clean) {
    const val = alphabet.indexOf(char);
    if (val === -1) {
      continue;
    }
    bits += val.toString(2).padStart(5, "0");
  }

  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }

  return Buffer.from(bytes);
}

function generateTotp(secret, time = Date.now()) {
  const key = base32ToBuffer(secret);
  const counter = Math.floor(time / 1000 / 30);
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));

  const hash = crypto.createHmac("sha1", key).update(msg).digest();
  const offset = hash[hash.length - 1] & 0x0f;
  const code =
    (((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff)) %
    1000000;

  return String(code).padStart(6, "0");
}

function verifyTotp(secret, code) {
  const normalizedCode = String(code || "").replace(/\s+/g, "");
  if (!/^\d{6}$/.test(normalizedCode)) {
    return false;
  }

  const now = Date.now();
  for (let drift = -1; drift <= 1; drift += 1) {
    const candidate = generateTotp(secret, now + drift * 30000);
    if (candidate === normalizedCode) {
      return true;
    }
  }

  return false;
}

function issueAccessToken(user, sessionId) {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
      role: "admin",
      sid: sessionId,
      tv: Number(user.token_version || 1),
    },
    process.env.JWT_SECRET,
    { expiresIn: "8h" },
  );
}

function requireAuth(req, res, next) {
  void (async () => {
    const token = getBearerToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res
        .status(401)
        .json({ message: "Token không hợp lệ hoặc đã hết hạn." });
    }

    const [rows] = await mariaPool.execute(
      "SELECT id, username, is_active, token_version, full_name, email, phone, twofa_enabled, twofa_secret, twofa_pending_secret FROM admins WHERE id = ? LIMIT 1",
      [Number(payload.sub)],
    );

    const user = Array.isArray(rows) ? rows[0] : null;
    if (!user || Number(user.is_active) !== 1) {
      return res.status(401).json({ message: "Tài khoản không hợp lệ." });
    }

    if (payload.tv && Number(payload.tv) !== Number(user.token_version || 1)) {
      return res
        .status(401)
        .json({ message: "Phiên đăng nhập đã hết hiệu lực." });
    }

    if (payload.sid) {
      const [sessionRows] = await mariaPool.execute(
        "SELECT id, revoked_at FROM admin_sessions WHERE id = ? AND admin_id = ? LIMIT 1",
        [String(payload.sid), Number(user.id)],
      );
      const session = Array.isArray(sessionRows) ? sessionRows[0] : null;

      if (!session || session.revoked_at) {
        return res
          .status(401)
          .json({ message: "Phiên đăng nhập đã bị thu hồi." });
      }

      await mariaPool.execute(
        "UPDATE admin_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?",
        [String(payload.sid)],
      );
    }

    req.auth = {
      ...payload,
      user,
    };

    return next();
  })().catch((err) => {
    console.error("requireAuth error:", err);
    return res.status(500).json({ message: "Lỗi xác thực hệ thống." });
  });
}

app.post("/api/auth/login", async (req, res) => {
  const username =
    typeof req.body?.username === "string" ? req.body.username.trim() : "";
  const password =
    typeof req.body?.password === "string" ? req.body.password : "";
  const twoFactorCode =
    typeof req.body?.twoFactorCode === "string" ? req.body.twoFactorCode : "";

  if (username === "" || password === "") {
    return res.status(400).json({ message: "Missing credentials" });
  }

  const [rows] = await mariaPool.execute(
    "SELECT id, username, full_name, password_hash, is_active, twofa_enabled, twofa_secret, token_version FROM admins WHERE username = ? AND is_active = 1 LIMIT 1",
    [username],
  );
  const user = Array.isArray(rows) ? rows[0] : null;

  if (!user) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    await logSecurity(user.id, "LOGIN_FAILED", req, {
      username,
      reason: "wrong_password",
    });
    return res.status(401).json({ message: "Invalid username or password" });
  }

  if (Number(user.twofa_enabled) === 1) {
    if (!twoFactorCode) {
      return res.status(200).json({
        requiresTwoFactor: true,
        message: "Vui lòng nhập mã xác thực 2FA để tiếp tục.",
      });
    }

    if (!verifyTotp(user.twofa_secret || "", twoFactorCode)) {
      await logSecurity(user.id, "LOGIN_FAILED", req, {
        username,
        reason: "invalid_2fa_code",
      });
      return res.status(401).json({ message: "Mã 2FA không đúng." });
    }
  }

  const sessionId = crypto.randomUUID();
  await mariaPool.execute(
    "INSERT INTO admin_sessions (id, admin_id, ip_address, user_agent) VALUES (?, ?, ?, ?)",
    [sessionId, user.id, getClientIp(req), getUserAgent(req)],
  );

  const token = issueAccessToken(user, sessionId);

  await logSecurity(user.id, "LOGIN_SUCCESS", req, { sessionId });

  return res.json({
    token,
    name: user.full_name || user.username,
  });
});

app.get("/api/account/profile", requireAuth, async (req, res) => {
  const user = req.auth.user;

  return res.json({
    username: user.username,
    name: user.full_name || user.username,
    email: user.email || "",
    phone: user.phone || "",
  });
});

app.put("/api/account/profile", requireAuth, async (req, res) => {
  const userId = Number(req.auth.sub);
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email =
    typeof req.body?.email === "string" ? req.body.email.trim() : "";
  const phone =
    typeof req.body?.phone === "string" ? req.body.phone.trim() : "";

  if (name === "") {
    return res.status(400).json({ message: "Vui lòng nhập họ và tên." });
  }

  await mariaPool.execute(
    "UPDATE admins SET full_name = ?, email = ?, phone = ? WHERE id = ?",
    [name, email, phone, userId],
  );

  await logSecurity(userId, "PROFILE_UPDATED", req, { name, email, phone });

  const [rows] = await mariaPool.execute(
    "SELECT username, full_name, email, phone FROM admins WHERE id = ? LIMIT 1",
    [userId],
  );
  const updated = Array.isArray(rows) ? rows[0] : null;

  return res.json({
    username: updated?.username || "",
    name: updated?.full_name || updated?.username || "",
    email: updated?.email || "",
    phone: updated?.phone || "",
  });
});

app.put("/api/account/password", requireAuth, async (req, res) => {
  const userId = Number(req.auth.sub);
  const currentSessionId = typeof req.auth.sid === "string" ? req.auth.sid : "";
  const currentPassword =
    typeof req.body?.currentPassword === "string"
      ? req.body.currentPassword
      : "";
  const newPassword =
    typeof req.body?.newPassword === "string" ? req.body.newPassword : "";

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Thiếu thông tin mật khẩu." });
  }

  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ message: "Mật khẩu mới phải có ít nhất 8 ký tự." });
  }

  const [rows] = await mariaPool.execute(
    "SELECT password_hash FROM admins WHERE id = ? LIMIT 1",
    [userId],
  );
  const user = Array.isArray(rows) ? rows[0] : null;
  if (!user) {
    return res.status(404).json({ message: "Không tìm thấy tài khoản." });
  }

  const matched = bcrypt.compareSync(currentPassword, user.password_hash);
  if (!matched) {
    return res.status(400).json({ message: "Mật khẩu hiện tại không đúng." });
  }

  const newHash = bcrypt.hashSync(newPassword, 12);
  await mariaPool.execute("UPDATE admins SET password_hash = ? WHERE id = ?", [
    newHash,
    userId,
  ]);

  if (currentSessionId) {
    await mariaPool.execute(
      "UPDATE admin_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE admin_id = ? AND id != ?",
      [userId, currentSessionId],
    );
  }

  await logSecurity(userId, "PASSWORD_CHANGED", req, {
    revokeOtherSessions: Boolean(currentSessionId),
  });

  return res.json({ ok: true });
});

app.get("/api/account/2fa/status", requireAuth, async (req, res) => {
  const user = req.auth.user;
  return res.json({
    enabled: Number(user.twofa_enabled) === 1,
    hasPendingSetup: Boolean(user.twofa_pending_secret),
  });
});

app.post("/api/account/2fa/setup", requireAuth, async (req, res) => {
  const userId = Number(req.auth.sub);
  const username = req.auth.user.username;
  const secret = randomBase32(32);

  await mariaPool.execute(
    "UPDATE admins SET twofa_pending_secret = ? WHERE id = ?",
    [secret, userId],
  );

  const label = encodeURIComponent(`AdminMCT:${username}`);
  const issuer = encodeURIComponent("AdminMCT");
  const otpauthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

  await logSecurity(userId, "TWO_FACTOR_SETUP_CREATED", req, {});

  return res.json({
    secret,
    otpauthUrl,
  });
});

app.post("/api/account/2fa/enable", requireAuth, async (req, res) => {
  const userId = Number(req.auth.sub);
  const code = typeof req.body?.code === "string" ? req.body.code : "";

  const [rows] = await mariaPool.execute(
    "SELECT twofa_pending_secret FROM admins WHERE id = ? LIMIT 1",
    [userId],
  );
  const row = Array.isArray(rows) ? rows[0] : null;
  const pendingSecret = row?.twofa_pending_secret || "";
  if (!pendingSecret) {
    return res
      .status(400)
      .json({ message: "Chưa có thiết lập 2FA chờ kích hoạt." });
  }

  if (!verifyTotp(pendingSecret, code)) {
    return res.status(400).json({ message: "Mã 2FA không hợp lệ." });
  }

  await mariaPool.execute(
    "UPDATE admins SET twofa_enabled = 1, twofa_secret = ?, twofa_pending_secret = NULL WHERE id = ?",
    [pendingSecret, userId],
  );

  await logSecurity(userId, "TWO_FACTOR_ENABLED", req, {});

  return res.json({ ok: true });
});

app.post("/api/account/2fa/disable", requireAuth, async (req, res) => {
  const userId = Number(req.auth.sub);
  const currentPassword =
    typeof req.body?.currentPassword === "string"
      ? req.body.currentPassword
      : "";

  if (!currentPassword) {
    return res
      .status(400)
      .json({ message: "Vui lòng nhập mật khẩu hiện tại." });
  }

  const [rows] = await mariaPool.execute(
    "SELECT password_hash, twofa_enabled FROM admins WHERE id = ? LIMIT 1",
    [userId],
  );
  const user = Array.isArray(rows) ? rows[0] : null;

  if (!user) {
    return res.status(404).json({ message: "Không tìm thấy tài khoản." });
  }

  if (Number(user.twofa_enabled) !== 1) {
    return res.status(400).json({ message: "2FA chưa được bật." });
  }

  const matched = bcrypt.compareSync(currentPassword, user.password_hash);
  if (!matched) {
    return res.status(400).json({ message: "Mật khẩu hiện tại không đúng." });
  }

  await mariaPool.execute(
    "UPDATE admins SET twofa_enabled = 0, twofa_secret = NULL, twofa_pending_secret = NULL WHERE id = ?",
    [userId],
  );

  await logSecurity(userId, "TWO_FACTOR_DISABLED", req, {});

  return res.json({ ok: true });
});

app.get("/api/account/sessions", requireAuth, async (req, res) => {
  const userId = Number(req.auth.sub);
  const currentSessionId = typeof req.auth.sid === "string" ? req.auth.sid : "";

  const [rows] = await mariaPool.execute(
    "SELECT id, ip_address, user_agent, created_at, last_seen_at FROM admin_sessions WHERE admin_id = ? AND revoked_at IS NULL ORDER BY created_at DESC",
    [userId],
  );

  const items = (Array.isArray(rows) ? rows : []).map((row) => ({
    id: row.id,
    ipAddress: row.ip_address || "",
    userAgent: row.user_agent || "",
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
    isCurrent: currentSessionId ? row.id === currentSessionId : false,
  }));

  return res.json({ items });
});

app.delete(
  "/api/account/sessions/:sessionId",
  requireAuth,
  async (req, res) => {
    const userId = Number(req.auth.sub);
    const currentSessionId =
      typeof req.auth.sid === "string" ? req.auth.sid : "";
    const sessionId = String(req.params.sessionId || "");

    if (sessionId === "") {
      return res.status(400).json({ message: "Session không hợp lệ." });
    }

    if (currentSessionId && sessionId === currentSessionId) {
      return res
        .status(400)
        .json({ message: "Không thể tự thu hồi phiên hiện tại." });
    }

    const [rows] = await mariaPool.execute(
      "SELECT id FROM admin_sessions WHERE id = ? AND admin_id = ? AND revoked_at IS NULL LIMIT 1",
      [sessionId, userId],
    );
    const exists = Array.isArray(rows) && rows.length > 0;

    if (!exists) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy phiên đăng nhập." });
    }

    await mariaPool.execute(
      "UPDATE admin_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = ?",
      [sessionId],
    );
    await logSecurity(userId, "SESSION_REVOKED", req, { sessionId });

    return res.json({ ok: true });
  },
);

app.post(
  "/api/account/sessions/revoke-others",
  requireAuth,
  async (req, res) => {
    const userId = Number(req.auth.sub);
    const currentSessionId =
      typeof req.auth.sid === "string" ? req.auth.sid : "";

    if (currentSessionId) {
      await mariaPool.execute(
        "UPDATE admin_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE admin_id = ? AND id != ? AND revoked_at IS NULL",
        [userId, currentSessionId],
      );
    } else {
      await mariaPool.execute(
        "UPDATE admin_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE admin_id = ? AND revoked_at IS NULL",
        [userId],
      );
    }

    await logSecurity(userId, "OTHER_SESSIONS_REVOKED", req, {});

    return res.json({ ok: true });
  },
);

app.get("/api/account/security-logs", requireAuth, async (req, res) => {
  const userId = Number(req.auth.sub);
  const limitRaw = Number(req.query.limit || 20);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), 100)
    : 20;

  const [rows] = await mariaPool.execute(
    "SELECT id, action, ip_address, user_agent, meta_json, created_at FROM security_logs WHERE admin_id = ? ORDER BY created_at DESC LIMIT ?",
    [userId, limit],
  );

  return res.json({
    items: (Array.isArray(rows) ? rows : []).map((row) => {
      let meta = {};
      try {
        meta = row.meta_json ? JSON.parse(row.meta_json) : {};
      } catch {
        meta = {};
      }

      return {
        id: row.id,
        action: row.action,
        ipAddress: row.ip_address || "",
        userAgent: row.user_agent || "",
        createdAt: row.created_at,
        meta,
      };
    }),
  });
});

app.get("/api/company-info", requireAuth, async (_req, res) => {
  try {
    const [rows] = await mariaPool.query(
      "SELECT * FROM company_info WHERE id = 1 LIMIT 1",
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy thông tin công ty." });
    }

    const row = rows[0];
    let customFields = [];
    try {
      customFields = row.custom_fields_json
        ? JSON.parse(row.custom_fields_json)
        : [];
      if (!Array.isArray(customFields)) {
        customFields = [];
      }
    } catch {
      customFields = [];
    }

    return res.json({
      id: Number(row.id || 1),
      short_name: row.short_name || "",
      full_name: row.full_name || "",
      slogan: row.slogan || "",
      about: row.about || "",
      tax_code: row.tax_code || "",
      business_license: row.business_license || "",
      legal_representative: row.legal_representative || "",
      established_year: Number(row.established_year || 0),
      phone: row.phone || "",
      hotline: row.hotline || "",
      email: row.email || "",
      contact_email: row.contact_email || "",
      website: row.website || "",
      address: row.address || "",
      map_address: row.map_address || "",
      google_map_embed: row.google_map_embed || "",
      facebook: row.facebook || "",
      zalo: row.zalo || "",
      whatsapp: row.whatsapp || "",
      telegram: row.telegram || "",
      tiktok: row.tiktok || "",
      instagram: row.instagram || "",
      youtube: row.youtube || "",
      wechat: row.wechat || "",
      logo_url: row.logo_url || "",
      intro_image: row.intro_image || "",
      og_image: row.og_image || "",
      favicon_url: row.favicon_url || "",
      meta_title: row.meta_title || "",
      meta_description: row.meta_description || "",
      meta_keywords: row.meta_keywords || "",
      copyright_text: row.copyright_text || "",
      working_hours: row.working_hours || "",
      is_active: Number(row.is_active) === 0 ? 0 : 1,
      created_at: row.created_at
        ? new Date(row.created_at).toISOString().slice(0, 19).replace("T", " ")
        : "",
      updated_at: row.updated_at
        ? new Date(row.updated_at).toISOString().slice(0, 19).replace("T", " ")
        : "",
      custom_fields: customFields,
    });
  } catch (err) {
    console.error("GET /api/company-info error:", err);
    return res
      .status(500)
      .json({ message: "Lỗi đọc dữ liệu company từ MariaDB." });
  }
});

app.put("/api/company-info", requireAuth, async (req, res) => {
  const body = req.body || {};
  const shortName =
    typeof body.short_name === "string" ? body.short_name.trim() : "";
  const fullName =
    typeof body.full_name === "string" ? body.full_name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  if (!shortName || !fullName || !email || !phone) {
    return res.status(400).json({
      message:
        "Thiếu các trường bắt buộc: short_name, full_name, email, phone.",
    });
  }

  const customFields = Array.isArray(body.custom_fields)
    ? body.custom_fields
    : [];

  try {
    const [existing] = await mariaPool.query(
      "SELECT id FROM company_info WHERE id = 1 LIMIT 1",
    );

    if (!Array.isArray(existing) || existing.length === 0) {
      await mariaPool.query(
        "INSERT INTO company_info (id, short_name, full_name, email, phone) VALUES (1, ?, ?, ?, ?)",
        [shortName, fullName, email, phone],
      );
    }

    await mariaPool.query(
      "UPDATE company_info SET short_name = ?, full_name = ?, slogan = ?, about = ?, tax_code = ?, business_license = ?, legal_representative = ?, established_year = ?, phone = ?, hotline = ?, email = ?, contact_email = ?, website = ?, address = ?, map_address = ?, google_map_embed = ?, facebook = ?, zalo = ?, whatsapp = ?, telegram = ?, tiktok = ?, instagram = ?, youtube = ?, wechat = ?, logo_url = ?, intro_image = ?, og_image = ?, favicon_url = ?, meta_title = ?, meta_description = ?, meta_keywords = ?, copyright_text = ?, working_hours = ?, is_active = ?, custom_fields_json = ? WHERE id = 1",
      [
        shortName,
        fullName,
        typeof body.slogan === "string" ? body.slogan.trim() : "",
        typeof body.about === "string" ? body.about.trim() : "",
        typeof body.tax_code === "string" ? body.tax_code.trim() : "",
        typeof body.business_license === "string"
          ? body.business_license.trim()
          : "",
        typeof body.legal_representative === "string"
          ? body.legal_representative.trim()
          : "",
        Number.isFinite(Number(body.established_year))
          ? Number(body.established_year)
          : 0,
        phone,
        typeof body.hotline === "string" ? body.hotline.trim() : "",
        email,
        typeof body.contact_email === "string" ? body.contact_email.trim() : "",
        typeof body.website === "string" ? body.website.trim() : "",
        typeof body.address === "string" ? body.address.trim() : "",
        typeof body.map_address === "string" ? body.map_address.trim() : "",
        typeof body.google_map_embed === "string" ? body.google_map_embed : "",
        typeof body.facebook === "string" ? body.facebook.trim() : "",
        typeof body.zalo === "string" ? body.zalo.trim() : "",
        typeof body.whatsapp === "string" ? body.whatsapp.trim() : "",
        typeof body.telegram === "string" ? body.telegram.trim() : "",
        typeof body.tiktok === "string" ? body.tiktok.trim() : "",
        typeof body.instagram === "string" ? body.instagram.trim() : "",
        typeof body.youtube === "string" ? body.youtube.trim() : "",
        typeof body.wechat === "string" ? body.wechat.trim() : "",
        typeof body.logo_url === "string" ? body.logo_url.trim() : "",
        typeof body.intro_image === "string" ? body.intro_image.trim() : "",
        typeof body.og_image === "string" ? body.og_image.trim() : "",
        typeof body.favicon_url === "string" ? body.favicon_url.trim() : "",
        typeof body.meta_title === "string" ? body.meta_title.trim() : "",
        typeof body.meta_description === "string"
          ? body.meta_description.trim()
          : "",
        typeof body.meta_keywords === "string" ? body.meta_keywords.trim() : "",
        typeof body.copyright_text === "string"
          ? body.copyright_text.trim()
          : "",
        typeof body.working_hours === "string" ? body.working_hours.trim() : "",
        Number(body.is_active) === 0 ? 0 : 1,
        JSON.stringify(customFields),
      ],
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/company-info error:", err);
    return res
      .status(500)
      .json({ message: "Lỗi ghi dữ liệu company vào MariaDB." });
  }
});

function normalizeNewsPayload(body) {
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
  const image = typeof body?.image === "string" ? body.image.trim() : "";
  const category =
    typeof body?.category === "string" ? body.category.trim() : "Tin Tức";
  const author =
    typeof body?.author === "string" ? body.author.trim() : "Admin";
  const publishedAt =
    typeof body?.published_at === "string" ? body.published_at.trim() : "";

  return {
    title,
    content,
    slug,
    image,
    category,
    author,
    published_at: publishedAt,
    is_active: Number(body?.is_active) === 0 ? 0 : 1,
  };
}

function mapNewsRow(row) {
  return {
    id: Number(row.id || 0),
    slug: row.slug || "",
    title: row.title || "",
    content: row.content || "",
    image: row.image || "",
    category: row.category || "Tin Tức",
    author: row.author || "Admin",
    is_active: Number(row.is_active) === 0 ? 0 : 1,
    published_at: row.published_at
      ? new Date(row.published_at).toISOString().slice(0, 19).replace("T", " ")
      : "",
    created_at: row.created_at
      ? new Date(row.created_at).toISOString().slice(0, 19).replace("T", " ")
      : "",
    updated_at: row.updated_at
      ? new Date(row.updated_at).toISOString().slice(0, 19).replace("T", " ")
      : "",
  };
}

async function listNewsItems(_req, res) {
  try {
    const [rows] = await mariaPool.query(
      "SELECT id, slug, title, content, image, category, author, is_active, published_at, created_at, updated_at FROM news_items ORDER BY id DESC",
    );

    return res.json((Array.isArray(rows) ? rows : []).map(mapNewsRow));
  } catch (err) {
    console.error("GET /api/news-items error:", err);
    return res.status(500).json({ message: "Lỗi đọc danh sách tin tức." });
  }
}

app.get("/api/news-items", requireAuth, listNewsItems);
app.get("/api/news_items", requireAuth, listNewsItems);

async function createNewsItem(req, res) {
  const payload = normalizeNewsPayload(req.body || {});
  if (!payload.title || !payload.content || !payload.slug) {
    return res.status(400).json({ message: "Thiếu title, content hoặc slug." });
  }

  try {
    const [result] = await mariaPool.execute(
      "INSERT INTO news_items (slug, title, content, image, category, author, is_active, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        payload.slug,
        payload.title,
        payload.content,
        payload.image,
        payload.category,
        payload.author,
        payload.is_active,
        payload.published_at || null,
      ],
    );

    const insertedId = Number(result.insertId || 0);
    const [rows] = await mariaPool.execute(
      "SELECT id, slug, title, content, image, category, author, is_active, published_at, created_at, updated_at FROM news_items WHERE id = ? LIMIT 1",
      [insertedId],
    );
    const row = Array.isArray(rows) ? rows[0] : null;

    return res.status(201).json(row ? mapNewsRow(row) : { id: insertedId });
  } catch (err) {
    console.error("POST /api/news-items error:", err);
    return res.status(500).json({ message: "Lỗi tạo tin tức." });
  }
}

app.post("/api/news-items", requireAuth, createNewsItem);
app.post("/api/news_items", requireAuth, createNewsItem);

async function updateNewsItem(req, res) {
  const id = Number(req.params.id || 0);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ message: "ID tin tức không hợp lệ." });
  }

  const payload = normalizeNewsPayload(req.body || {});
  if (!payload.title || !payload.content || !payload.slug) {
    return res.status(400).json({ message: "Thiếu title, content hoặc slug." });
  }

  try {
    const [result] = await mariaPool.execute(
      "UPDATE news_items SET slug = ?, title = ?, content = ?, image = ?, category = ?, author = ?, is_active = ?, published_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [
        payload.slug,
        payload.title,
        payload.content,
        payload.image,
        payload.category,
        payload.author,
        payload.is_active,
        payload.published_at || null,
        id,
      ],
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Không tìm thấy tin tức." });
    }

    const [rows] = await mariaPool.execute(
      "SELECT id, slug, title, content, image, category, author, is_active, published_at, created_at, updated_at FROM news_items WHERE id = ? LIMIT 1",
      [id],
    );
    const row = Array.isArray(rows) ? rows[0] : null;

    return res.json(row ? mapNewsRow(row) : { id });
  } catch (err) {
    console.error("PUT /api/news-items/:id error:", err);
    return res.status(500).json({ message: "Lỗi cập nhật tin tức." });
  }
}

app.put("/api/news-items/:id", requireAuth, updateNewsItem);
app.put("/api/news_items/:id", requireAuth, updateNewsItem);

async function deleteNewsItem(req, res) {
  const id = Number(req.params.id || 0);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ message: "ID tin tức không hợp lệ." });
  }

  try {
    const [result] = await mariaPool.execute(
      "DELETE FROM news_items WHERE id = ?",
      [id],
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Không tìm thấy tin tức." });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/news-items/:id error:", err);
    return res.status(500).json({ message: "Lỗi xóa tin tức." });
  }
}

app.delete("/api/news-items/:id", requireAuth, deleteNewsItem);
app.delete("/api/news_items/:id", requireAuth, deleteNewsItem);

function normalizeBrandPayload(body) {
  return {
    name: typeof body?.name === "string" ? body.name.trim() : "",
    brand: typeof body?.brand === "string" ? body.brand.trim() : "",
    link: typeof body?.link === "string" ? body.link.trim() : "",
    is_active: Number(body?.is_active) === 0 ? 0 : 1,
  };
}

function slugifyBrand(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getProductItemsRootDir() {
  const configured =
    typeof process.env.PRODUCT_ITEMS_DIR === "string"
      ? process.env.PRODUCT_ITEMS_DIR.trim()
      : "";

  if (configured) {
    return path.resolve(configured);
  }

  return path.resolve(process.cwd(), "product-items");
}

async function ensureBrandProductsTemplateFile(brandValue) {
  const folderName = slugifyBrand(brandValue);
  if (!folderName) {
    return;
  }

  const rootDir = getProductItemsRootDir();
  const brandDir = path.join(rootDir, folderName);
  const productFile = path.join(brandDir, "products.json");

  await fs.mkdir(brandDir, { recursive: true });

  const template = [
    {
      id: "",
      model: "",
      date: "",
      contact: "",
      status: "",
      price: "",
      badge: "",
      image: "",
    },
  ];

  try {
    await fs.access(productFile);
  } catch {
    await fs.writeFile(productFile, JSON.stringify(template, null, 2), "utf8");
  }
}

function mapBrandRow(row) {
  return {
    id: Number(row.id || 0),
    name: row.name || "",
    brand: row.brand || "",
    link: row.link || "",
    is_active: Number(row.is_active) === 0 ? 0 : 1,
    created_at: row.created_at
      ? new Date(row.created_at).toISOString().slice(0, 19).replace("T", " ")
      : "",
  };
}

async function generateNextProductId(owner) {
  const ownerCode = extractOwnerCode(owner);
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `${ownerCode}${dd}${mm}`;
  const [[countRow]] = await mariaPool.query(
    "SELECT COUNT(*) AS cnt FROM product_items WHERE id LIKE ?",
    [`${prefix}%`],
  );
  const seq = String(Number(countRow?.cnt || 0) + 1).padStart(2, "0");
  return `${prefix}${seq}`;
}

async function listBrandItems(_req, res) {
  try {
    const [rows] = await mariaPool.query(
      "SELECT id, name, brand, link, is_active, created_at FROM brand_items ORDER BY id ASC",
    );
    return res.json((Array.isArray(rows) ? rows : []).map(mapBrandRow));
  } catch (err) {
    console.error("GET /api/brand_items error:", err);
    return res.status(500).json({ message: "Lỗi đọc danh sách nhãn hiệu." });
  }
}

app.get("/api/brand_items", requireAuth, listBrandItems);
app.get("/api/brand-items", requireAuth, listBrandItems);
app.get("/api/brands", requireAuth, listBrandItems);

async function createBrandItem(req, res) {
  const payload = normalizeBrandPayload(req.body || {});
  if (!payload.name || !payload.brand || !payload.link) {
    return res.status(400).json({ message: "Thiếu name, brand hoặc link." });
  }

  try {
    const [result] = await mariaPool.execute(
      "INSERT INTO brand_items (name, brand, link, is_active) VALUES (?, ?, ?, ?)",
      [payload.name, payload.brand, payload.link, payload.is_active],
    );

    const insertedId = Number(result.insertId || 0);
    {
      const generatedId = await generateNextProductId("DS");
      await mariaPool.execute(
        "INSERT INTO product_items (id, brand_id, name, link, owner, model, `date`, contact, status, price, badge, image, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          generatedId,
          insertedId,
          payload.name,
          payload.link,
          "DS",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          0,
          1,
        ],
      );
    }

    const [rows] = await mariaPool.execute(
      "SELECT id, name, brand, link, is_active, created_at FROM brand_items WHERE id = ? LIMIT 1",
      [insertedId],
    );
    const row = Array.isArray(rows) ? rows[0] : null;
    return res.status(201).json(row ? mapBrandRow(row) : { id: insertedId });
  } catch (err) {
    console.error("POST /api/brand_items error:", err);
    return res.status(500).json({ message: "Lỗi tạo nhãn hiệu." });
  }
}

app.post("/api/brand_items", requireAuth, createBrandItem);
app.post("/api/brand-items", requireAuth, createBrandItem);

async function updateBrandItem(req, res) {
  const id = Number(req.params.id || 0);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ message: "ID nhãn hiệu không hợp lệ." });
  }

  const payload = normalizeBrandPayload(req.body || {});
  if (!payload.name || !payload.brand || !payload.link) {
    return res.status(400).json({ message: "Thiếu name, brand hoặc link." });
  }

  try {
    const [result] = await mariaPool.execute(
      "UPDATE brand_items SET name = ?, brand = ?, link = ?, is_active = ? WHERE id = ?",
      [payload.name, payload.brand, payload.link, payload.is_active, id],
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Không tìm thấy nhãn hiệu." });
    }

    const [rows] = await mariaPool.execute(
      "SELECT id, name, brand, link, is_active, created_at FROM brand_items WHERE id = ? LIMIT 1",
      [id],
    );
    const row = Array.isArray(rows) ? rows[0] : null;
    return res.json(row ? mapBrandRow(row) : { id });
  } catch (err) {
    console.error("PUT /api/brand_items/:id error:", err);
    return res.status(500).json({ message: "Lỗi cập nhật nhãn hiệu." });
  }
}

app.put("/api/brand_items/:id", requireAuth, updateBrandItem);
app.put("/api/brand-items/:id", requireAuth, updateBrandItem);

async function deleteBrandItem(req, res) {
  const id = Number(req.params.id || 0);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ message: "ID nhãn hiệu không hợp lệ." });
  }

  try {
    await mariaPool.execute("DELETE FROM product_items WHERE brand_id = ?", [
      id,
    ]);
    await mariaPool.execute("DELETE FROM brand_models WHERE brand_id = ?", [
      id,
    ]);

    const [result] = await mariaPool.execute(
      "DELETE FROM brand_items WHERE id = ?",
      [id],
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Không tìm thấy nhãn hiệu." });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/brand_items/:id error:", err);
    return res.status(500).json({ message: "Lỗi xóa nhãn hiệu." });
  }
}

app.delete("/api/brand_items/:id", requireAuth, deleteBrandItem);
app.delete("/api/brand-items/:id", requireAuth, deleteBrandItem);

// ── Brand Models ─────────────────────────────────────────────────────────────

async function listBrandModels(req, res) {
  const brandId = Number(req.query.brand_id || 0);
  if (!Number.isFinite(brandId) || brandId <= 0) {
    return res.status(400).json({ message: "brand_id không hợp lệ." });
  }
  try {
    const [rows] = await mariaPool.execute(
      "SELECT id, brand_id, model_name, created_at FROM brand_models WHERE brand_id = ? ORDER BY created_at ASC",
      [brandId],
    );
    return res.json(Array.isArray(rows) ? rows : []);
  } catch (err) {
    console.error("GET /api/brand_models error:", err);
    return res.status(500).json({ message: "Lỗi tải danh sách model." });
  }
}

async function createBrandModel(req, res) {
  const brandId = Number(req.body?.brand_id || 0);
  const modelName = String(req.body?.model_name || "").trim();

  if (!Number.isFinite(brandId) || brandId <= 0) {
    return res.status(400).json({ message: "brand_id không hợp lệ." });
  }
  if (!modelName) {
    return res.status(400).json({ message: "Tên model không được để trống." });
  }

  try {
    const [result] = await mariaPool.execute(
      "INSERT INTO brand_models (brand_id, model_name) VALUES (?, ?)",
      [brandId, modelName],
    );
    const insertId = result.insertId;
    const [rows] = await mariaPool.execute(
      "SELECT id, brand_id, model_name, created_at FROM brand_models WHERE id = ? LIMIT 1",
      [insertId],
    );
    const item = Array.isArray(rows) ? rows[0] : null;
    return res
      .status(201)
      .json(item ?? { id: insertId, brand_id: brandId, model_name: modelName });
  } catch (err) {
    console.error("POST /api/brand_models error:", err);
    return res.status(500).json({ message: "Lỗi thêm model." });
  }
}

async function deleteBrandModel(req, res) {
  const id = Number(req.params.id || 0);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ message: "ID model không hợp lệ." });
  }
  try {
    const [result] = await mariaPool.execute(
      "DELETE FROM brand_models WHERE id = ?",
      [id],
    );
    if (!result.affectedRows) {
      return res.status(404).json({ message: "Không tìm thấy model." });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/brand_models/:id error:", err);
    return res.status(500).json({ message: "Lỗi xóa model." });
  }
}

app.get("/api/brand_models", requireAuth, listBrandModels);
app.post("/api/brand_models", requireAuth, createBrandModel);
app.delete("/api/brand_models/:id", requireAuth, deleteBrandModel);

// ─────────────────────────────────────────────────────────────────────────────

function extractOwnerCode(owner) {
  const parenMatch = /\(([^)]+)\)/.exec(owner || "");
  if (parenMatch) return parenMatch[1].trim().toUpperCase().replace(/\s+/g, "");
  const upper = (owner || "").replace(/[^A-Za-z]/g, "").toUpperCase();
  return upper.slice(0, 4) || "XX";
}

function normalizeProductPayload(body) {
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const link = typeof body?.link === "string" ? body.link.trim() : "";
  const owner = typeof body?.owner === "string" ? body.owner.trim() : "";
  const model = typeof body?.model === "string" ? body.model.trim() : "";
  const date = typeof body?.date === "string" ? body.date.trim() : "";
  const contact = typeof body?.contact === "string" ? body.contact.trim() : "";
  const status = typeof body?.status === "string" ? body.status.trim() : "";
  const price = typeof body?.price === "string" ? body.price.trim() : "";
  const badge = typeof body?.badge === "string" ? body.badge.trim() : "";
  const image = typeof body?.image === "string" ? body.image.trim() : "";
  const sortOrder = Number.isFinite(Number(body?.sort_order))
    ? Number(body.sort_order)
    : 0;
  const brandId =
    body?.brand_id === null || body?.brand_id === ""
      ? null
      : Number.isFinite(Number(body?.brand_id)) && Number(body?.brand_id) > 0
        ? Number(body.brand_id)
        : null;

  return {
    brand_id: brandId,
    name,
    link,
    owner,
    model,
    date,
    contact,
    status,
    price,
    badge,
    image,
    sort_order: sortOrder,
    is_active: Number(body?.is_active) === 0 ? 0 : 1,
  };
}

function mapProductRow(row) {
  return {
    id: String(row.id || ""),
    brand_id:
      row.brand_id === null || typeof row.brand_id === "undefined"
        ? null
        : Number(row.brand_id || 0),
    name: row.name || "",
    link: row.link || "",
    owner: row.owner || "",
    model: row.model || "",
    date: row.date || "",
    contact: row.contact || "",
    status: row.status || "",
    price: row.price || "",
    badge: row.badge || "",
    image: row.image || "",
    sort_order: Number(row.sort_order || 0),
    is_active: Number(row.is_active) === 0 ? 0 : 1,
    created_at: "",
  };
}

async function listProductItems(_req, res) {
  try {
    const [rows] = await mariaPool.query(
      "SELECT id, brand_id, name, link, owner, model, `date`, contact, status, price, badge, image, sort_order, is_active, created_at FROM product_items ORDER BY sort_order ASC, created_at DESC",
    );
    return res.json((Array.isArray(rows) ? rows : []).map(mapProductRow));
  } catch (err) {
    console.error("GET /api/product_items error:", err);
    return res.status(500).json({ message: "Lỗi đọc danh sách sản phẩm." });
  }
}

app.get("/api/product_items", requireAuth, listProductItems);
app.get("/api/product-items", requireAuth, listProductItems);
app.get("/api/products", requireAuth, listProductItems);

async function createProductItem(req, res) {
  const payload = normalizeProductPayload(req.body || {});
  if (!payload.name || !payload.link || !payload.owner) {
    return res.status(400).json({ message: "Thiếu name, link hoặc owner." });
  }

  try {
    const generatedId = await generateNextProductId(payload.owner);

    const [result] = await mariaPool.execute(
      "INSERT INTO product_items (id, brand_id, name, link, owner, model, `date`, contact, status, price, badge, image, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        generatedId,
        payload.brand_id,
        payload.name,
        payload.link,
        payload.owner,
        payload.model,
        payload.date,
        payload.contact,
        payload.status,
        payload.price,
        payload.badge,
        payload.image,
        payload.sort_order,
        payload.is_active,
      ],
    );

    const insertedId = generatedId;
    const [rows] = await mariaPool.execute(
      "SELECT id, brand_id, name, link, owner, model, `date`, contact, status, price, badge, image, sort_order, is_active, created_at FROM product_items WHERE id = ? LIMIT 1",
      [insertedId],
    );
    const row = Array.isArray(rows) ? rows[0] : null;
    return res.status(201).json(row ? mapProductRow(row) : { id: insertedId });
  } catch (err) {
    console.error("POST /api/product_items error:", err);
    return res.status(500).json({ message: "Lỗi tạo sản phẩm." });
  }
}

app.post("/api/product_items", requireAuth, createProductItem);
app.post("/api/product-items", requireAuth, createProductItem);

async function updateProductItem(req, res) {
  const id = String(req.params.id || "").trim();
  if (!id) {
    return res.status(400).json({ message: "ID sản phẩm không hợp lệ." });
  }

  const payload = normalizeProductPayload(req.body || {});
  if (!payload.name || !payload.link || !payload.owner) {
    return res.status(400).json({ message: "Thiếu name, link hoặc owner." });
  }

  try {
    const [result] = await mariaPool.execute(
      "UPDATE product_items SET brand_id = ?, name = ?, link = ?, owner = ?, model = ?, `date` = ?, contact = ?, status = ?, price = ?, badge = ?, image = ?, sort_order = ?, is_active = ? WHERE id = ?",
      [
        payload.brand_id,
        payload.name,
        payload.link,
        payload.owner,
        payload.model,
        payload.date,
        payload.contact,
        payload.status,
        payload.price,
        payload.badge,
        payload.image,
        payload.sort_order,
        payload.is_active,
        id,
      ],
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm." });
    }

    const [rows] = await mariaPool.execute(
      "SELECT id, brand_id, name, link, owner, model, `date`, contact, status, price, badge, image, sort_order, is_active, created_at FROM product_items WHERE id = ? LIMIT 1",
      [id],
    );
    const row = Array.isArray(rows) ? rows[0] : null;
    return res.json(row ? mapProductRow(row) : { id });
  } catch (err) {
    console.error("PUT /api/product_items/:id error:", err);
    return res.status(500).json({ message: "Lỗi cập nhật sản phẩm." });
  }
}

app.put("/api/product_items/:id", requireAuth, updateProductItem);
app.put("/api/product-items/:id", requireAuth, updateProductItem);

async function deleteProductItem(req, res) {
  const id = String(req.params.id || "").trim();
  if (!id) {
    return res.status(400).json({ message: "ID sản phẩm không hợp lệ." });
  }

  try {
    const [targetRows] = await mariaPool.execute(
      "SELECT id, brand_id FROM product_items WHERE id = ? LIMIT 1",
      [id],
    );
    const target = Array.isArray(targetRows) ? targetRows[0] : null;

    if (!target) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm." });
    }

    if (target.brand_id === null) {
      const [usedRows] = await mariaPool.execute(
        "SELECT id FROM product_items WHERE brand_id = ? LIMIT 1",
        [id],
      );
      if (Array.isArray(usedRows) && usedRows.length > 0) {
        return res.status(409).json({
          message: "Nhãn hiệu đang có sản phẩm, không thể xóa.",
        });
      }
    }

    const [result] = await mariaPool.execute(
      "DELETE FROM product_items WHERE id = ?",
      [id],
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm." });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/product_items/:id error:", err);
    return res.status(500).json({ message: "Lỗi xóa sản phẩm." });
  }
}

app.delete("/api/product_items/:id", requireAuth, deleteProductItem);
app.delete("/api/product-items/:id", requireAuth, deleteProductItem);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

async function ensureCompanyColumns() {
  const columns = [
    ["about", "TEXT NULL"],
    ["business_license", "VARCHAR(100) NULL"],
    ["legal_representative", "VARCHAR(255) NULL"],
    ["contact_email", "VARCHAR(255) NULL"],
    ["whatsapp", "VARCHAR(500) NULL"],
    ["og_image", "VARCHAR(500) NULL"],
    ["copyright_text", "TEXT NULL"],
    ["custom_fields_json", "LONGTEXT NULL"],
  ];

  for (const [name, def] of columns) {
    await mariaPool.query(
      `ALTER TABLE company_info ADD COLUMN IF NOT EXISTS ${name} ${def}`,
    );
  }
}

async function ensureProductColumns() {
  const productColumns = [
    ["brand_id", "INT UNSIGNED NULL"],
    ["owner", "VARCHAR(120) NOT NULL DEFAULT ''"],
    ["model", "VARCHAR(255) NOT NULL DEFAULT ''"],
    ["date", "VARCHAR(120) NOT NULL DEFAULT ''"],
    ["contact", "VARCHAR(255) NOT NULL DEFAULT ''"],
    ["status", "VARCHAR(120) NOT NULL DEFAULT ''"],
    ["price", "VARCHAR(255) NOT NULL DEFAULT ''"],
    ["badge", "VARCHAR(120) NOT NULL DEFAULT ''"],
    ["image", "VARCHAR(500) NOT NULL DEFAULT ''"],
    ["created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"],
  ];

  for (const [name, def] of productColumns) {
    await mariaPool.query(
      `ALTER TABLE product_items ADD COLUMN IF NOT EXISTS \`${name}\` ${def}`,
    );
  }
}

async function ensureProductIdAsCode() {
  const [idRows] = await mariaPool.query(
    "SHOW COLUMNS FROM product_items LIKE 'id'",
  );
  const idCol = Array.isArray(idRows) && idRows[0] ? idRows[0] : null;
  const idType = String(idCol?.Type || "").toLowerCase();

  if (!idType.includes("int")) {
    await mariaPool.query(
      "ALTER TABLE product_items DROP COLUMN IF EXISTS product_code",
    );
    return;
  }

  await mariaPool.query(
    "ALTER TABLE product_items ADD COLUMN IF NOT EXISTS id_new VARCHAR(30) NOT NULL DEFAULT ''",
  );

  const [codeRows] = await mariaPool.query(
    "SHOW COLUMNS FROM product_items LIKE 'product_code'",
  );
  const hasProductCode = Array.isArray(codeRows) && codeRows.length > 0;

  if (hasProductCode) {
    await mariaPool.query(
      "UPDATE product_items SET id_new = COALESCE(NULLIF(product_code, ''), CONCAT('LEG', LPAD(id, 6, '0'))) WHERE id_new = ''",
    );
  } else {
    await mariaPool.query(
      "UPDATE product_items SET id_new = CONCAT('LEG', LPAD(id, 6, '0')) WHERE id_new = ''",
    );
  }

  await mariaPool.query(
    "ALTER TABLE product_items MODIFY COLUMN id INT UNSIGNED NOT NULL",
  );
  await mariaPool.query("ALTER TABLE product_items DROP PRIMARY KEY");
  await mariaPool.query("ALTER TABLE product_items DROP COLUMN id");
  await mariaPool.query(
    "ALTER TABLE product_items CHANGE COLUMN id_new id VARCHAR(30) NOT NULL",
  );
  await mariaPool.query("ALTER TABLE product_items ADD PRIMARY KEY (id)");
  await mariaPool.query(
    "ALTER TABLE product_items DROP COLUMN IF EXISTS product_code",
  );
}

async function ensureBrandTable() {
  await mariaPool.query(
    "CREATE TABLE IF NOT EXISTS brand_items (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, brand VARCHAR(100) NOT NULL, link VARCHAR(255) NOT NULL, is_active TINYINT(1) NOT NULL DEFAULT 1, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  );

  await mariaPool.query(
    "ALTER TABLE brand_items ADD COLUMN IF NOT EXISTS brand VARCHAR(100) NOT NULL DEFAULT '' AFTER name",
  );
  await mariaPool.query(
    "UPDATE brand_items SET brand = LOWER(REPLACE(name, 'MÁY CÔNG TRÌNH ', '')) WHERE brand = '' OR brand IS NULL",
  );

  await mariaPool.query(
    "INSERT INTO brand_items (name, brand, link, is_active) SELECT 'Hitachi', 'hitachi', 'https://maycongtrinhnhapkhau.com.vn/hitachi', 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM brand_items WHERE name = 'Hitachi')",
  );
  await mariaPool.query(
    "INSERT INTO brand_items (name, brand, link, is_active) SELECT 'Komatsu', 'komatsu', 'https://maycongtrinhnhapkhau.com.vn/komatsu', 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM brand_items WHERE name = 'Komatsu')",
  );
  await mariaPool.query(
    "INSERT INTO brand_items (name, brand, link, is_active) SELECT 'Kobelco', 'kobelco', 'https://maycongtrinhnhapkhau.com.vn/kobelco', 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM brand_items WHERE name = 'Kobelco')",
  );

  await mariaPool.query(
    "UPDATE product_items p LEFT JOIN brand_items b ON b.name = p.name SET p.brand_id = b.id WHERE p.brand_id IS NULL AND b.id IS NOT NULL",
  );
}

async function initSchema() {
  await mariaPool.query(
    "CREATE TABLE IF NOT EXISTS admins (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(120) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, is_active TINYINT NOT NULL DEFAULT 1, full_name VARCHAR(255) NULL, email VARCHAR(255) NULL, phone VARCHAR(50) NULL, twofa_enabled TINYINT NOT NULL DEFAULT 0, twofa_secret TEXT NULL, twofa_pending_secret TEXT NULL, token_version INT NOT NULL DEFAULT 1, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  );

  await mariaPool.query(
    "CREATE TABLE IF NOT EXISTS admin_sessions (id VARCHAR(64) PRIMARY KEY, admin_id INT NOT NULL, ip_address VARCHAR(100) NULL, user_agent TEXT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, revoked_at TIMESTAMP NULL, INDEX idx_admin_sessions_admin_id (admin_id))",
  );

  await mariaPool.query(
    "CREATE TABLE IF NOT EXISTS security_logs (id BIGINT AUTO_INCREMENT PRIMARY KEY, admin_id INT NOT NULL, action VARCHAR(120) NOT NULL, ip_address VARCHAR(100) NULL, user_agent TEXT NULL, meta_json LONGTEXT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX idx_security_logs_admin_created (admin_id, created_at))",
  );

  await ensureCompanyColumns();
  await ensureProductColumns();
  await ensureProductIdAsCode();
  await ensureBrandTable();
  await mariaPool.query(
    "CREATE TABLE IF NOT EXISTS brand_models (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, brand_id INT UNSIGNED NOT NULL, model_name VARCHAR(255) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX idx_brand_models_brand_id (brand_id))",
  );

  const [adminRows] = await mariaPool.query(
    "SELECT COUNT(*) AS c FROM admins WHERE is_active = 1",
  );
  const activeAdmins =
    Array.isArray(adminRows) && adminRows[0] ? Number(adminRows[0].c || 0) : 0;

  if (activeAdmins === 0) {
    const defaultHash = bcrypt.hashSync("admin123", 12);
    await mariaPool.execute(
      "INSERT INTO admins (username, password_hash, is_active, full_name) VALUES (?, ?, 1, ?)",
      ["admin", defaultHash, "Administrator"],
    );
  }
}

async function start() {
  await initSchema();
  const port = Number(process.env.PORT || 3002);
  app.listen(port, () => console.log("API running on port", port));
}

start().catch((err) => {
  console.error("Failed to start API:", err);
  process.exit(1);
});
