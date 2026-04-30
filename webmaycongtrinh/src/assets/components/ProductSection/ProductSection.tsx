import { useEffect, useMemo, useState } from "react";
import { FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./ProductSection.css";
import { toPublicPath } from "../../../utils/publicPath";
import { useProductsHitachi } from "../../../context/ProductsHitachiContext";
import { useProductsKobelco } from "../../../context/ProductsKobelcoContext";
import { useProductsKomatsu } from "../../../context/ProductsKomatsuContext";

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

function getProductImageAlt(product: ProductItem, groupTitle?: string) {
  const normalizedAlt = product.alt?.trim();
  if (normalizedAlt) {
    return normalizedAlt;
  }

  const display = getProductDisplay(product);
  const normalizedGroup = groupTitle?.trim();

  return normalizedGroup
    ? `${display} - ${normalizedGroup} nhập khẩu`
    : `${display} - máy công trình nhập khẩu`;
}

type ProductGroup = {
  id?: string;
  brand?: string;
  groupTitle: string;
  products: ProductItem[];
};

function getGroupBrandSlug(group: ProductGroup) {
  const value = group.brand ?? group.id;
  return value ? value.toLowerCase() : "";
}

function ProductSection() {
  const { hitachiGroup } = useProductsHitachi();
  const { kobelcoGroup } = useProductsKobelco();
  const { komatsuGroup } = useProductsKomatsu();
  const [itemsToShow, setItemsToShow] = useState(4);
  const productGroups = useMemo<ProductGroup[]>(
    () => [hitachiGroup, kobelcoGroup, komatsuGroup],
    [hitachiGroup, kobelcoGroup, komatsuGroup],
  );

  const getItemsToShow = (width: number): number => {
    if (width > 1200) return 4;
    if (width >= 768) return 3;
    return 2;
  };

  useEffect(() => {
    function handleResize() {
      setItemsToShow(getItemsToShow(window.innerWidth));
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <section className="product-section home-product-section">
      {productGroups.map((group) => {
        const groupBrandSlug = getGroupBrandSlug(group);
        const visibleProducts = group.products
          .filter(
            (product) => product.badge === "Hot" && product.status !== "Đã bán",
          )
          .sort((a, b) => b.id.localeCompare(a.id))
          .slice(0, itemsToShow);

        if (visibleProducts.length === 0) {
          return null;
        }

        return (
          <article className="product-group" key={group.groupTitle}>
            <header className="product-group-heading">
              <h2 className="product-group-title">{group.groupTitle}</h2>
              <p className="product-group-subtitle">SẢN PHẨM NỔI BẬT</p>
            </header>
            <div className="product-grid">
              {visibleProducts.map((product) => (
                <div className="product-card" key={product.id}>
                  <div className="product-card-image-wrap">
                    {product.badge === "Hot" && (
                      <span className="product-card-badge">HOT</span>
                    )}
                    <img
                      src={toPublicPath(product.image)}
                      alt={getProductImageAlt(product, group.groupTitle)}
                    />
                  </div>
                  <div className="product-card-content">
                    <h3 className="product-card-title">
                      {getProductDisplay(product)}
                    </h3>
                    {product.status ? (
                      <p className="product-card-meta">
                        <span className="product-card-meta-label">
                          Tình trạng:
                        </span>{" "}
                        <span
                          className={`product-card-status ${product.status === "Đã bán" ? "is-sold" : "is-available"}`}
                        >
                          {product.status}
                        </span>
                      </p>
                    ) : null}
                    {product.contact ? (
                      <p className="product-card-meta">
                        <span className="product-card-meta-label">
                          Liên hệ:
                        </span>{" "}
                        {product.contact}
                      </p>
                    ) : null}
                    <Link
                      className="product-card-btn"
                      to={
                        groupBrandSlug
                          ? `/product/${groupBrandSlug}?query=${encodeURIComponent(product.id)}`
                          : "/product"
                      }
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <Link
              className="product-group-btn"
              to={groupBrandSlug ? `/product/${groupBrandSlug}` : "/product"}
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
  );
}

export default ProductSection;
