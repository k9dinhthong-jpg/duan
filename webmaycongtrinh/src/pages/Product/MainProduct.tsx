import { useEffect, useMemo, useRef, useState } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./MainProduct.css";
import { toPublicPath } from "../../utils/publicPath";
import { useProductsHitachi } from "../../context/ProductsHitachiContext";
import { useProductsKobelco } from "../../context/ProductsKobelcoContext";
import { useProductsKomatsu } from "../../context/ProductsKomatsuContext";

type ProductItem = {
  id: string;
  model?: string;
  name?: string;
  date?: string;
  contact?: string;
  price: string;
  status?: string;
  badge?: "Hot" | null;
  image: string;
  alt: string;
};

function getProductModel(product: ProductItem) {
  return product.model ?? product.name ?? product.id;
}

function getProductDisplay(product: ProductItem) {
  const model = getProductModel(product);
  return product.date ? `${model} (${product.date})` : model;
}

function getProductImageAlt(product: ProductItem, brand?: string): string {
  const normalizedAlt = product.alt?.trim();
  if (normalizedAlt) {
    return normalizedAlt;
  }

  const display = getProductDisplay(product);
  const normalizedBrand = brand?.trim();

  return normalizedBrand
    ? `${display} - ${normalizedBrand} nhập khẩu`
    : `${display} - máy công trình nhập khẩu`;
}

type MainProductGroup = {
  id: string;
  brand: string;
  groupTitle: string;
  products: ProductItem[];
};

type ScrollState = { atStart: boolean; atEnd: boolean };

function MainProduct() {
  const {
    hitachiGroup,
    isLoading: isHitachiLoading,
    error: hitachiError,
  } = useProductsHitachi();
  const {
    kobelcoGroup,
    isLoading: isKobelcoLoading,
    error: kobelcoError,
  } = useProductsKobelco();
  const {
    komatsuGroup,
    isLoading: isKomatsuLoading,
    error: komatsuError,
  } = useProductsKomatsu();
  const [sectionOffset, setSectionOffset] = useState(0);
  const gridRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [scrollStates, setScrollStates] = useState<Record<string, ScrollState>>(
    {},
  );
  const groups = useMemo<MainProductGroup[]>(
    () => [hitachiGroup, kobelcoGroup, komatsuGroup],
    [hitachiGroup, kobelcoGroup, komatsuGroup],
  );

  const isLoading = isHitachiLoading || isKobelcoLoading || isKomatsuLoading;
  const loadError = hitachiError || kobelcoError || komatsuError || "";

  function updateScrollState(id: string, el: HTMLDivElement) {
    setScrollStates((prev) => ({
      ...prev,
      [id]: {
        atStart: el.scrollLeft <= 0,
        atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1,
      },
    }));
  }

  function scroll(id: string, direction: "left" | "right") {
    const el = gridRefs.current[id];
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  useEffect(() => {
    groups.forEach((group) => {
      const el = gridRefs.current[group.id];
      if (el) updateScrollState(group.id, el);
    });
  }, [groups]);

  useEffect(() => {
    function updateSectionOffset() {
      const nav = document.querySelector<HTMLElement>(".site-nav");
      if (!nav) {
        setSectionOffset(0);
        return;
      }

      const gapRaw = getComputedStyle(document.documentElement)
        .getPropertyValue("--site-nav-gap")
        .trim();
      const gapValue = Number.parseFloat(gapRaw);
      const navGap = Number.isNaN(gapValue) ? 0 : gapValue;

      setSectionOffset(nav.offsetHeight + navGap);
    }

    updateSectionOffset();
    window.addEventListener("resize", updateSectionOffset);

    return () => {
      window.removeEventListener("resize", updateSectionOffset);
    };
  }, []);

  return (
    <div className="main-product-page">
      <section
        className="product-section"
        style={{ marginTop: sectionOffset + 12 }}
      >
        {isLoading && (
          <p className="product-state" role="status">
            Đang tải danh sách sản phẩm...
          </p>
        )}

        {!isLoading && loadError && (
          <p className="product-state is-error" role="alert">
            Không thể tải danh sách sản phẩm từ backend.
          </p>
        )}

        {groups.map((group) => {
          const state = scrollStates[group.id] ?? {
            atStart: true,
            atEnd: false,
          };
          const visibleProducts = group.products.slice().sort((a, b) => {
            const hotRankA = a.badge === "Hot" ? 0 : 1;
            const hotRankB = b.badge === "Hot" ? 0 : 1;

            if (hotRankA !== hotRankB) {
              return hotRankA - hotRankB;
            }

            return b.id.localeCompare(a.id);
          });
          const isCompactLayout = visibleProducts.length <= 4;

          if (visibleProducts.length === 0) {
            return null;
          }

          return (
            <article className="product-group" key={group.id}>
              <h2 className="product-group-title">{group.groupTitle}</h2>
              <div
                className={`product-grid-wrapper${isCompactLayout ? " is-compact" : ""}`}
              >
                <button
                  className={`product-grid-arrow product-grid-arrow--left${state.atStart ? " is-faded" : ""}`}
                  type="button"
                  onClick={() => scroll(group.id, "left")}
                  aria-label="Cuộn trái"
                >
                  <FaArrowLeft />
                </button>
                <div
                  className={`product-grid${isCompactLayout ? " is-compact" : ""}`}
                  ref={(el) => {
                    gridRefs.current[group.id] = el;
                  }}
                  onScroll={(e) => updateScrollState(group.id, e.currentTarget)}
                >
                  {visibleProducts.map((product) => (
                    <div className="product-card" key={product.id}>
                      <div className="product-card-image-wrap">
                        {product.badge === "Hot" && (
                          <span className="product-card-badge">HOT</span>
                        )}
                        <img
                          src={toPublicPath(product.image)}
                          alt={getProductImageAlt(product, group.brand)}
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <div className="product-card-content">
                        <h3 className="product-card-title">
                          {getProductDisplay(product)}
                        </h3>
                        <p className="product-card-meta">
                          <span className="product-card-meta-label">
                            Tình trạng:
                          </span>{" "}
                          <span
                            className={`product-card-status ${
                              product.status === "Đã bán"
                                ? "is-sold"
                                : "is-available"
                            }`}
                          >
                            {product.status}
                          </span>
                        </p>
                        <p className="product-card-meta">
                          <span className="product-card-meta-label">
                            Liên hệ:
                          </span>{" "}
                          {product.contact}
                        </p>
                        <Link
                          className="product-card-btn"
                          to={`/product/${group.brand.toLowerCase()}?query=${encodeURIComponent(product.id)}`}
                        >
                          Xem chi tiết
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className={`product-grid-arrow product-grid-arrow--right${state.atEnd ? " is-faded" : ""}`}
                  type="button"
                  onClick={() => scroll(group.id, "right")}
                  aria-label="Cuộn phải"
                >
                  <FaArrowRight />
                </button>
              </div>
              <Link
                className="product-group-btn"
                to={`/product/${group.brand.toLowerCase()}`}
              >
                <span className="product-group-btn-label">Xem tất cả</span>
                <span className="product-group-btn-icon" aria-hidden="true">
                  <FaArrowRight />
                </span>
              </Link>
            </article>
          );
        })}
      </section>
    </div>
  );
}

export default MainProduct;
