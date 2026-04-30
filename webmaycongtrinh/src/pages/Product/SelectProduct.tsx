import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import "./SelectProduct.css";
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

function getProductImageAlt(product: ProductItem, brand: string): string {
  const normalizedAlt = product.alt?.trim();
  if (normalizedAlt) {
    return normalizedAlt;
  }

  const display = getProductDisplay(product);
  return `${display} - ${brand} nhập khẩu`;
}

function SelectProduct() {
  const { brand = "hitachi" } = useParams<{ brand: string }>();
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
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("query") ?? "",
  );
  const [selectedName, setSelectedName] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const brandState = useMemo(() => {
    const normalizedBrand = brand.toLowerCase();

    if (normalizedBrand === "hitachi") {
      return {
        group: hitachiGroup,
        isLoading: isHitachiLoading,
        loadError: hitachiError ?? "",
      };
    }

    if (normalizedBrand === "kobelco") {
      return {
        group: kobelcoGroup,
        isLoading: isKobelcoLoading,
        loadError: kobelcoError ?? "",
      };
    }

    if (normalizedBrand === "komatsu") {
      return {
        group: komatsuGroup,
        isLoading: isKomatsuLoading,
        loadError: komatsuError ?? "",
      };
    }

    return {
      group: null,
      isLoading: false,
      loadError: "Không thể tải dữ liệu sản phẩm theo thương hiệu này.",
    };
  }, [
    brand,
    hitachiGroup,
    hitachiError,
    isHitachiLoading,
    kobelcoGroup,
    kobelcoError,
    isKobelcoLoading,
    komatsuGroup,
    komatsuError,
    isKomatsuLoading,
  ]);

  const { group, isLoading, loadError } = brandState;

  const sortedProducts = useMemo(() => {
    return (group?.products ?? []).slice().sort((a, b) => {
      const hotRankA = a.badge === "Hot" ? 0 : 1;
      const hotRankB = b.badge === "Hot" ? 0 : 1;

      if (hotRankA !== hotRankB) {
        return hotRankA - hotRankB;
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

  return (
    <section className="product-page">
      <h1 className="product-page__title">{group?.groupTitle}</h1>

      {isLoading && (
        <p className="product-filter__empty" role="status">
          Đang tải dữ liệu sản phẩm...
        </p>
      )}

      {!isLoading && loadError && (
        <p className="product-filter__empty" role="alert">
          {loadError}
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
        {filteredProducts.map((product) => (
          <article className="product-card" key={product.id}>
            <div className="product-card__image-wrap">
              {product.badge === "Hot" && (
                <span className="product-card__badge">HOT</span>
              )}
              <img
                className="product-card__image"
                src={toPublicPath(product.image)}
                alt={getProductImageAlt(product, brand)}
                loading="lazy"
                decoding="async"
              />
            </div>

            <div className="product-card__content">
              <h2 className="product-card__name">
                {getProductDisplay(product)}
              </h2>

              {product.status ? (
                <p className="product-card__meta">
                  <span className="product-card__meta-label">Tình trạng:</span>{" "}
                  <span
                    className={`product-card__status ${
                      product.status === "Đã bán" ? "is-sold" : "is-available"
                    }`}
                  >
                    {product.status}
                  </span>
                </p>
              ) : null}

              {product.contact ? (
                <p className="product-card__meta">
                  <span className="product-card__meta-label">Liên hệ:</span>{" "}
                  {product.contact}
                </p>
              ) : null}

              <Link
                className="product-card__btn"
                to={`/contact?product=${encodeURIComponent(`${product.id} - ${getProductDisplay(product)}`)}`}
              >
                Liên hệ tư vấn
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
    </section>
  );
}

export default SelectProduct;
