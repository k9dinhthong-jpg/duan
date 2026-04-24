import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import "./SelectProduct.css";
import { toPublicPath } from "../../utils/publicPath";

type ProductItem = {
  id: string;
  name: string;
  contact?: string;
  price: string;
  status?: string;
  badge?: "Hot" | null;
  image: string;
  alt: string;
};

type ProductGroup = {
  id: string;
  brand: string;
  groupTitle: string;
  products: ProductItem[];
};

function SelectProduct() {
  const { brand = "hitachi" } = useParams<{ brand: string }>();
  const [group, setGroup] = useState<ProductGroup | null>(null);
  const [sectionOffset, setSectionOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedName, setSelectedName] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  useEffect(() => {
    async function fetchProductsByBrand() {
      const capitalizedBrand =
        brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
      const response = await fetch(
        toPublicPath(`data/Main-Product/Product-${capitalizedBrand}.json`),
      );
      const data = (await response.json()) as ProductGroup;
      setGroup(data);
    }

    fetchProductsByBrand();
  }, [brand]);

  useEffect(() => {
    function updateSectionOffset() {
      const nav = document.querySelector<HTMLElement>(".site-nav");
      if (!nav) {
        return;
      }

      const gapRaw = getComputedStyle(document.documentElement)
        .getPropertyValue("--site-nav-gap")
        .trim();
      const gapValue = Number.parseFloat(gapRaw);
      const navGap = Number.isNaN(gapValue) ? 0 : gapValue;

      setSectionOffset(nav.offsetHeight + navGap);
    }

    let frameId = 0;
    let retries = 0;

    function syncWithRetry() {
      updateSectionOffset();

      if (!document.querySelector(".site-nav") && retries < 20) {
        retries += 1;
        frameId = window.requestAnimationFrame(syncWithRetry);
      }
    }

    syncWithRetry();
    window.addEventListener("resize", updateSectionOffset);
    window.addEventListener("scroll", updateSectionOffset, { passive: true });

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updateSectionOffset);
      window.removeEventListener("scroll", updateSectionOffset);
    };
  }, []);

  const sortedProducts = useMemo(() => {
    return (group?.products ?? [])
      .slice()
      .sort((a, b) => b.id.localeCompare(a.id));
  }, [group]);

  const nameOptions = useMemo(() => {
    return sortedProducts.map((product) => product.name);
  }, [sortedProducts]);

  const statusOptions = useMemo(() => {
    return [
      ...new Set(sortedProducts.map((product) => product.status ?? "Còn hàng")),
    ];
  }, [sortedProducts]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return sortedProducts.filter((product) => {
      const currentStatus = product.status ?? "Còn hàng";

      const byName = selectedName === "all" || product.name === selectedName;
      const byStatus =
        selectedStatus === "all" || currentStatus === selectedStatus;
      const bySearch =
        normalizedQuery.length === 0 ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.id.toLowerCase().includes(normalizedQuery);
      const byBadge = product.badge === "Hot" && currentStatus !== "Đã bán";

      return byName && byStatus && bySearch && byBadge;
    });
  }, [searchQuery, selectedName, selectedStatus, sortedProducts]);

  return (
    <section className="product-page" style={{ marginTop: sectionOffset }}>
      <h1 className="product-page__title">
        {group?.groupTitle ?? "MÁY CÔNG TRÌNH HITACHI"}
      </h1>

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
                alt={product.alt}
              />
            </div>

            <div className="product-card__content">
              <h2 className="product-card__name">{product.name}</h2>

              <p className="product-card__meta">
                <span className="product-card__meta-label">Tình trạng:</span>{" "}
                <span
                  className={`product-card__status ${
                    product.status === "Đã bán" ? "is-sold" : "is-available"
                  }`}
                >
                  {product.status ?? "Còn hàng"}
                </span>
              </p>

              <p className="product-card__meta">
                <span className="product-card__meta-label">Liên hệ:</span>{" "}
                {product.contact ?? "Liên hệ để biết giá"}
              </p>

              <button className="product-card__btn" type="button">
                Xem chi tiết
              </button>
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
