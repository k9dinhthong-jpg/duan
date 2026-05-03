import { FaArrowRight, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useMenuBrand } from "../../../context/MenuBrandContext";
import {
  type ProductItemRecord,
  useListAllProducts,
} from "../../../context/ListAllProducts";
import { toPublicPath } from "../../../utils/publicPath";
import "./ProductSection.css";

function getProductBrandId(product: ProductItemRecord): string {
  const raw = product.brand_id;
  return typeof raw === "string" ? raw.trim().toUpperCase() : "";
}

function getProductTitle(product: ProductItemRecord): string {
  const brandId =
    typeof product.brand_id === "string" ? product.brand_id.trim() : "";
  const model = typeof product.model === "string" ? product.model.trim() : "";
  const name = typeof product.name === "string" ? product.name.trim() : "";
  const id = typeof product.id === "string" ? product.id.trim() : "";

  const brandModelTitle = [brandId, model].filter(Boolean).join(" ");
  if (brandModelTitle) {
    return brandModelTitle;
  }

  return name || id;
}

function getImageSrc(product: ProductItemRecord): string {
  const image = typeof product.image === "string" ? product.image.trim() : "";
  if (!image) {
    return toPublicPath("img/Product/default.png");
  }

  return /^https?:\/\//i.test(image) ? image : toPublicPath(image);
}

