import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import "./News.css";

type NewsItem = {
  id: number;
  slug: string;
  title: string;
  content: string;
  image: string;
  category: string;
  author: string;
  is_active: 0 | 1;
  published_at: string;
  created_at: string;
  updated_at: string;
};

type NewsForm = {
  slug: string;
  title: string;
  content: string;
  image: string;
  category: string;
  author: string;
  is_active: 0 | 1;
  published_at: string;
};

type NewsTab = "list" | "manage";

type ApiResult<T> = {
  ok: boolean;
  data?: T;
  message?: string;
};

const NEWS_API_CANDIDATES = [
  import.meta.env.VITE_NEWS_API_ENDPOINT || "",
  "/api/news_items",
  "/api/news-items",
  "/api/news",
  "/api/news_items/list",
  "/api/news/list",
].filter(Boolean);
const IMAGE_UPLOAD_CANDIDATES = ["/api/upload/image", "/api/upload"];
const PAGE_SIZE = 5;

let resolvedNewsEndpoint: string | null = null;

const defaultForm: NewsForm = {
  slug: "",
  title: "",
  content: "",
  image: "/img/FeaturedNews/Feature01.png",
  category: "Tin Tức",
  author: "Admin",
  is_active: 1,
  published_at: new Date().toISOString().slice(0, 19).replace("T", " "),
};

function getAuthToken(): string {
  return localStorage.getItem("adminmct:token") ?? "";
}

function getNowDateTime(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function createSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toDateTimeLocal(value: string): string {
  if (!value) {
    return "";
  }
  return value.replace(" ", "T").slice(0, 16);
}

function fromDateTimeLocal(value: string): string {
  if (!value) {
    return getNowDateTime();
  }
  const normalized = value.slice(0, 16).replace("T", " ");
  return `${normalized}:00`;
}

function normalizeNewsItem(raw: unknown): NewsItem {
  const item = (raw ?? {}) as Record<string, unknown>;
  return {
    id: Number(item.id) || 0,
    slug: String(item.slug ?? ""),
    title: String(item.title ?? ""),
    content: String(item.content ?? item.summary ?? ""),
    image: String(item.image ?? "/img/FeaturedNews/Feature01.png"),
    category: String(item.category ?? "Tin Tức"),
    author: String(item.author ?? "Admin"),
    is_active: Number(item.is_active) === 0 ? 0 : 1,
    published_at: String(item.published_at ?? getNowDateTime()),
    created_at: String(item.created_at ?? getNowDateTime()),
    updated_at: String(item.updated_at ?? getNowDateTime()),
  };
}

async function readResponseMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string };
    return data.message ?? fallback;
  } catch {
    return fallback;
  }
}

async function readNewsList(res: Response): Promise<NewsItem[]> {
  const payload = (await res.json()) as
    | NewsItem[]
    | {
        items?: NewsItem[];
        data?: NewsItem[];
        rows?: NewsItem[];
        list?: NewsItem[];
        news?: NewsItem[];
        newsItems?: NewsItem[];
        result?: NewsItem[];
      };

  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(payload.rows)
          ? payload.rows
          : Array.isArray(payload.list)
            ? payload.list
            : Array.isArray(payload.news)
              ? payload.news
              : Array.isArray(payload.newsItems)
                ? payload.newsItems
                : Array.isArray(payload.result)
                  ? payload.result
                  : [];

  return list
    .map((item) => normalizeNewsItem(item))
    .filter((item) => item.id > 0)
    .sort((a, b) => b.id - a.id);
}

async function resolveNewsEndpoint(token: string): Promise<string> {
  if (resolvedNewsEndpoint) {
    return resolvedNewsEndpoint;
  }

  for (const endpoint of NEWS_API_CANDIDATES) {
    try {
      const res = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status !== 404) {
        resolvedNewsEndpoint = endpoint;
        return endpoint;
      }
    } catch {
      // Try next endpoint.
    }
  }

  resolvedNewsEndpoint = NEWS_API_CANDIDATES[0] || "/api/news-items";
  return resolvedNewsEndpoint || "/api/news-items";
}

