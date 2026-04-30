import { useMemo, useState, useCallback, useEffect, useRef } from "react";
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
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // 5 items per row × 2 rows

  // Reset pagination when filters change
  const prevFiltersRef = useRef({ searchQuery, selectedName, selectedStatus });

  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (
      searchQuery !== prev.searchQuery ||
      selectedName !== prev.selectedName ||
      selectedStatus !== prev.selectedStatus
    ) {
      prevFiltersRef.current = { searchQuery, selectedName, selectedStatus };
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentPage(1);
    }
  }, [searchQuery, selectedName, selectedStatus]);

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
    return sortedProducts.map((product) => getProductDisplay(product));
  }, [sortedProducts]);

  const statusOptions = useMemo(() => {
    return [
      ...new Set([
        ...sortedProducts
          .map((product) => product.status)
          .filter((status): status is string => Boolean(status)),
        "Đã bán",
        "Đặt Hàng",
      ]),
    ];
  }, [sortedProducts]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return sortedProducts.filter((product) => {
      const currentStatus = product.status;

      const productModel = getProductModel(product);
      const productDisplay = getProductDisplay(product);
      const byName = selectedName === "all" || productDisplay === selectedName;
      const byStatus =
        selectedStatus === "all" || currentStatus === selectedStatus;
      const bySearch =
        normalizedQuery.length === 0 ||
        productModel.toLowerCase().includes(normalizedQuery) ||
        product.id.toLowerCase().includes(normalizedQuery);

      return byName && byStatus && bySearch;
    });
  }, [searchQuery, selectedName, selectedStatus, sortedProducts]);

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
    <section className="product-page">
      <h1 className="product-page__title">{group?.groupTitle}</h1>

      {isLoading && (
        <p className="product-filter__empty" role="status" aria-busy="true">
          Đang tải dữ liệu sản phẩm...
        </p>
      )}

      {!isLoading && effectiveLoadError && (
        <p className="product-filter__empty" role="alert">
          {effectiveLoadError}
        </p>
      )}

      <div className="product-filter">
        <label className="product-filter__field" htmlFor="product-search">
          <span className="product-filter__label">Tìm kiếm</span>
          <input
            id="product-search"
            className="product-filter__control"
            type="search"
            placeholder="Nhập tên hoặc mã sản phẩm"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>

        <label className="product-filter__field" htmlFor="product-name-filter">
          <span className="product-filter__label">Lọc theo tên</span>
          <select
            id="product-name-filter"
            className="product-filter__control"
            value={selectedName}
            onChange={(event) => setSelectedName(event.target.value)}
          >
            <option value="all">Tất cả tên sản phẩm</option>
            {nameOptions.map((name) => (
              <option value={name} key={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label
          className="product-filter__field"
          htmlFor="product-status-filter"
        >
          <span className="product-filter__label">Lọc theo tình trạng</span>
          <select
            id="product-status-filter"
            className="product-filter__control"
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
          >
            <option value="all">Tất cả tình trạng</option>
            {statusOptions.map((status) => (
              <option value={status} key={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>

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
              <h2 className="product-card__name">{getProductTitle(product)}</h2>

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
                  <span className="product-card__meta-label">Trạng thái:</span>{" "}
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
                to={`/product/${group?.brand?.toLowerCase()}?productId=${encodeURIComponent(product.id)}&brandId=${encodeURIComponent(product.brandId)}`}
              >
                Xem chi tiết
              </Link>
            </div>
          </article>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <p className="product-filter__empty">
          Không có sản phẩm phù hợp bộ lọc.
        </p>
      ) : null}

      {totalPages > 1 && (
        <nav className="product-pagination" aria-label="Phân trang">
          <button
            className="product-pagination__btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Trang trước"
          >
            ← Trước
          </button>

          <div className="product-pagination__pages">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`product-pagination__page ${
                  page === currentPage ? "is-active" : ""
                }`}
                onClick={() => handlePageChange(page)}
                aria-label={`Trang ${page}`}
                aria-current={page === currentPage ? "page" : undefined}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            className="product-pagination__btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Trang sau"
          >
            Sau →
          </button>
        </nav>
      )}
    </section>
  );
}

export default SelectProduct;
