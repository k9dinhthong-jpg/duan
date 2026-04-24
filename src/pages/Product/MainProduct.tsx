import { useEffect, useRef, useState } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import "./MainProduct.css";
import { toPublicPath } from "../../utils/publicPath";

type ProductItem = {
  id: string;
  name: string;
  contact?: string;
  price: string;
  status?: string;
  image: string;
  alt: string;
};

type MainProductGroup = {
  id: string;
  brand: string;
  groupTitle: string;
  products: ProductItem[];
};

type ScrollState = { atStart: boolean; atEnd: boolean };

function MainProduct() {
  const [groups, setGroups] = useState<MainProductGroup[]>([]);
  const [sectionOffset, setSectionOffset] = useState(0);
  const gridRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [scrollStates, setScrollStates] = useState<Record<string, ScrollState>>(
    {},
  );

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
    async function fetchMainProducts() {
      const files = [
        "data/Main-Product/Product-Hitachi.json",
        "data/Main-Product/Product-Kobelco.json",
        "data/Main-Product/Product-Komatsu.json",
      ];

      const responses = await Promise.all(
        files.map((file) => fetch(toPublicPath(file))),
      );
      const data = await Promise.all(
        responses.map(
          (response) => response.json() as Promise<MainProductGroup>,
        ),
      );

      setGroups(data);
    }

    fetchMainProducts();
  }, []);

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
    <section
      className="product-section"
      style={{ marginTop: sectionOffset + 12 }}
    >
      {groups.map((group) => {
        const state = scrollStates[group.id] ?? { atStart: true, atEnd: false };
        return (
          <article className="product-group" key={group.groupTitle}>
            <h2 className="product-group-title">{group.groupTitle}</h2>
            <div className="product-grid-wrapper">
              <button
                className={`product-grid-arrow product-grid-arrow--left${state.atStart ? " is-faded" : ""}`}
                type="button"
                onClick={() => scroll(group.id, "left")}
                aria-label="Cuộn trái"
              >
                <FaArrowLeft />
              </button>
              <div
                className="product-grid"
                ref={(el) => {
                  gridRefs.current[group.id] = el;
                }}
                onScroll={(e) => updateScrollState(group.id, e.currentTarget)}
              >
                {group.products
                  .sort((a, b) => b.id.localeCompare(a.id))
                  .map((product) => (
                    <div className="product-card" key={product.id}>
                      <div className="product-card-image-wrap">
                        <img
                          src={toPublicPath(product.image)}
                          alt={product.alt}
                        />
                      </div>
                      <div className="product-card-content">
                        <h3 className="product-card-title">{product.name}</h3>
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
                            {product.status ?? "Còn hàng"}
                          </span>
                        </p>
                        <p className="product-card-meta">
                          <span className="product-card-meta-label">
                            Liên hệ:
                          </span>{" "}
                          {product.contact ?? "Liên hệ để biết giá"}
                        </p>
                        <button className="product-card-btn" type="button">
                          Xem chi tiết
                        </button>
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
            <button className="product-group-btn" type="button">
              <span className="product-group-btn-label">Xem tất cả</span>
              <span className="product-group-btn-icon" aria-hidden="true">
                <FaArrowRight />
              </span>
            </button>
          </article>
        );
      })}
    </section>
  );
}

export default MainProduct;
