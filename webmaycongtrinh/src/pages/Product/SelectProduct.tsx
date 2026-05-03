import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import { Link, useParams, useSearchParams } from "react-router-dom";
import "./SelectProduct.css";
import { useListAllProducts } from "../../context/ListAllProducts";
import { useMenuBrand } from "../../context/MenuBrandContext";
import {
  toProductItem,
  getProductTitle,
  getProductImageSrc,
  getProductModel,
  getProductDisplay,
  getProductImageAlt,
} from "../../utils/productHelpers";

const ROWS = 4;

function getPageSize(): number {
  const w = window.innerWidth;
  if (w <= 767) return 5;
  if (w <= 991) return 2 * ROWS;
  if (w <= 1199) return 3 * ROWS;
  return 4 * ROWS;
}

function SelectProduct() {
  const { brand: urlBrand = "hitachi" } = useParams<{ brand: string }>();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("productId") ?? "";
  const brandIdParam = searchParams.get("brandId") ?? "";

  const { productItems: brandItems } = useMenuBrand();
  const {
    productItems: allProductItems,
    isLoading,
    error: loadError,
  } = useListAllProducts();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("query") ?? "",
  );
  const [selectedName, setSelectedName] = useState("all");
  const [selectedModel, setSelectedModel] = useState("all");
  const [selectedOrigin, setSelectedOrigin] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [navOffset, setNavOffset] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(() => getPageSize());

  useEffect(() => {
    function measure() {
      const nav = document.querySelector<HTMLElement>(".site-nav");
      setNavOffset(nav?.offsetHeight ?? 0);
      setItemsPerPage(getPageSize());
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Reset pagination when filters change
  const prevFiltersRef = useRef({
    searchQuery,
    selectedName,
    selectedModel,
    selectedOrigin,
    selectedStatus,
  });

  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (
      searchQuery !== prev.searchQuery ||
      selectedName !== prev.selectedName ||
      selectedModel !== prev.selectedModel ||
      selectedOrigin !== prev.selectedOrigin ||
      selectedStatus !== prev.selectedStatus
    ) {
      prevFiltersRef.current = {
        searchQuery,
        selectedName,
        selectedModel,
        selectedOrigin,
        selectedStatus,
      };
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentPage(1);
    }
  }, [
    searchQuery,
    selectedName,
    selectedModel,
    selectedOrigin,
    selectedStatus,
  ]);

  const group = useMemo(() => {
    // Prioritize brandId from query param
    let targetBrandId = brandIdParam.trim().toUpperCase();

    // If no brandId param, try URL brand slug as fallback by matching last segment of link
    if (!targetBrandId && urlBrand) {
      const fallbackBrand = brandItems.find((item) => {
        const lastSegment =
          item.link.replace(/\/$/, "").split("/").pop()?.toLowerCase() ?? "";
        return lastSegment === urlBrand.toLowerCase();
      });
      if (fallbackBrand) {
        targetBrandId = fallbackBrand.brand.trim().toUpperCase();
      }
    }

    // Otherwise, try to extract from productId
    if (!targetBrandId && productId) {
      const selectedProduct = allProductItems
        .map(toProductItem)
        .find((p) => p.id === productId);
      if (selectedProduct) {
        targetBrandId = selectedProduct.brandId;
      }
    }

    if (!targetBrandId) {
      return null;
    }

    const matchedBrand = brandItems.find(
      (item) => item.brand.trim().toUpperCase() === targetBrandId,
    );

    if (!matchedBrand) {
      return null;
    }

    const products = allProductItems
      .map(toProductItem)
      .filter(
        (product) =>
          product.id && product.isActive && product.brandId === targetBrandId,
      );

    return {
      id: String(matchedBrand.id),
      brand: targetBrandId,
      groupTitle: matchedBrand.name,
      products,
    };
  }, [allProductItems, brandItems, brandIdParam, productId, urlBrand]);

  const effectiveLoadError =
    loadError ||
    (!isLoading && !group
      ? "Không thể tải dữ liệu sản phẩm theo thương hiệu này."
      : "");

  const sortedProducts = useMemo(() => {
    return (group?.products ?? []).slice().sort((a, b) => {
      const hotRankA = a.badge === "Hot" ? 0 : 1;
      const hotRankB = b.badge === "Hot" ? 0 : 1;

      if (hotRankA !== hotRankB) {
        return hotRankA - hotRankB;
      }

      // Sort by created_at (newest first), fallback to id
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;

      if (dateA !== dateB) {
        return dateB - dateA; // Newest first
      }

      return b.id.localeCompare(a.id);
    });
  }, [group]);

  const nameOptions = useMemo(() => {
    const seen = new Set<string>();
    return sortedProducts
      .map((p) => getProductDisplay(p))
      .filter((v) => v && (seen.has(v) ? false : seen.add(v) && true));
  }, [sortedProducts]);

  const modelOptions = useMemo(() => {
    const seen = new Set<string>();
    return sortedProducts
      .map((p) => getProductModel(p))
      .filter((v) => v && (seen.has(v) ? false : seen.add(v) && true));
  }, [sortedProducts]);

  const originOptions = useMemo(() => {
    const seen = new Set<string>();
    return sortedProducts
      .map((p) => p.origin ?? "")
      .filter((v) => v && (seen.has(v) ? false : seen.add(v) && true));
  }, [sortedProducts]);

  const statusOptions = useMemo(() => {
    const seen = new Set<string>();
    return sortedProducts
      .map((p) => p.status ?? "")
      .filter((v) => v && (seen.has(v) ? false : seen.add(v) && true));
  }, [sortedProducts]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return sortedProducts.filter((product) => {
      const productModel = getProductModel(product);
      const productDisplay = getProductDisplay(product);
      const byName = selectedName === "all" || productDisplay === selectedName;
      const byModel = selectedModel === "all" || productModel === selectedModel;
      const byOrigin =
        selectedOrigin === "all" || (product.origin ?? "") === selectedOrigin;
      const byStatus =
        selectedStatus === "all" || (product.status ?? "") === selectedStatus;
      const bySearch =
        normalizedQuery.length === 0 ||
        productModel.toLowerCase().includes(normalizedQuery) ||
        product.id.toLowerCase().includes(normalizedQuery);

      return byName && byModel && byOrigin && byStatus && bySearch;
    });
  }, [
    searchQuery,
    selectedName,
    selectedModel,
    selectedOrigin,
    selectedStatus,
    sortedProducts,
  ]);

  const hasFilter = !!(
    searchQuery ||
    selectedName !== "all" ||
    selectedModel !== "all" ||
    selectedOrigin !== "all" ||
    selectedStatus !== "all"
  );

  function resetFilters() {
    setSearchQuery("");
    setSelectedName("all");
    setSelectedModel("all");
    setSelectedOrigin("all");
    setSelectedStatus("all");
    setCurrentPage(1);
  }

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const handlePageChange = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [totalPages],
  );

  return (
    <section className="product-page" style={{ paddingTop: navOffset + 24 }}>
      <div className="product-catalog">
        <div className="product-page__head">
          <h1 className="product-page__title">{group?.groupTitle}</h1>
          {!isLoading && !effectiveLoadError && (
            <span className="product-page__count">
              {filteredProducts.length}
              {hasFilter ? ` / ${sortedProducts.length}` : ""} sản phẩm
            </span>
          )}
        </div>

        {isLoading && (
          <p className="product-state" role="status" aria-busy="true">
            Đang tải dữ liệu sản phẩm...
          </p>
        )}

        {!isLoading && effectiveLoadError && (
          <p className="product-state is-error" role="alert">
            {effectiveLoadError}
          </p>
        )}

        {!isLoading && !effectiveLoadError && sortedProducts.length > 0 && (
          <div className="product-filter">
            <input
              className="product-filter__input"
              type="search"
              placeholder="Nhập tên hoặc mã sản phẩm"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Tìm kiếm sản phẩm"
            />

            <select
              className="product-filter__select"
              value={selectedName}
              onChange={(e) => {
                setSelectedName(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Lọc theo tên"
            >
              <option value="all">Tất cả tên sản phẩm</option>
              {nameOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>

            <select
              className="product-filter__select"
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Lọc theo model"
            >
              <option value="all">Tất cả model</option>
              {modelOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>

            {originOptions.length > 0 && (
              <select
                className="product-filter__select"
                value={selectedOrigin}
                onChange={(e) => {
                  setSelectedOrigin(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Lọc theo xuất xứ"
              >
                <option value="all">Tất cả xuất xứ</option>
                {originOptions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            )}

            <select
              className="product-filter__select"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Lọc theo trạng thái"
            >
              <option value="all">Tất cả trạng thái</option>
              {statusOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>

            {hasFilter && (
              <button
                className="product-filter__reset"
                onClick={resetFilters}
                aria-label="Xóa bộ lọc"
              >
                <FaTimes /> Xóa bộ lọc
              </button>
            )}
          </div>
        )}

        <div className="product-page__grid">
          {paginatedProducts.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-card__image-wrap">
                {product.badge === "Hot" && (
                  <span className="product-card__badge">HOT</span>
                )}
                <img
                  className="product-card__image"
                  src={getProductImageSrc(product.image)}
                  alt={getProductImageAlt(product, group?.brand ?? "")}
                  loading="lazy"
                  decoding="async"
                />
              </div>

              <div className="product-card__content">
                <h2 className="product-card__name">
                  {getProductTitle(product)}
                </h2>

                <p className="product-card__meta">
                  <span className="product-card__meta-label">Mã sản phẩm:</span>{" "}
                  {product.id}
                </p>

                {product.origin ? (
                  <p className="product-card__meta">
                    <span className="product-card__meta-label">Xuất xứ:</span>{" "}
                    {product.origin}
                  </p>
                ) : null}

                {product.vat ? (
                  <p className="product-card__meta">
                    <span className="product-card__meta-label">VAT:</span>{" "}
                    {product.vat}
                  </p>
                ) : null}

                {product.status ? (
                  <p className="product-card__meta">
                    <span className="product-card__meta-label">
                      Trạng thái:
                    </span>{" "}
                    <span
                      className={`product-card__status ${
                        product.status === "Đã bán" ? "is-sold" : "is-available"
                      }`}
                    >
                      {product.status}
                    </span>
                  </p>
                ) : null}

                <Link
                  className="product-card__btn"
                  to={`/product/detail?productId=${encodeURIComponent(product.id)}&brandId=${encodeURIComponent(product.brandId)}`}
                >
                  Xem chi tiết
                </Link>
              </div>
            </article>
          ))}
        </div>

        {!isLoading && !effectiveLoadError && filteredProducts.length === 0 && (
          <p className="product-state">Không có sản phẩm phù hợp bộ lọc.</p>
        )}

        {totalPages > 1 && (
          <nav className="product-pagination" aria-label="Phân trang">
            <button
              className="product-pagination__btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Trang trước"
            >
              <FaChevronLeft />
            </button>

            <div className="product-pagination__pages">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`product-pagination__page${p === currentPage ? " is-active" : ""}`}
                  onClick={() => handlePageChange(p)}
                  aria-current={p === currentPage ? "page" : undefined}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              className="product-pagination__btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Trang sau"
            >
              <FaChevronRight />
            </button>
          </nav>
        )}
      </div>
    </section>
  );
}

export default SelectProduct;
