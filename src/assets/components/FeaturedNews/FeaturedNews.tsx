import { useEffect, useMemo, useState } from "react";
import { FaChevronRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./FeaturedNews.css";
import { toPublicPath } from "../../../utils/publicPath";

type FeaturedNewsItem = {
  id: string;
  slug?: string;
  title: string;
  content: string;
  image: string;
};

function getIdOrder(id: string): number {
  const match = id.match(/(\d+)$/);
  return match ? Number(match[1]) : -1;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function FeaturedNews() {
  const [items, setItems] = useState<FeaturedNewsItem[]>([]);
  const [itemsToShow, setItemsToShow] = useState(3);

  useEffect(() => {
    const loadFeaturedNews = async () => {
      try {
        const response = await fetch(
          toPublicPath("data/Featured-New/Featured-New.json"),
        );
        const data: FeaturedNewsItem[] = await response.json();
        setItems(data);
      } catch (error) {
        console.error("Failed to load featured news:", error);
      }
    };

    loadFeaturedNews();
  }, []);

  useEffect(() => {
    const getItemsToShow = (width: number): number => {
      if (width >= 1440) return 3;
      if (width >= 1024) return 3;
      if (width >= 768) return 2;
      if (width <= 676) return 1;
      return 1;
    };

    const handleResize = () => {
      setItemsToShow(getItemsToShow(window.innerWidth));
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const latestItems = useMemo(() => {
    return [...items]
      .sort((a, b) => getIdOrder(b.id) - getIdOrder(a.id))
      .slice(0, itemsToShow);
  }, [items, itemsToShow]);

  return (
    <section className="featured-news">
      <h2 className="featured-news-title">Tin Tức Nổi Bật</h2>
      <ul className="featured-news-grid">
        {latestItems.map((item) => (
          <li key={item.id} className="featured-news-card">
            <img
              src={toPublicPath(item.image)}
              alt={item.title}
              className="featured-news-image"
              loading="lazy"
              decoding="async"
            />

            <div className="featured-news-body">
              <h3 className="featured-news-item-title">{item.title}</h3>
              <p className="featured-news-item-desc">{item.content}</p>
              <Link
                to={`/news/${item.slug?.trim() || slugify(item.title)}`}
                className="featured-news-link"
              >
                Xem thêm <FaChevronRight aria-hidden="true" />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default FeaturedNews;
