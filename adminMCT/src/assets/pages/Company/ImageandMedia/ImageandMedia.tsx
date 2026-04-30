import { useState } from "react";
import type { ChangeEvent } from "react";
import {
  normalizeKnownMediaPath,
  type CompanyInfo,
  type UpdateCompanyField,
} from "../companyModel";
import "./ImageandMedia.css";

const IMAGE_UPLOAD_CANDIDATES = ["/api/upload/image", "/api/upload"];
let uploadApiUnavailableMessage = "";

type MediaField = "logo_url" | "favicon_url" | "intro_image" | "og_image";

type MediaFieldConfig = {
  field: MediaField;
  label: string;
  placeholder: string;
};

const mediaFieldConfigs: MediaFieldConfig[] = [
  { field: "logo_url", label: "Logo", placeholder: "/img/Logo/Logo.png" },
  {
    field: "favicon_url",
    label: "Favicon",
    placeholder: "/img/Logo/Favicon.png",
  },
  {
    field: "intro_image",
    label: "Ảnh giới thiệu",
    placeholder: "/img/IntroCompany/Company.png",
  },
  {
    field: "og_image",
    label: "Ảnh chia sẻ (OG Image)",
    placeholder: "/img/Logo/Logo.png",
  },
];

function getAuthToken(): string {
  return localStorage.getItem("adminmct:token") ?? "";
}

function parseMediaPath(
  path: string,
): { folder: string; fileName: string } | null {
  const cleanPath = path.trim();
  if (!cleanPath || cleanPath.endsWith("/")) {
    return null;
  }

  const sanitized = cleanPath.split("?")[0].split("#")[0];
  const segments = sanitized.split("/").filter(Boolean);
  const fileName = segments.at(-1);
  if (!fileName) {
    return null;
  }

  const folderSegments = segments.slice(0, -1);
  const folder = folderSegments.length ? `/${folderSegments.join("/")}` : "";

  return { folder, fileName };
}

function toUploadTargetPath(rawPath: string): string {
  const clean = rawPath.trim();
  if (!clean) {
    return "";
  }

  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    try {
      const parsed = new URL(clean);
      return normalizeKnownMediaPath(parsed.pathname || "");
    } catch {
      // Fall back to string-based extraction below.
    }

    const stripped = clean.replace(/^https?:\/\/[^/]+/i, "");
    return normalizeKnownMediaPath(stripped);
  }

  return normalizeKnownMediaPath(clean);
}

const WEBSITE_ORIGIN = "https://maycongtrinhnhapkhau.com.vn";

function toPreviewUrl(path: string): string {
  const cleanPath = normalizeKnownMediaPath(path);
  if (!cleanPath) {
    return "";
  }

  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
    return cleanPath;
  }

  const absPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  return `${WEBSITE_ORIGIN}${absPath}`;
}

function pickImageUrlFromResponse(data: {
  url?: string;
  path?: string;
  image?: string;
  fileUrl?: string;
  data?: { url?: string; path?: string; image?: string };
}): string | null {
  return (
    data.url ??
    data.path ??
    data.image ??
    data.fileUrl ??
    data.data?.url ??
    data.data?.path ??
    data.data?.image ??
    null
  );
}

async function readUploadErrorMessage(
  res: Response,
  endpoint: string,
): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string; error?: string };
    const detail = data.message ?? data.error;
    if (detail) {
      return `Upload lỗi ${res.status} tại ${endpoint}: ${detail}`;
    }
  } catch {
    // Fallback below.
  }

  return `Upload lỗi ${res.status} tại ${endpoint}.`;
}

