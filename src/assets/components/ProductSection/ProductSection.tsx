import { useEffect, useState } from "react";
import { FaArrowRight } from "react-icons/fa";
import "./ProductSection.css";
import { toPublicPath } from "../../../utils/publicPath";

type ProductItem = {
  id: string;
  name: string;
  contact?: string;
  price: string;
  status?: string;
  image: string;
  alt: string;
};

type ProductGroup = {
  groupTitle: string;
  products: ProductItem[];
};

function ProductSection() {
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [itemsToShow, setItemsToShow] = useState(4);

  const getItemsToShow = (width: number): number => {
    if (width >= 1400) return 4;
    if (width >= 1024) return 4;
    if (width >= 768) return 3;
    return 2;
  };

  useEffect(() => {
    async function fetchProducts() {
      const files = [
        "data/Main-Product/Product-Hitachi.json",
        "data/Main-Product/Product-Kobelco.json",
        "data/Main-Product/Product-Komatsu.json",
      ];

      const responses = await Promise.all(
        files.map((file) => fetch(toPublicPath(file))),
      );
      const data = await Promise.all(
        responses.map((response) => response.json() as Promise<ProductGroup>),
      );

      setProductGroups(data);
    }

    fetchProducts();
  }, []);

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
    <section className="product-section">
      {productGroups.map((group) => (
        <article className="product-group" key={group.groupTitle}>
          <h2 className="product-group-title">{group.groupTitle}</h2>
          <div className="product-grid">
            {group.products
              .sort((a, b) => b.id.localeCompare(a.id))
              .slice(0, itemsToShow)
              .map((product) => (
                <div className="product-card" key={product.id}>
                  <div className="product-card-image-wrap">
                    <img src={toPublicPath(product.image)} alt={product.alt} />
                  </div>
                  <div className="product-card-content">
                    <h3 className="product-card-title">{product.name}</h3>
                    <p className="product-card-meta">
                      <span className="product-card-meta-label">
                        Tình trạng:
                      </span>{" "}
                      <span
                        className={`product-card-status ${product.status === "Đã bán" ? "is-sold" : "is-available"}`}
                      >
                        {product.status ?? "Còn hàng"}
                      </span>
                    </p>
                    {/* <p className="product-card-meta">
                    <span className="product-card-meta-label">Giá:</span>{" "}
                    {product.price.trim()
                      ? product.price
                      : "Liên hệ người bán để cập nhật giá"}
                  </p> */}
                    <p className="product-card-meta">
                      <span className="product-card-meta-label">Liên hệ:</span>{" "}
                      {product.contact ?? "Liên hệ để biết giá"}
                    </p>
                    <button className="product-card-btn" type="button">
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              ))}
          </div>
          <button className="product-group-btn" type="button">
            <span className="product-group-btn-label">Xem tất cả</span>
            <span className="product-group-btn-icon" aria-hidden="true">
              <FaArrowRight />
            </span>
          </button>
        </article>
      ))}
    </section>
  );
}

export default ProductSection;
