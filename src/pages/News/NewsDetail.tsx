import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./News.css";
import { toPublicPath } from "../../utils/publicPath";

type NewsItem = {
  id: string;
  slug?: string;
  title: string;
  content: string;
  image: string;
  category?: string;
  publishedAt?: string;
  author?: string;
};

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

function NewsDetail() {
  const { slug = "" } = useParams();
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
        setLoadError("Không thể tải nội dung bài viết. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    }

    loadNews();
  }, []);

  const article = useMemo(() => {
    return items
      .map((item) => ({
        ...item,
        slug: item.slug?.trim() || slugify(item.title),
      }))
      .find((item) => item.slug === slug);
  }, [items, slug]);

  if (isLoading) {
    return (
      <section className="news-page">
        <p className="news-state" role="status">
          Đang tải nội dung bài viết...
        </p>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="news-page">
        <p className="news-state is-error" role="alert">
          {loadError}
        </p>
      </section>
    );
  }

  if (!article) {
    return (
      <section className="news-page">
        <p className="news-state">Không tìm thấy bài viết bạn yêu cầu.</p>
        <Link to="/news" className="read-more">
          ← Quay lại trang tin tức
        </Link>
      </section>
    );
  }

  return (
    <section className="news-page news-detail-page">
      <Link to="/news" className="read-more news-back-link">
        ← Quay lại trang tin tức
      </Link>

      <article className="news-detail-card">
        <img
          src={toPublicPath(article.image)}
          alt={article.title}
          className="news-detail-image"
          loading="lazy"
        />

        <div className="news-detail-body">
          <div className="news-meta">
            {article.category && (
              <span className="news-category">{article.category}</span>
            )}
            {article.publishedAt && (
              <time dateTime={article.publishedAt}>
                {formatDate(article.publishedAt)}
              </time>
            )}
            {article.author && <span>{article.author}</span>}
          </div>

          <h1 className="news-detail-title">{article.title}</h1>
          <p className="news-detail-content">{article.content}</p>
        </div>
      </article>
    </section>
  );
}

export default NewsDetail;