async function loadNewsFromApi(): Promise<ApiResult<NewsItem[]>> {
  const token = getAuthToken();
  if (!token) {
    return { ok: false, message: "Thiếu token đăng nhập." };
  }

  try {
    const endpoint = await resolveNewsEndpoint(token);
    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const fallback =
        res.status === 404
          ? `Không tìm thấy endpoint ${endpoint}.`
          : "Không tải được danh sách tin tức.";
      return {
        ok: false,
        message: await readResponseMessage(res, fallback),
      };
    }

    return { ok: true, data: await readNewsList(res) };
  } catch {
    return { ok: false, message: "Không kết nối được API tin tức." };
  }
}

async function createNewsToApi(form: NewsForm): Promise<ApiResult<NewsItem>> {
  const token = getAuthToken();
  if (!token) {
    return { ok: false, message: "Thiếu token đăng nhập." };
  }

  const payload = {
    slug: form.slug.trim() || createSlug(form.title),
    title: form.title.trim(),
    content: form.content.trim(),
    image: form.image.trim(),
    category: form.category.trim(),
    author: form.author.trim(),
    is_active: form.is_active,
    published_at: form.published_at,
  };

  try {
    const endpoint = await resolveNewsEndpoint(token);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return {
        ok: false,
        message: await readResponseMessage(res, "Tạo tin mới thất bại."),
      };
    }

    const data = (await res.json()) as
      | NewsItem
      | { item?: NewsItem; data?: NewsItem };
    const item = "id" in data ? data : (data.item ?? data.data);
    return { ok: true, data: item ? normalizeNewsItem(item) : undefined };
  } catch {
    return { ok: false, message: "Không kết nối được API để tạo tin." };
  }
}

async function updateNewsToApi(
  id: number,
  form: NewsForm,
): Promise<ApiResult<NewsItem>> {
  const token = getAuthToken();
  if (!token) {
    return { ok: false, message: "Thiếu token đăng nhập." };
  }

  const payload = {
    slug: form.slug.trim() || createSlug(form.title),
    title: form.title.trim(),
    content: form.content.trim(),
    image: form.image.trim(),
    category: form.category.trim(),
    author: form.author.trim(),
    is_active: form.is_active,
    published_at: form.published_at,
  };

  try {
    const endpoint = await resolveNewsEndpoint(token);
    const res = await fetch(`${endpoint}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return {
        ok: false,
        message: await readResponseMessage(res, "Cập nhật tin tức thất bại."),
      };
    }

    const data = (await res.json()) as
      | NewsItem
      | { item?: NewsItem; data?: NewsItem };
    const item = "id" in data ? data : (data.item ?? data.data);
    return { ok: true, data: item ? normalizeNewsItem(item) : undefined };
  } catch {
    return { ok: false, message: "Không kết nối được API để cập nhật." };
  }
}

async function deleteNewsFromApi(id: number): Promise<ApiResult<null>> {
  const token = getAuthToken();
  if (!token) {
    return { ok: false, message: "Thiếu token đăng nhập." };
  }

  try {
    const endpoint = await resolveNewsEndpoint(token);
    const res = await fetch(`${endpoint}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return {
        ok: false,
        message: await readResponseMessage(res, "Xóa tin tức thất bại."),
      };
    }

    return { ok: true, data: null };
  } catch {
    return { ok: false, message: "Không kết nối được API để xóa tin." };
  }
}

async function uploadImageToApi(file: File): Promise<ApiResult<string>> {
  const token = getAuthToken();
  if (!token) {
    return { ok: false, message: "Thiếu token đăng nhập." };
  }

  for (const endpoint of IMAGE_UPLOAD_CANDIDATES) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        continue;
      }

      const data = (await res.json()) as {
        url?: string;
        path?: string;
        image?: string;
        fileUrl?: string;
        data?: { url?: string; path?: string; image?: string };
      };

      const imageUrl =
        data.url ??
        data.path ??
        data.image ??
        data.fileUrl ??
        data.data?.url ??
        data.data?.path ??
        data.data?.image;

      if (imageUrl) {
        return { ok: true, data: imageUrl };
      }
    } catch {
      // Try next upload endpoint.
    }
  }

  return {
    ok: false,
    message:
      "Upload thất bại. Kiểm tra endpoint upload backend (/api/upload/image hoặc /api/upload).",
  };
}

