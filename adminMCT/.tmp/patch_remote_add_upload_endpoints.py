from pathlib import Path

p = Path('/opt/admin-mct-api/server.js')
s = p.read_text()

if 'const multer = require("multer");' not in s:
    s = s.replace(
        'const mysql = require("mysql2/promise");\n',
        'const mysql = require("mysql2/promise");\nconst multer = require("multer");\n',
    )

marker = 'app.get("/api/company-info", requireAuth, async (_req, res) => {'
if 'app.post("/api/upload", requireAuth' not in s:
    block = '''const WEBSITE_UPLOAD_ROOT =
  process.env.UPLOAD_ROOT || "/var/www/maycongtrinhnhapkhau.com.vn";
const IMAGE_UPLOAD_ROOT = path.join(WEBSITE_UPLOAD_ROOT, "img");
const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(process.env.UPLOAD_MAX_BYTES || 50 * 1024 * 1024),
  },
});

function sanitizeUploadFileName(value, fallback = "upload.bin") {
  const normalized = String(value || "")
    .replace(/\\\\/g, "/")
    .split("/")
    .pop()
    ?.trim();

  if (!normalized) {
    return fallback;
  }

  return normalized.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function resolveUploadRelativePath(body = {}, file = {}) {
  const bodyPath =
    typeof body.path === "string" && body.path.trim() ? body.path.trim() : "";
  const bodyFolder =
    typeof body.folder === "string" && body.folder.trim()
      ? body.folder.trim()
      : "";
  const bodyFileName =
    typeof body.filename === "string" && body.filename.trim()
      ? body.filename.trim()
      : "";

  let relative = "";
  if (bodyPath) {
    relative = bodyPath.split("?")[0].split("#")[0].replace(/\\\\/g, "/");
    if (relative.startsWith("/")) {
      relative = relative.slice(1);
    }
    if (relative.startsWith("img/")) {
      relative = relative.slice(4);
    }
  } else {
    const folder = bodyFolder.replace(/\\\\/g, "/").replace(/^\/+/, "");
    const fileName = sanitizeUploadFileName(
      bodyFileName || file.originalname,
      "upload.bin",
    );
    relative = folder ? `${folder}/${fileName}` : fileName;
    if (relative.startsWith("img/")) {
      relative = relative.slice(4);
    }
  }

  const normalized = path.posix.normalize(relative).replace(/^\/+/, "");
  if (!normalized || normalized.startsWith("..") || normalized.includes("/../")) {
    throw new Error("Đường dẫn upload không hợp lệ.");
  }

  return normalized;
}

async function handleImageUpload(req, res) {
  const files = req.files || {};
  const file =
    (Array.isArray(files.file) ? files.file[0] : null) ||
    (Array.isArray(files.image) ? files.image[0] : null);

  if (!file) {
    return res.status(400).json({ message: "Thiếu file upload." });
  }

  if (!String(file.mimetype || "").startsWith("image/")) {
    return res.status(400).json({ message: "Chỉ chấp nhận file ảnh." });
  }

  let relative;
  try {
    relative = resolveUploadRelativePath(req.body || {}, file);
  } catch (err) {
    return res.status(400).json({ message: err.message || "Path không hợp lệ." });
  }

  const absolutePath = path.resolve(IMAGE_UPLOAD_ROOT, relative);
  const rootPath = path.resolve(IMAGE_UPLOAD_ROOT);

  if (!absolutePath.startsWith(rootPath + path.sep) && absolutePath != rootPath) {
    return res.status(400).json({ message: "Path upload vượt phạm vi cho phép." });
  }

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, file.buffer);

  const publicPath = `/img/${relative.replace(/\\\\/g, "/")}`;
  return res.json({ ok: true, url: publicPath, path: publicPath });
}

const uploadImageFields = uploadMiddleware.fields([
  { name: "file", maxCount: 1 },
  { name: "image", maxCount: 1 },
]);

app.post("/api/upload", requireAuth, uploadImageFields, (req, res, next) => {
  Promise.resolve(handleImageUpload(req, res)).catch(next);
});

app.post(
  "/api/upload/image",
  requireAuth,
  uploadImageFields,
  (req, res, next) => {
    Promise.resolve(handleImageUpload(req, res)).catch(next);
  },
);

'''
    s = s.replace(marker, block + marker)

error_handler = '''
app.use((err, _req, res, next) => {
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res
      .status(413)
      .json({ message: "File upload vượt quá giới hạn cho phép." });
  }
  return next(err);
});
'''

if 'err.code === "LIMIT_FILE_SIZE"' not in s:
    insertion = 'start().catch((err) => {\n  console.error("Failed to start API:", err);\n  process.exit(1);\n});\n'
    s = s.replace(insertion, insertion + error_handler)

p.write_text(s)
print('patched-upload-endpoints-ok')