async function uploadImageToApi(
  file: File,
  targetPath: string,
): Promise<{
  ok: boolean;
  path?: string;
  message?: string;
  code?: "payload_too_large" | "upload_endpoint_missing";
}> {
  if (uploadApiUnavailableMessage) {
    return {
      ok: false,
      code: "upload_endpoint_missing",
      message: uploadApiUnavailableMessage,
    };
  }

  const token = getAuthToken();
  if (!token) {
    return { ok: false, message: "Thiếu token đăng nhập." };
  }

  const parsed = parseMediaPath(targetPath);
  if (!parsed) {
    return {
      ok: false,
      message: "Đường dẫn hiện tại chưa hợp lệ để thay thế ảnh.",
    };
  }

  const replaceFile = new File([file], parsed.fileName, {
    type: file.type,
    lastModified: file.lastModified,
  });

  const uploadVariants: Array<{
    fileField: "file" | "image";
    withMeta: boolean;
  }> = [
    { fileField: "file", withMeta: true },
    { fileField: "image", withMeta: true },
  ];

  let lastErrorMessage =
    "Upload thất bại. Kiểm tra endpoint backend (/api/upload/image hoặc /api/upload).";
  let allEndpointsNotFound = true;

  for (const endpoint of IMAGE_UPLOAD_CANDIDATES) {
    for (const variant of uploadVariants) {
      try {
        const formData = new FormData();
        formData.append(variant.fileField, replaceFile);

        if (variant.withMeta) {
          formData.append("path", targetPath);
          formData.append("folder", parsed.folder);
          formData.append("filename", parsed.fileName);
          formData.append("overwrite", "true");
        }

        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!res.ok) {
          if (res.status !== 404) {
            allEndpointsNotFound = false;
          }

          if (res.status === 413) {
            return {
              ok: false,
              code: "payload_too_large",
              message:
                "Upload lỗi 413: Server đang giới hạn dung lượng upload. Cần tăng giới hạn ở backend/proxy để giữ ảnh gốc không nén.",
            };
          }

          lastErrorMessage = await readUploadErrorMessage(res, endpoint);
          continue;
        }

        allEndpointsNotFound = false;

        const data = (await res.json()) as {
          url?: string;
          path?: string;
          image?: string;
          fileUrl?: string;
          data?: { url?: string; path?: string; image?: string };
        };

        const uploadedPath = pickImageUrlFromResponse(data);
        return { ok: true, path: uploadedPath ?? targetPath };
      } catch {
        lastErrorMessage = `Không kết nối được endpoint upload ${endpoint}.`;
      }
    }
  }

  if (allEndpointsNotFound) {
    uploadApiUnavailableMessage =
      "Backend chưa cấu hình API upload ảnh (tất cả endpoint hiện tại đều trả 404). Ảnh chưa được tải lên server. Hãy bổ sung route upload ở backend hoặc upload thủ công file lên thư mục đích rồi giữ nguyên đường dẫn trong ô nhập.";
    return {
      ok: false,
      code: "upload_endpoint_missing",
      message: uploadApiUnavailableMessage,
    };
  }

  return {
    ok: false,
    message: lastErrorMessage,
  };
}

type ImageandMediaProps = {
  form: CompanyInfo;
  updateField: UpdateCompanyField;
};

function ImageandMedia({ form, updateField }: ImageandMediaProps) {
  const [uploadingField, setUploadingField] = useState<MediaField | "">("");
  const [uploadMessage, setUploadMessage] = useState("");

  async function handleReplaceImage(
    field: MediaField,
    placeholder: string,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const currentPath = (form[field] || "").trim();
    const targetPath = toUploadTargetPath(currentPath || placeholder);

    setUploadingField(field);
    setUploadMessage("");

    const result = await uploadImageToApi(file, targetPath);
    if (!result.ok || !result.path) {
      if (result.code === "payload_too_large") {
        setUploadMessage(
          `${result.message ?? "Upload lỗi 413."} Dung lượng ảnh hiện tại: ${(file.size / (1024 * 1024)).toFixed(2)} MB.`,
        );
      } else {
        setUploadMessage(result.message ?? "Không thể thay thế ảnh.");
      }
      setUploadingField("");
      event.target.value = "";
      return;
    }

    updateField(field, result.path);
    setUploadMessage("Đã thay ảnh mới vào vị trí cũ (giữ tên file cũ).");
    setUploadingField("");
    event.target.value = "";
  }

  return (
    <div className="co-card">
      <div className="co-card-head">
        <h2>Hình ảnh và Media</h2>
        <p>
          Chọn ảnh mới để thay thế ảnh cũ theo đúng đường dẫn và tên file hiện
          tại.
        </p>
      </div>
      <div className="co-grid">
        {mediaFieldConfigs.map((item) => {
          const value = form[item.field];
          const previewUrl = toPreviewUrl(value || item.placeholder);

          return (
            <div key={item.field} className="co-field co-media-field">
              <span>{item.label}</span>
              <div className="co-media-preview-wrap">
                {previewUrl ? (
                  <img
                    className="co-media-preview"
                    src={previewUrl}
                    alt={item.label}
                    loading="lazy"
                  />
                ) : (
                  <div className="co-media-preview co-media-preview--empty">
                    Chưa có ảnh
                  </div>
                )}
              </div>

              <input
                id={item.field}
                type="text"
                value={value}
                onChange={(e) =>
                  updateField(
                    item.field,
                    normalizeKnownMediaPath(e.target.value),
                  )
                }
                placeholder={item.placeholder}
              />

              <label className="co-upload-btn" htmlFor={`${item.field}-upload`}>
                {uploadingField === item.field
                  ? "Đang upload..."
                  : "Thay thế ảnh"}
              </label>
              <input
                id={`${item.field}-upload`}
                className="co-upload-input"
                type="file"
                accept="image/*"
                disabled={Boolean(uploadingField)}
                onChange={(event) =>
                  void handleReplaceImage(item.field, item.placeholder, event)
                }
              />
            </div>
          );
        })}
      </div>

      <p className="co-media-note">
        Lưu ý: để ghi đè chính xác file cũ, backend upload cần hỗ trợ nhận
        filename/path/overwrite.
      </p>

      {uploadMessage ? (
        <p className="co-section-desc">{uploadMessage}</p>
      ) : null}
    </div>
  );
}

export default ImageandMedia;
