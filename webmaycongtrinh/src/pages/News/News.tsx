import { useMemo } from "react";
import { Link } from "react-router-dom";
import "./News.css";
import { toPublicPath } from "../../utils/publicPath";
import { useNews } from "../../context/NewsContext";

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

function getImageSrc(image: string) {
  return /^https?:\/\//i.test(image) ? image : toPublicPath(image);
}

function getNewsImageAlt(title?: string) {
  const normalizedTitle = title?.trim();
  if (!normalizedTitle) {
    return "Hình minh họa bài viết máy công trình";
  }

  return `${normalizedTitle} - hình ảnh bài viết`;
}

function News() {
  const { items, isLoading, error } = useNews();

  const newsItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        slug: item.slug?.trim(),
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

      {!isLoading && error && (
        <p className="news-state is-error" role="alert">
          Không thể tải danh sách tin tức. Vui lòng thử lại sau.
        </p>
      )}

      {!isLoading && !error && newsItems.length === 0 && (
        <p className="news-state">Chưa có bài viết nào để hiển thị.</p>
      )}

      <div className="news-list">
        {newsItems.map((news) => (
          <article key={news.id} className="news-item">
            <img
              src={getImageSrc(news.image)}
              alt={getNewsImageAlt(news.title)}
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
              {news.slug ? (
                <Link to={`/news/${news.slug}`} className="read-more">
                  Đọc thêm →
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default News;