function BrandCarousel({ children }: { children: React.ReactNode }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [cardsPerView, setCardsPerView] = useState<number | null>(null);

  useEffect(() => {
    if (!gridRef.current) return;

    function syncCardsPerView() {
      const grid = gridRef.current;
      if (!grid) return;
      const width = grid.clientWidth;
      setCardsPerView(width <= 767 ? 1 : null);
    }

    syncCardsPerView();

    const observer = new ResizeObserver(syncCardsPerView);
    observer.observe(gridRef.current);
    window.addEventListener("resize", syncCardsPerView);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncCardsPerView);
    };
  }, []);

  function scrollByPage(direction: -1 | 1) {
    const grid = gridRef.current;
    if (!grid) return;
    grid.scrollBy({ left: direction * grid.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="product-brand__carousel">
      <button
        className="product-brand__arrow product-brand__arrow--prev"
        onClick={() => scrollByPage(-1)}
        aria-label="Sản phẩm trước"
      >
        <FaChevronLeft aria-hidden="true" />
      </button>
      <div
        className={`product-brand__grid ${cardsPerView === 1 ? "is-single-card" : ""}`}
        ref={gridRef}
        style={
          cardsPerView === 1
            ? ({ "--cards-per-view": "1" } as React.CSSProperties)
            : undefined
        }
      >
        {children}
      </div>
      <button
        className="product-brand__arrow product-brand__arrow--next"
        onClick={() => scrollByPage(1)}
        aria-label="Sản phẩm tiếp theo"
      >
        <FaChevronRight aria-hidden="true" />
      </button>
    </div>
  );
}

function ProductSection() {
  const { productItems } = useMenuBrand();
  const {
    productItems: allProductItems,
    isLoading,
    error,
  } = useListAllProducts();

  if (productItems.length === 0) {
    return null;
  }

  return (
    <section className="product-section">
      {isLoading ? (
        <p className="product-section__state" role="status" aria-busy="true">
          Đang tải danh sách sản phẩm...
        </p>
      ) : null}

      {!isLoading && error ? (
        <p className="product-section__state is-error">{error}</p>
      ) : null}

      <div className="product-section__groups">
        {productItems.map((brand) => {
          const brandSlug = brand.brand.trim().toLowerCase();
          const normalizedBrand = brand.brand.trim().toUpperCase();
          const productsByBrand = allProductItems
            .filter((product) => {
              const isActive = Number(product.is_active) !== 0;
              const status =
                typeof product.status === "string"
                  ? product.status.trim().toLocaleLowerCase("vi-VN")
                  : "";

              const isNotSold = status !== "đã bán";
              return (
                isActive &&
                isNotSold &&
                getProductBrandId(product) === normalizedBrand
              );
            })
            .sort((a, b) => {
              const hasBadgeA =
                typeof a.badge === "string" && a.badge.trim() !== "" ? 0 : 1;
              const hasBadgeB =
                typeof b.badge === "string" && b.badge.trim() !== "" ? 0 : 1;

              if (hasBadgeA !== hasBadgeB) {
                return hasBadgeA - hasBadgeB;
              }

              return String(b.id).localeCompare(String(a.id));
            });

          return (
            <article key={brand.id} className="product-brand">
              <h2 className="product-brand__title">{brand.name}</h2>
              <p className="product-brand__subtitle">SẢN PHẨM NỔI BẬT</p>

              <BrandCarousel>
                {productsByBrand.length === 0 ? (
                  <p className="product-brand__empty">Chưa có sản phẩm</p>
                ) : (
                  <>
                    {productsByBrand.map((product) => {
                      const origin =
                        typeof product.origin === "string"
                          ? product.origin.trim()
                          : "";
                      const vat =
                        typeof product.vat === "string"
                          ? product.vat.trim()
                          : "";
                      const status =
                        typeof product.status === "string"
                          ? product.status.trim()
                          : "";
                      const productId =
                        typeof product.id === "string" ? product.id.trim() : "";
                      const imageAlt = `${getProductTitle(product)} - ${brand.brand}`;

                      return (
                        <article key={product.id} className="product-card">
                          <div className="product-card__image-wrap">
                            {product.badge === "Hot" ? (
                              <span className="product-card__badge">HOT</span>
                            ) : null}
                            <img
                              className="product-card__image"
                              src={getImageSrc(product)}
                              alt={imageAlt}
                              loading="lazy"
                              decoding="async"
                            />
                          </div>

                          <div className="product-card__content">
                            <h3 className="product-card__title">
                              {(typeof product.name === "string" &&
                              product.name.trim()
                                ? `${product.name.trim()} ${getProductTitle(product)}`
                                : getProductTitle(product)
                              ).toUpperCase()}
                            </h3>

                            {productId ? (
                              <p className="product-card__meta">
                                <span className="product-card__meta-label">
                                  Mã sản phẩm:
                                </span>{" "}
                                {productId}
                              </p>
                            ) : null}

                            {origin ? (
                              <p className="product-card__meta">
                                <span className="product-card__meta-label">
                                  Xuất xứ:
                                </span>{" "}
                                {origin}
                              </p>
                            ) : null}

                            {vat ? (
                              <p className="product-card__meta">
                                <span className="product-card__meta-label">
                                  VAT:
                                </span>{" "}
                                {vat}
                              </p>
                            ) : null}

                            {status ? (
                              <p className="product-card__meta">
                                <span className="product-card__meta-label">
                                  Trạng thái:
                                </span>{" "}
                                <span
                                  className={`product-card__status ${
                                    status === "Đã bán"
                                      ? "is-sold"
                                      : "is-available"
                                  }`}
                                >
                                  {status}
                                </span>
                              </p>
                            ) : null}

                            <Link
                              className="product-card__btn"
                              to={`/product/detail?productId=${encodeURIComponent(product.id)}&brandId=${encodeURIComponent(brand.brand)}`}
                            >
                              Xem chi tiết
                            </Link>
                          </div>
                        </article>
                      );
                    })}
                  </>
                )}
              </BrandCarousel>

              <Link
                className="product-brand__all-btn"
                to={`/product/${brandSlug}?brandId=${brand.brand}`}
              >
                <span className="product-brand__all-btn-label">Xem tất cả</span>
                <span
                  className="product-brand__all-btn-icon"
                  aria-hidden="true"
                >
                  <FaArrowRight />
                </span>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default ProductSection;
