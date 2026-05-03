import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./ShowProduct.css";
import { useListAllProducts } from "../../context/ListAllProducts";
import { useMenuBrand } from "../../context/MenuBrandContext";
import {
  toProductItem,
  getProductTitle,
  getProductImageSrc,
  getProductImageAlt,
  getProductModel,
} from "../../utils/productHelpers";
import { applySeo } from "../../utils/seo";

type ProductField = {
  label: string;
  value: string;
  isStatus?: boolean;
};

function ShowProduct() {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("productId")?.trim() ?? "";
  const brandIdParam = searchParams.get("brandId")?.trim().toUpperCase() ?? "";

  const [navOffset, setNavOffset] = useState(0);
  const [albumNotice, setAlbumNotice] = useState("");

  const {
    productItems: allProductItems,
    isLoading,
    error: loadError,
  } = useListAllProducts();
  const { productItems: brandItems } = useMenuBrand();

  useEffect(() => {
    function measure() {
      const nav = document.querySelector<HTMLElement>(".site-nav");
      setNavOffset(nav?.offsetHeight ?? 0);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const brandMap = useMemo(() => {
    const map = new Map<string, { title: string; slug: string }>();

    brandItems.forEach((item) => {
      const brandKey = item.brand.trim().toUpperCase();
      const slug =
        item.link.replace(/\/$/, "").split("/").pop()?.toLowerCase() ??
        brandKey.toLowerCase();

      map.set(brandKey, {
        title: item.name,
        slug,
      });
    });

    return map;
  }, [brandItems]);

  const product = useMemo(() => {
    if (!productId) return null;

    return (
      allProductItems
        .map(toProductItem)
        .find((item) => item.id === productId) ?? null
    );
  }, [allProductItems, productId]);

  const brandId = product?.brandId || brandIdParam;
  const brandInfo = brandMap.get(brandId);

  const brandTitle = brandInfo?.title ?? brandId;
  const brandSlug = brandInfo?.slug ?? brandId.toLowerCase();
  const backToBrandLink = brandId
    ? `/product/${brandSlug}?brandId=${encodeURIComponent(brandId)}`
    : "/product";

  const fields = useMemo<ProductField[]>(() => {
    if (!product) return [];

    const model = getProductModel(product);

    return [
      { label: "Thương hiệu", value: product.brandId },
      { label: "Kiểu máy", value: product.name ?? "" },
      { label: "Model", value: model },
      { label: "Năm / Đời", value: product.date ?? "" },
      { label: "Xuất xứ", value: product.origin ?? "" },
      { label: "VAT", value: product.vat ?? "" },
      { label: "Giá", value: product.price ?? "" },
      { label: "Liên hệ", value: product.contact ?? "" },
      { label: "Trạng thái", value: product.status ?? "", isStatus: true },
    ].filter((item) => item.value.trim() !== "");
  }, [product, brandTitle]);

  function handleOpenAlbum() {
    setAlbumNotice("Tính năng album ảnh sản phẩm đang được cập nhật.");
  }

  useEffect(() => {
    if (!product) return;

    const productTitle = getProductTitle(product);
    const model = getProductModel(product);
    const detailParts = [
      product.origin ? `xuất xứ ${product.origin}` : "",
      product.status ? `tình trạng ${product.status}` : "",
      product.date ? `đời ${product.date}` : "",
    ].filter(Boolean);

    applySeo({
      title: `${productTitle} - Chi tiết sản phẩm`,
      description: `Chi tiết ${model} ${brandTitle ? `thuộc thương hiệu ${brandTitle}, ` : ""}${detailParts.join(", ")}. Liên hệ để nhận tư vấn và báo giá nhanh.`,
      image: getProductImageSrc(product.image),
    });
  }, [product, brandTitle]);

  return (
    <section className="spd-page" style={{ paddingTop: navOffset + 24 }}>
      <div className="spd-wrap">
        <div className="spd-head">
          <Link className="spd-back" to={backToBrandLink}>
            Quay lại danh sách
          </Link>
          <h1 className="spd-title">Chi tiết sản phẩm</h1>
        </div>

        {isLoading && (
          <p className="spd-state" role="status" aria-busy="true">
            Đang tải thông tin sản phẩm...
          </p>
        )}

        {!isLoading && loadError && (
          <p className="spd-state is-error" role="alert">
            Không thể tải dữ liệu sản phẩm.
          </p>
        )}

        {!isLoading && !loadError && !productId && (
          <p className="spd-state is-error" role="alert">
            Thiếu mã sản phẩm để xem chi tiết.
          </p>
        )}

        {!isLoading && !loadError && productId && !product && (
          <p className="spd-state is-error" role="alert">
            Không tìm thấy sản phẩm có mã {productId}.
          </p>
        )}

        {!isLoading && !loadError && product && (
          <article className="spd-card">
            <div className="spd-image-wrap">
              {product.badge === "Hot" && (
                <span className="spd-badge">HOT</span>
              )}
              <button
                type="button"
                className="spd-album-btn"
                onClick={handleOpenAlbum}
                aria-label="Xem album ảnh sản phẩm"
              >
                Xem album ảnh
              </button>
              <img
                src={getProductImageSrc(product.image)}
                alt={getProductImageAlt(product, brandTitle || product.brandId)}
                loading="eager"
                decoding="async"
              />
              {albumNotice && (
                <p className="spd-album-note" role="status" aria-live="polite">
                  {albumNotice}
                </p>
              )}
            </div>

            <div className="spd-info">
              <h2 className="spd-name">
                {getProductTitle(product).toUpperCase()} ({product.id})
              </h2>

              <dl className="spd-meta">
                {fields.map((field) => {
                  const isSold =
                    field.isStatus &&
                    field.value.trim().toLowerCase() === "đã bán";

                  return (
                    <div className="spd-meta__row" key={field.label}>
                      <dt>{field.label}</dt>
                      <dd
                        className={
                          field.isStatus
                            ? isSold
                              ? "is-sold"
                              : "is-available"
                            : undefined
                        }
                      >
                        {field.value}
                      </dd>
                    </div>
                  );
                })}
              </dl>

              <div className="spd-actions">
                <Link
                  className="spd-btn"
                  to={`/contact?product=${encodeURIComponent(getProductTitle(product))}`}
                >
                  Nhận tư vấn ngay
                </Link>
                <Link className="spd-btn is-ghost" to="/product">
                  Xem thêm sản phẩm
                </Link>
              </div>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}

export default ShowProduct;
