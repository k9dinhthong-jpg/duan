import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import "./News.css";
import { toPublicPath } from "../../utils/publicPath";
import { applySeo } from "../../utils/seo";
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

function getNewsDetailImageAlt(title?: string) {
  const normalizedTitle = title?.trim();
  if (!normalizedTitle) {
    return "Hình ảnh chi tiết tin tức máy công trình";
  }

  return `${normalizedTitle} - hình ảnh chi tiết`;
}

function NewsDetail() {
  const { slug = "" } = useParams();
  const { items, isLoading, error } = useNews();

  const article = useMemo(() => {
    return items
      .map((item) => ({
        ...item,
        slug: item.slug?.trim(),
      }))
      .find((item) => item.slug === slug);
  }, [items, slug]);

  useEffect(() => {
    if (!article) return;

    applySeo({
      title: article.title,
      description: article.content.slice(0, 150),
      image: toPublicPath(article.image),
    });
  }, [article]);

  if (isLoading) {
    return (
      <section className="news-page">
        <p className="news-state" role="status">
          Đang tải nội dung bài viết...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="news-page">
        <p className="news-state is-error" role="alert">
          Không thể tải nội dung bài viết. Vui lòng thử lại sau.
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
          src={getImageSrc(article.image)}
          alt={getNewsDetailImageAlt(article.title)}
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