function mapItemToForm(item: NewsItem): NewsForm {
  return {
    slug: item.slug,
    title: item.title,
    content: item.content,
    image: item.image,
    category: item.category,
    author: item.author,
    is_active: item.is_active,
    published_at: item.published_at,
  };
}

function News() {
  const [activeTab, setActiveTab] = useState<NewsTab>("manage");
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<NewsForm>(defaultForm);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);

  const editingNews = useMemo(
    () => newsList.find((item) => item.id === editingId) ?? null,
    [newsList, editingId],
  );

  const filteredNews = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) {
      return newsList;
    }

    return newsList.filter((item) => {
      const haystack =
        `${item.title} ${item.slug} ${item.category}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [newsList, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredNews.length / PAGE_SIZE));

  const pagedNews = useMemo(() => {
    const page = Math.min(currentPage, totalPages);
    const start = (page - 1) * PAGE_SIZE;
    return filteredNews.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredNews, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  async function refreshNews(preferredId?: number) {
    setIsLoading(true);
    const result = await loadNewsFromApi();

    if (!result.ok || !result.data) {
      setNewsList([]);
      setSelectedId(null);
      setEditingId(null);
      setForm(defaultForm);
      setMessage(result.message ?? "Không lấy được dữ liệu tin tức từ API.");
      setIsLoading(false);
      return;
    }

    const list = result.data;
    setNewsList(list);

    if (list.length === 0) {
      setSelectedId(null);
      setEditingId(null);
      setForm(defaultForm);
      setMessage("API trả về danh sách tin tức rỗng.");
      setIsLoading(false);
      return;
    }

    const selected =
      list.find((item) => item.id === preferredId) ??
      list.find((item) => item.id === selectedId) ??
      list[0];

    setSelectedId(selected.id);
    if (editingId !== null) {
      const editingItem =
        list.find((item) => item.id === editingId) ??
        list.find((item) => item.id === preferredId) ??
        selected;
      setForm(mapItemToForm(editingItem));
    }
    setIsLoading(false);
  }

  useEffect(() => {
    void refreshNews();
  }, []);

  function handleStartEditNews(id: number) {
    const found = newsList.find((item) => item.id === id);
    if (!found) {
      return;
    }

    setSelectedId(found.id);
    setEditingId(found.id);
    setForm(mapItemToForm(found));
    setMessage(`Đang chỉnh sửa tin #${found.id}.`);
    setActiveTab("manage");
  }

  async function handleUploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    const result = await uploadImageToApi(file);

    if (!result.ok || !result.data) {
      setMessage(result.message ?? "Upload ảnh thất bại.");
      setIsUploading(false);
      event.target.value = "";
      return;
    }

    setForm((prev) => ({ ...prev, image: result.data ?? prev.image }));
    setMessage("Đã upload ảnh và cập nhật đường dẫn vào form.");
    setIsUploading(false);
    event.target.value = "";
  }

  async function handleCreateNews() {
    const title = form.title.trim();
    const content = form.content.trim();

    if (!title || !content) {
      setMessage("Vui lòng nhập tiêu đề và nội dung trước khi thêm tin.");
      return;
    }

    setIsSubmitting(true);
    const result = await createNewsToApi({
      ...form,
      slug: form.slug.trim() || createSlug(title),
    });

    if (!result.ok) {
      setMessage(result.message ?? "Không thể thêm tin mới.");
      setIsSubmitting(false);
      return;
    }

    const newId = result.data?.id;
    await refreshNews(newId);
    setEditingId(null);
    setForm(defaultForm);
    setMessage(`Đã thêm tin mới${newId ? ` #${newId}` : ""} và đồng bộ API.`);
    setIsSubmitting(false);
  }

  async function handleUpdateNews(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingNews) {
      setMessage("Chưa chọn bản ghi để cập nhật.");
      return;
    }

    const title = form.title.trim();
    const content = form.content.trim();

    if (!title || !content) {
      setMessage("Vui lòng nhập tiêu đề và nội dung.");
      return;
    }

    setIsSubmitting(true);
    const result = await updateNewsToApi(editingNews.id, {
      ...form,
      slug: form.slug.trim() || createSlug(title),
    });

    if (!result.ok) {
      setMessage(result.message ?? "Không thể cập nhật tin tức.");
      setIsSubmitting(false);
      return;
    }

    await refreshNews(editingNews.id);
    setEditingId(null);
    setForm(defaultForm);
    setMessage(`Đã cập nhật tin #${editingNews.id} và đồng bộ API.`);
    setIsSubmitting(false);
  }

  async function handleDeleteNews(id: number, title: string) {
    const isConfirmed = window.confirm(
      `Bạn có chắc muốn xóa tin #${id} - ${title}?`,
    );
    if (!isConfirmed) {
      return;
    }

    setIsSubmitting(true);
    const result = await deleteNewsFromApi(id);

    if (!result.ok) {
      setMessage(result.message ?? "Không thể xóa tin tức.");
      setIsSubmitting(false);
      return;
    }

    if (editingId === id) {
      setEditingId(null);
      setForm(defaultForm);
    }

    await refreshNews();
    setMessage(`Đã xóa tin #${id} và đồng bộ API.`);
    setIsSubmitting(false);
  }

  function handleManageSubmit(event: FormEvent<HTMLFormElement>) {
    if (editingId === null) {
      event.preventDefault();
      return;
    }

    void handleUpdateNews(event);
  }

  return (
    <section className="news-page">
      <header className="topbar">
        <div>
          <p className="eyebrow">Nội dung</p>
          <h1>Quản lý tin tức</h1>
          <p className="news-api-note">
            Đồng bộ API: {resolvedNewsEndpoint ?? NEWS_API_CANDIDATES[0]}
          </p>
        </div>
      </header>

      <article className="panel news-panel">
        <nav className="news-tabs" aria-label="Điều hướng quản lý tin tức">
          <button
            type="button"
            className={`news-tab ${activeTab === "list" ? "is-active" : ""}`}
            onClick={() => setActiveTab("list")}
          >
            Danh sách tin
          </button>
          <button
            type="button"
            className={`news-tab ${activeTab === "manage" ? "is-active" : ""}`}
            onClick={() => setActiveTab("manage")}
          >
            Thêm/Cập nhật tin
          </button>
          <button
            type="button"
            className="news-tab"
            onClick={() => void refreshNews(selectedId ?? undefined)}
            disabled={isLoading}
          >
            {isLoading ? "Đang tải..." : "Tải lại từ API"}
          </button>
        </nav>

        {activeTab === "list" ? (
          <>
            <div className="news-tools">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="news-search"
                placeholder="Tìm theo tiêu đề, slug, chuyên mục..."
              />
              <p className="news-count">
                {filteredNews.length} bản ghi, trang{" "}
                {Math.min(currentPage, totalPages)}/{totalPages}
              </p>
            </div>

            <div className="news-list-wrap">
              {pagedNews.length === 0 ? (
                <p className="news-empty">Không có bản ghi phù hợp.</p>
              ) : (
                <div className="news-table">
                  <div className="news-row news-row--head">
                    <span>ID</span>
                    <span>Tiêu đề</span>
                    <span>Chuyên mục</span>
                    <span>Trạng thái</span>
                    <span>Cập nhật</span>
                    <span>Thao tác</span>
                  </div>
                  {pagedNews.map((item) => (
                    <div
                      key={item.id}
                      className={`news-row ${item.id === selectedId ? "is-selected" : ""}`}
                    >
                      <span>#{item.id}</span>
                      <span>{item.title}</span>
                      <span>{item.category}</span>
                      <span>{item.is_active === 1 ? "Hiển thị" : "Ẩn"}</span>
                      <span>{item.updated_at}</span>
                      <span className="news-row-actions">
                        <button
                          type="button"
                          className="news-row-action"
                          onClick={() => handleStartEditNews(item.id)}
                          disabled={isSubmitting || isUploading}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="news-row-action news-row-action--danger"
                          onClick={() =>
                            void handleDeleteNews(item.id, item.title)
                          }
                          disabled={isSubmitting || isUploading}
                        >
                          Xóa
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="news-pagination">
              <button
                type="button"
                className="news-page-btn"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
              >
                Trang trước
              </button>
              <button
                type="button"
                className="news-page-btn"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage >= totalPages}
              >
                Trang sau
              </button>
            </div>
          </>
        ) : (
          <form className="news-form" onSubmit={handleManageSubmit}>
            <label className="field field-wide">
              <span>Tiêu đề</span>
              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                    slug: prev.slug || createSlug(e.target.value),
                  }))
                }
                placeholder="Nhập tiêu đề"
                disabled={isSubmitting || isUploading}
              />
            </label>

            <label className="field field-wide">
              <span>Slug</span>
              <input
                type="text"
                value={form.slug}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    slug: createSlug(e.target.value),
                  }))
                }
                placeholder="may-xuc-chat-luong-cao"
                disabled={isSubmitting || isUploading}
              />
            </label>

            <label className="field field-wide">
              <span>Nội dung</span>
              <textarea
                value={form.content}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, content: e.target.value }))
                }
                rows={5}
                placeholder="Nội dung chi tiết tin tức"
                disabled={isSubmitting || isUploading}
              />
            </label>

            <label className="field field-wide">
              <span>Ảnh</span>
              <input
                type="text"
                value={form.image}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, image: e.target.value }))
                }
                placeholder="/img/FeaturedNews/Feature01.png"
                disabled={isSubmitting || isUploading}
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadImage}
                disabled={isSubmitting || isUploading}
              />
              <small className="news-upload-hint">
                Upload file ảnh để tự động điền trường image.
              </small>
              {form.image ? (
                <img
                  src={form.image}
                  alt="Preview"
                  className="news-image-preview"
                />
              ) : null}
            </label>

            <label className="field">
              <span>Chuyên mục</span>
              <input
                type="text"
                value={form.category}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, category: e.target.value }))
                }
                placeholder="Tin Tức"
                disabled={isSubmitting || isUploading}
              />
            </label>

            <label className="field">
              <span>Tác giả</span>
              <input
                type="text"
                value={form.author}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, author: e.target.value }))
                }
                placeholder="Admin"
                disabled={isSubmitting || isUploading}
              />
            </label>

            <label className="field">
              <span>Ngày xuất bản</span>
              <input
                type="datetime-local"
                value={toDateTimeLocal(form.published_at)}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    published_at: fromDateTimeLocal(e.target.value),
                  }))
                }
                disabled={isSubmitting || isUploading}
              />
            </label>

            <label className="field">
              <span>Trạng thái</span>
              <button
                type="button"
                className={`switch ${form.is_active === 1 ? "is-on" : "is-off"}`}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    is_active: prev.is_active === 1 ? 0 : 1,
                  }))
                }
                aria-pressed={form.is_active === 1}
                disabled={isSubmitting || isUploading}
              >
                <span className="switch-thumb" />
                <span className="switch-label">
                  {form.is_active === 1 ? "Hiển thị" : "Ẩn"}
                </span>
              </button>
            </label>

            <div className="news-actions field-wide">
              {editingId === null ? (
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => void handleCreateNews()}
                  disabled={isSubmitting || isUploading}
                >
                  {isSubmitting ? "Đang xử lý..." : "Thêm mới"}
                </button>
              ) : (
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={isSubmitting || isUploading}
                >
                  {isSubmitting ? "Đang xử lý..." : "Cập nhật"}
                </button>
              )}
            </div>

            {message ? <p className="news-message">{message}</p> : null}
          </form>
        )}
      </article>
    </section>
  );
}

export default News;
