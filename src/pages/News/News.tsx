import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./News.css";
import { toPublicPath } from "../../utils/publicPath";

interface NewsItem {
  id: string;
  slug?: string;
  title: string;
  content: string;
  image: string;
  category?: string;
  publishedAt?: string;
  author?: string;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDate(value?: string) {
  if (!value) return "";
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsedDate);
}

function News() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function loadNews() {
      try {
        setIsLoading(true);
        setLoadError("");

        const response = await fetch(toPublicPath("data/Featured-New.json"));
        if (!response.ok) {
          throw new Error("load-failed");
        }

        const data = (await response.json()) as NewsItem[];
        setItems(data);
      } catch {
        setLoadError("Không thể tải danh sách tin tức. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    }

    loadNews();
  }, []);

  const newsItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        slug: item.slug?.trim() || slugify(item.title),
      })),
    [items],
  );

  return (
    <section className="news-page">
      <h1 className="news-title">Tin Tức</h1>

      {isLoading && (
        <p className="news-state" role="status">
          Đang tải danh sách tin tức...
        </p>
      )}

      {!isLoading && loadError && (
        <p className="news-state is-error" role="alert">
          {loadError}
        </p>
      )}

      {!isLoading && !loadError && newsItems.length === 0 && (
        <p className="news-state">Chưa có bài viết nào để hiển thị.</p>
      )}

      <div className="news-list">
        {newsItems.map((news) => (
          <article key={news.id} className="news-item">
            <img
              src={toPublicPath(news.image)}
              alt={news.title}
              className="news-image"
              loading="lazy"
            />
            <div className="news-content">
              <div className="news-meta">
                {news.category && (
                  <span className="news-category">{news.category}</span>
                )}
                {news.publishedAt && (
                  <time dateTime={news.publishedAt}>
                    {formatDate(news.publishedAt)}
                  </time>
                )}
                {news.author && <span>{news.author}</span>}
              </div>
              <h2>{news.title}</h2>
              <p>{news.content}</p>
              <Link to={`/news/${news.slug}`} className="read-more">
                Đọc thêm →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default News;
