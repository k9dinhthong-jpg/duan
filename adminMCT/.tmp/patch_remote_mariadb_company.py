from pathlib import Path

p = Path('/opt/admin-mct-api/server.js')
s = p.read_text()

if 'const mysql = require("mysql2/promise");' not in s:
    s = s.replace(
        'const Database = require("better-sqlite3");\n',
        'const Database = require("better-sqlite3");\nconst mysql = require("mysql2/promise");\n',
    )

if 'const mariaPool = mysql.createPool(' not in s:
    anchor = 'const db = new Database("/var/lib/admin-mct/admin.db");\n\n'
    pool_block = '''const db = new Database("/var/lib/admin-mct/admin.db");

const mariaPool = mysql.createPool({
  host: process.env.MARIA_HOST || "127.0.0.1",
  port: Number(process.env.MARIA_PORT || 3306),
  user: process.env.MARIA_USER || "adminmct_api",
  password: process.env.MARIA_PASSWORD || "MctApi@2026!DB",
  database: process.env.MARIA_DB || "maycongtrinh_db",
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

'''
    s = s.replace(anchor, pool_block)

old_routes = '''app.get("/api/company-info", requireAuth, (_req, res) => {
  const row = db
    .prepare("SELECT data_json FROM company_info_store WHERE id = 1")
    .get();

  if (!row) {
    return res.status(404).json({ message: "Không tìm thấy thông tin công ty." });
  }

  try {
    const data = JSON.parse(row.data_json || "{}");
    return res.json(data);
  } catch {
    return res.status(500).json({ message: "Dữ liệu company bị lỗi JSON." });
  }
});

app.put("/api/company-info", requireAuth, (req, res) => {
  const body = req.body || {};
  const shortName = typeof body.short_name === "string" ? body.short_name.trim() : "";
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  if (!shortName || !fullName || !email || !phone) {
    return res.status(400).json({
      message: "Thiếu các trường bắt buộc: short_name, full_name, email, phone.",
    });
  }

  const payload = {
    ...body,
    id: 1,
    short_name: shortName,
    full_name: fullName,
    email,
    phone,
    is_active: Number(body.is_active) === 0 ? 0 : 1,
    custom_fields: Array.isArray(body.custom_fields) ? body.custom_fields : [],
    updated_at: new Date().toISOString().slice(0, 19).replace("T", " "),
  };

  db.prepare(
    "UPDATE company_info_store SET data_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1",
  ).run(JSON.stringify(payload));

  return res.json({ ok: true });
});
'''

new_routes = '''app.get("/api/company-info", requireAuth, async (_req, res) => {
  try {
    const [rows] = await mariaPool.query(
      "SELECT * FROM company_info WHERE id = 1 LIMIT 1",
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy thông tin công ty." });
    }

    const row = rows[0];
    let customFields = [];
    try {
      customFields = row.custom_fields_json ? JSON.parse(row.custom_fields_json) : [];
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
    return res.status(500).json({ message: "Lỗi đọc dữ liệu company từ MariaDB." });
  }
});

app.put("/api/company-info", requireAuth, async (req, res) => {
  const body = req.body || {};
  const shortName = typeof body.short_name === "string" ? body.short_name.trim() : "";
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  if (!shortName || !fullName || !email || !phone) {
    return res.status(400).json({
      message: "Thiếu các trường bắt buộc: short_name, full_name, email, phone.",
    });
  }

  const customFields = Array.isArray(body.custom_fields) ? body.custom_fields : [];

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
        typeof body.business_license === "string" ? body.business_license.trim() : "",
        typeof body.legal_representative === "string" ? body.legal_representative.trim() : "",
        Number.isFinite(Number(body.established_year)) ? Number(body.established_year) : 0,
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
        typeof body.meta_description === "string" ? body.meta_description.trim() : "",
        typeof body.meta_keywords === "string" ? body.meta_keywords.trim() : "",
        typeof body.copyright_text === "string" ? body.copyright_text.trim() : "",
        typeof body.working_hours === "string" ? body.working_hours.trim() : "",
        Number(body.is_active) === 0 ? 0 : 1,
        JSON.stringify(customFields),
      ],
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/company-info error:", err);
    return res.status(500).json({ message: "Lỗi ghi dữ liệu company vào MariaDB." });
  }
});
'''

if old_routes in s:
    s = s.replace(old_routes, new_routes)
else:
    raise SystemExit('Cannot find old company routes block')

p.write_text(s)
print('patched-mariadb-routes-ok')
