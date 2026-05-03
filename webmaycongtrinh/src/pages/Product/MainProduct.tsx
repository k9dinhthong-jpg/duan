import { useEffect, useMemo, useRef, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./MainProduct.css";
import { useListAllProducts } from "../../context/ListAllProducts";
import { useMenuBrand } from "../../context/MenuBrandContext";
import {
  type ProductItem,
  toProductItem,
  getProductTitle,
  getProductModel,
  getProductImageSrc,
  getProductImageAlt,
} from "../../utils/productHelpers";

const ROWS = 4;

function getCols(): number {
  const w = window.innerWidth;
  if (w <= 767) return 1;
  if (w <= 991) return 3;
  return 4;
}

function getPageSize(): number {
  const w = window.innerWidth;
  if (w <= 767) return 5;
  return getCols() * ROWS;
}

function MainProduct() {
  const { productItems: brandItems } = useMenuBrand();
  const {
    productItems: allProductItems,
    isLoading,
    error: loadError,
  } = useListAllProducts();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => getPageSize());
  const [navOffset, setNavOffset] = useState(0);
  const pageRef = useRef<HTMLDivElement>(null);

  const [filterBrand, setFilterBrand] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterModel, setFilterModel] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    function measure() {
      const nav = document.querySelector<HTMLElement>(".site-nav");
      setNavOffset(nav?.offsetHeight ?? 0);
      setPageSize(getPageSize());
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Build brand lookup: normalizedBrand → brandSlug + groupTitle
  const brandMap = useMemo(() => {
    const map = new Map<string, { slug: string; title: string }>();
    brandItems.forEach((b) => {
      map.set(b.brand.trim().toUpperCase(), {
        slug: b.brand.trim().toLowerCase(),
        title: b.name,
      });
    });
    return map;
  }, [brandItems]);

  // All active, unsold products sorted by created_at desc then id desc
  const products = useMemo<ProductItem[]>(() => {
    return allProductItems
      .map(toProductItem)
      .filter((p) => {
        if (!p.id || !p.brandId) return false;
        const status = (p.status ?? "").trim().toLocaleLowerCase("vi-VN");
        return p.isActive && status !== "đã bán";
      })
      .sort((a, b) => {
        const da = a.created_at ?? "";
        const db = b.created_at ?? "";
        if (db !== da) return db.localeCompare(da);
        return b.id.localeCompare(a.id);
      });
  }, [allProductItems]);

  // Unique filter options
  const brandOptions = useMemo(() => {
    const seen = new Set<string>();
    return products
      .map((p) => ({
        value: p.brandId,
        label: brandMap.get(p.brandId)?.title ?? p.brandId,
      }))
      .filter((o) => (seen.has(o.value) ? false : seen.add(o.value) && true));
  }, [products, brandMap]);

  const nameOptions = useMemo(() => {
    const seen = new Set<string>();
    return products
      .map((p) => p.name ?? "")
      .filter((v) => v && (seen.has(v) ? false : seen.add(v) && true));
  }, [products]);

  const originOptions = useMemo(() => {
    const seen = new Set<string>();
    return products
      .map((p) => p.origin ?? "")
      .filter((v) => v && (seen.has(v) ? false : seen.add(v) && true));
  }, [products]);

  const modelOptions = useMemo(() => {
    const seen = new Set<string>();
    return products
      .map((p) => getProductModel(p))
      .filter((v) => v && (seen.has(v) ? false : seen.add(v) && true));
  }, [products]);

  const statusOptions = useMemo(() => {
    const seen = new Set<string>();
    return products
      .map((p) => p.status ?? "")
      .filter((v) => v && (seen.has(v) ? false : seen.add(v) && true));
  }, [products]);

  // Filtered products
  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (filterBrand && p.brandId !== filterBrand) return false;
      if (filterName && (p.name ?? "") !== filterName) return false;
      if (filterModel && getProductModel(p) !== filterModel) return false;
      if (filterOrigin && (p.origin ?? "") !== filterOrigin) return false;
      if (filterStatus && (p.status ?? "") !== filterStatus) return false;
      return true;
    });
  }, [
    products,
    filterBrand,
    filterName,
    filterModel,
    filterOrigin,
    filterStatus,
  ]);

  const hasFilter = !!(
    filterBrand ||
    filterName ||
    filterModel ||
    filterOrigin ||
    filterStatus
  );

  function resetFilters() {
    setFilterBrand("");
    setFilterName("");
    setFilterModel("");
    setFilterOrigin("");
    setFilterStatus("");
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageProducts = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  function goTo(p: number) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div
      className="mp-page"
      ref={pageRef}
      style={{ paddingTop: navOffset + 24 }}
    >
      <div className="mp-catalog">
        {/* Header */}
        <div className="mp-catalog__head">
          <h1 className="mp-catalog__title">Tất cả sản phẩm</h1>
          {!isLoading && !loadError && (
            <span className="mp-catalog__count">
              {filtered.length}
              {hasFilter ? ` / ${products.length}` : ""} sản phẩm
            </span>
          )}
        </div>

        {/* Filter bar */}
        {!isLoading && !loadError && products.length > 0 && (
          <div className="mp-filter">
            <select
              className="mp-filter__select"
              value={filterBrand}
              onChange={(e) => {
                setFilterBrand(e.target.value);
                setPage(1);
              }}
              aria-label="Lọc theo hãng"
            >
              <option value="">Tất cả hãng</option>
              {brandOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <select
              className="mp-filter__select"
              value={filterName}
              onChange={(e) => {
                setFilterName(e.target.value);
                setPage(1);
              }}
              aria-label="Lọc theo kiểu máy"
            >
              <option value="">Tất cả kiểu máy</option>
              {nameOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>

            <select
              className="mp-filter__select"
              value={filterModel}
              onChange={(e) => {
                setFilterModel(e.target.value);
                setPage(1);
              }}
              aria-label="Lọc theo model"
            >
              <option value="">Tất cả model</option>
              {modelOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>

            <select
              className="mp-filter__select"
              value={filterOrigin}
              onChange={(e) => {
                setFilterOrigin(e.target.value);
                setPage(1);
              }}
              aria-label="Lọc theo xuất xứ"
            >
              <option value="">Tất cả xuất xứ</option>
              {originOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>

            <select
              className="mp-filter__select"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              aria-label="Lọc theo trạng thái"
            >
              <option value="">Tất cả trạng thái</option>
              {statusOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>

            {hasFilter && (
              <button
                className="mp-filter__reset"
                onClick={resetFilters}
                aria-label="Xóa bộ lọc"
              >
                <FaTimes /> Xóa bộ lọc
              </button>
            )}
          </div>
        )}

        {/* States */}
        {isLoading && (
          <p className="mp-state" role="status" aria-busy="true">
            Đang tải danh sách sản phẩm...
          </p>
        )}
        {!isLoading && loadError && (
          <p className="mp-state is-error" role="alert">
            Không thể tải danh sách sản phẩm từ backend.
          </p>
        )}
        {!isLoading && !loadError && products.length === 0 && (
          <p className="mp-state">Chưa có sản phẩm nào.</p>
        )}

        {/* Grid */}
        {pageProducts.length > 0 && (
          <div className="mp-grid">
            {pageProducts.map((product) => {
              return (
                <div className="mp-card" key={product.id}>
                  <div className="mp-card__img-wrap">
                    {product.badge === "Hot" && (
                      <span className="mp-card__badge">HOT</span>
                    )}
                    <img
                      src={getProductImageSrc(product.image)}
                      alt={getProductImageAlt(product, product.brandId)}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="mp-card__body">
                    <h3 className="mp-card__name">
                      {product.name
                        ? `${product.name} ${getProductTitle(product)}`.toUpperCase()
                        : getProductTitle(product).toUpperCase()}
                    </h3>
                    <ul className="mp-card__meta">
                      <li>
                        <span>Mã:</span> {product.id}
                      </li>
                      {product.origin ? (
                        <li>
                          <span>Xuất xứ:</span> {product.origin}
                        </li>
                      ) : null}
                      {product.vat ? (
                        <li>
                          <span>VAT:</span> {product.vat}
                        </li>
                      ) : null}
                      {product.status ? (
                        <li>
                          <span>Trạng thái:</span>{" "}
                          <em
                            className={
                              product.status === "Đã bán"
                                ? "is-sold"
                                : "is-available"
                            }
                          >
                            {product.status}
                          </em>
                        </li>
                      ) : null}
                    </ul>
                    <Link
                      className="mp-card__btn"
                      to={`/product/detail?productId=${encodeURIComponent(product.id)}&brandId=${encodeURIComponent(product.brandId)}`}
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mp-pagination">
            <button
              className="mp-pagination__btn"
              onClick={() => goTo(safePage - 1)}
              disabled={safePage <= 1}
              aria-label="Trang trước"
            >
              <FaChevronLeft />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`mp-pagination__page${p === safePage ? " is-active" : ""}`}
                onClick={() => goTo(p)}
                aria-current={p === safePage ? "page" : undefined}
              >
                {p}
              </button>
            ))}

            <button
              className="mp-pagination__btn"
              onClick={() => goTo(safePage + 1)}
              disabled={safePage >= totalPages}
              aria-label="Trang sau"
            >
              <FaChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MainProduct;
