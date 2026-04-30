import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  useBrandContext,
  type BrandPayload,
} from "../../Context/BrandContext/BrandContext.tsx";
import {
  useProductContext,
  type ProductItem,
  type ProductPayload,
} from "../../Context/ProductContext/ProductContext.tsx";
import "./Products.css";

const PRODUCT_STATUS_OPTIONS = ["Còn hàng", "Đã bán", "Đặt hàng"] as const;
const BADGE_OPTIONS = ["", "Hot"] as const;
const PRODUCT_NAME_PRESETS = [
  "Máy Xúc",
  "Máy Cẩu",
  "Máy Cân Cừ",
  "Máy Xúc Lật",
  "Máy Phá Đá",
] as const;

function isPresetName(value: string): boolean {
  return (PRODUCT_NAME_PRESETS as readonly string[]).includes(value);
}

const OWNER_PRESET_OPTIONS = [
  { id: "DS", label: "Máy Công Trình Đài Soạn (DS)" },
  { id: "TV", label: "Máy Công Trình Thảo Vân (TV)" },
] as const;

function isPresetOwner(value: string): boolean {
  return OWNER_PRESET_OPTIONS.some((item) => item.id === value);
}

function createSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildProductLink(name: string): string {
  return `https://maycongtrinhnhapkhau.com.vn/product/${createSlug(name)}`;
}

const defaultBrandForm: BrandPayload = {
  name: "",
  brand: "",
  is_active: 1,
};

const defaultProductForm: ProductPayload = {
  brand_id: 0,
  name: "Máy Xúc",
  link: "",
  owner: "DS",
  model: "",
  date: String(new Date().getFullYear()),
  contact: "",
  status: "Còn hàng",
  badge: "",
  image: "",
  is_active: 1,
};

function Products() {
  const {
    brandItems,
    isLoadingBrands,
    brandsMessage,
    refreshBrandData,
    createBrandItem,
    updateBrandItem,
    deleteBrandItem,
    brandModels,
    loadBrandModels,
    addBrandModel,
    deleteBrandModel,
  } = useBrandContext();
  const {
    productItems,
    isLoadingProducts,
    productsMessage,
    refreshProductData,
    createProductItem,
    updateProductItem,
    deleteProductItem,
  } = useProductContext();

  const [brandForm, setBrandForm] = useState<BrandPayload>(defaultBrandForm);
  const [productForm, setProductForm] =
    useState<ProductPayload>(defaultProductForm);
  const [customOwnerInput, setCustomOwnerInput] = useState("");
  const [customNameInput, setCustomNameInput] = useState("");
  const [newModelInput, setNewModelInput] = useState("");
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState<number | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState<"brand" | "product">(
    "brand",
  );
  const [createdProduct, setCreatedProduct] = useState<ProductItem | null>(
    null,
  );

  const activeBrands = useMemo(
    () => brandItems.filter((item) => item.is_active === 1),
    [brandItems],
  );

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - 2000 + 1 }, (_, index) =>
      String(currentYear - index),
    );
  }, []);

  useEffect(() => {
    if (productForm.brand_id > 0) {
      void loadBrandModels(productForm.brand_id);
    }
  }, [productForm.brand_id]);

  useEffect(() => {
    if (productForm.brand_id > 0) {
      return;
    }

    const firstBrand = activeBrands[0] ?? brandItems[0];
    if (firstBrand) {
      setProductForm((prev) => ({ ...prev, brand_id: firstBrand.id }));
    }
  }, [activeBrands, brandItems, productForm.brand_id]);

  function getBrandName(brandId: number): string {
    const brand = brandItems.find((item) => item.id === brandId);
    return brand ? brand.name : "Không xác định";
  }

  function getBrandCode(brandId: number): string {
    const brand = brandItems.find((item) => item.id === brandId);
    return brand ? brand.brand : "-";
  }

  function handleStartEditBrand(id: number) {
    const target = brandItems.find((item) => item.id === id);
    if (!target) return;

    setActiveSection("brand");
    setEditingBrandId(target.id);
    setBrandForm({
      name: target.name,
      brand: target.brand,
      is_active: target.is_active,
    });
  }

  function handleStartEditProduct(id: string) {
    const target = productItems.find((item) => item.id === id);
    if (!target) return;

    setActiveSection("product");
    setEditingProductId(target.id);
    const ownerValue = (target.owner || "").trim();
    const useCustomOwner = ownerValue !== "" && !isPresetOwner(ownerValue);
    const nameValue = (target.name || "").trim();
    const useCustomName = nameValue !== "" && !isPresetName(nameValue);

    setCustomOwnerInput(useCustomOwner ? ownerValue : "");
    setCustomNameInput(useCustomName ? nameValue : "");
    setNewModelInput("");
    setIsAddingModel(false);
    setProductForm({
      brand_id: target.brand_id,
      name: nameValue || "Máy Xúc",
      link: target.link,
      owner: ownerValue || "DS",
      model: target.model,
      date: target.date || String(new Date().getFullYear()),
      contact: target.contact,
      status: target.status || "Còn hàng",
      badge: target.badge,
      image: target.image,
      is_active: target.is_active,
    });
  }

  function resetBrandForm() {
    setEditingBrandId(null);
    setBrandForm(defaultBrandForm);
  }

  function resetProductForm() {
    setEditingProductId(null);
    setCustomOwnerInput("");
    setCustomNameInput("");
    setNewModelInput("");
    setIsAddingModel(false);
    setProductForm((prev) => ({
      ...defaultProductForm,
      brand_id: prev.brand_id,
    }));
  }

  async function handleSubmitBrand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!brandForm.name.trim() || !brandForm.brand.trim()) {
      setMessage("Vui lòng nhập tên nhãn hiệu và mã brand.");
      return;
    }

    setIsSubmitting(true);

    const result =
      editingBrandId === null
        ? await createBrandItem({
            name: brandForm.name.trim(),
            brand: brandForm.brand.trim(),
            is_active: brandForm.is_active,
          })
        : await updateBrandItem(editingBrandId, {
            name: brandForm.name.trim(),
            brand: brandForm.brand.trim(),
            is_active: brandForm.is_active,
          });

    if (!result.ok) {
      setMessage(result.message ?? "Thao tác nhãn hiệu thất bại.");
      setIsSubmitting(false);
      return;
    }

    setMessage(
      editingBrandId === null
        ? "Đã thêm nhãn hiệu mới."
        : `Đã cập nhật nhãn hiệu #${editingBrandId}.`,
    );
    resetBrandForm();
    setIsSubmitting(false);
  }

  async function handleDeleteBrand(id: number, name: string) {
    if (!window.confirm(`Xóa nhãn hiệu #${id} - ${name}?`)) {
      return;
    }

    setIsSubmitting(true);
    const result = await deleteBrandItem(id);

    if (!result.ok) {
      setMessage(result.message ?? "Không thể xóa nhãn hiệu.");
      setIsSubmitting(false);
      return;
    }

    if (editingBrandId === id) {
      resetBrandForm();
    }

    setMessage(`Đã xóa nhãn hiệu #${id}.`);
    setIsSubmitting(false);
  }

  async function handleToggleBrandActive(id: number) {
    const target = brandItems.find((item) => item.id === id);
    if (!target) {
      return;
    }

    setIsSubmitting(true);
    const result = await updateBrandItem(id, {
      name: target.name,
      brand: target.brand,
      is_active: target.is_active === 1 ? 0 : 1,
    });

    if (!result.ok) {
      setMessage(result.message ?? "Không thể cập nhật trạng thái nhãn hiệu.");
      setIsSubmitting(false);
      return;
    }

    setMessage(
      `Đã ${target.is_active === 1 ? "tắt" : "bật"} hiển thị nhãn hiệu #${id}.`,
    );
    setIsSubmitting(false);
  }

  async function handleSubmitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      productForm.brand_id <= 0 ||
      !productForm.name.trim() ||
      !productForm.owner.trim() ||
      !productForm.date.trim() ||
      !productForm.contact.trim() ||
      !productForm.status.trim()
    ) {
      setMessage(
        "Vui lòng nhập đủ: nhãn hiệu, tên, năm, liên hệ và trạng thái.",
      );
      return;
    }

    setIsSubmitting(true);

    const result =
      editingProductId === null
        ? await createProductItem({
            brand_id: productForm.brand_id,
            name: productForm.name.trim(),
            link: buildProductLink(productForm.name),
            owner: productForm.owner.trim(),
            model: productForm.model.trim(),
            date: productForm.date.trim(),
            contact: productForm.contact.trim(),
            status: productForm.status.trim(),
            badge: productForm.badge.trim(),
            image: productForm.image.trim(),
            is_active: productForm.is_active,
          })
        : await updateProductItem(editingProductId, {
            brand_id: productForm.brand_id,
            name: productForm.name.trim(),
            link: buildProductLink(productForm.name),
            owner: productForm.owner.trim(),
            model: productForm.model.trim(),
            date: productForm.date.trim(),
            contact: productForm.contact.trim(),
            status: productForm.status.trim(),
            badge: productForm.badge.trim(),
            image: productForm.image.trim(),
            is_active: productForm.is_active,
          });

    if (!result.ok) {
      setMessage(result.message ?? "Thao tác sản phẩm thất bại.");
      setIsSubmitting(false);
      return;
    }

    if (editingProductId === null && result.data) {
      setCreatedProduct(result.data);
    } else {
      setMessage(`Đã cập nhật sản phẩm #${editingProductId}.`);
    }
    resetProductForm();
    setIsSubmitting(false);
  }

  async function handleDeleteProduct(id: string, name: string) {
    if (!window.confirm(`Xóa sản phẩm #${id} - ${name}?`)) {
      return;
    }

    setIsSubmitting(true);
    const result = await deleteProductItem(id);

    if (!result.ok) {
      setMessage(result.message ?? "Không thể xóa sản phẩm.");
      setIsSubmitting(false);
      return;
    }

    if (editingProductId === id) {
      resetProductForm();
    }

    setMessage(`Đã xóa sản phẩm #${id}.`);
    setIsSubmitting(false);
  }

  async function handleToggleProductActive(id: string) {
    const target = productItems.find((item) => item.id === id);
    if (!target) {
      return;
    }

    setIsSubmitting(true);
    const result = await updateProductItem(id, {
      brand_id: target.brand_id,
      name: target.name,
      link: target.link,
      owner: target.owner,
      model: target.model,
      date: target.date,
      contact: target.contact,
      status: target.status,
      badge: target.badge,
      image: target.image,
      is_active: target.is_active === 1 ? 0 : 1,
    });

    if (!result.ok) {
      setMessage(result.message ?? "Không thể cập nhật trạng thái hiển thị.");
      setIsSubmitting(false);
      return;
    }

    setMessage(
      `Đã ${target.is_active === 1 ? "tắt" : "bật"} hiển thị sản phẩm #${id}.`,
    );
    setIsSubmitting(false);
  }

  async function handleDeleteSelectedModel() {
    const selectedModelName = productForm.model.trim();
    if (!selectedModelName) {
      setMessage("Vui lòng chọn model cần xóa.");
      return;
    }

    const targetModel = brandModels.find(
      (item) => item.model_name === selectedModelName,
    );
    if (!targetModel) {
      setMessage("Không tìm thấy model trong nhãn hiệu hiện tại.");
      return;
    }

    if (!window.confirm(`Xóa model \"${selectedModelName}\"?`)) {
      return;
    }

    setIsSubmitting(true);
    const result = await deleteBrandModel(targetModel.id);
    if (!result.ok) {
      setMessage(result.message ?? "Không thể xóa model.");
      setIsSubmitting(false);
      return;
    }

    await loadBrandModels(productForm.brand_id);
    setProductForm((prev) => ({ ...prev, model: "" }));
    setMessage(`Đã xóa model: ${selectedModelName}.`);
    setIsSubmitting(false);
  }

  const isRefreshing = isLoadingBrands || isLoadingProducts;

  async function handleRefreshAllData() {
    await Promise.all([refreshBrandData(), refreshProductData()]);
  }

  return (
    <section className="products-page">
      <header className="topbar">
        <div>
          <p className="eyebrow">Quản lý dữ liệu</p>
          <h1>Quản lý sản phẩm</h1>
          {brandsMessage ? (
            <p className="products-note">{brandsMessage}</p>
          ) : null}
          {productsMessage ? (
            <p className="products-note">{productsMessage}</p>
          ) : null}
        </div>
        <button
          type="button"
          className="ghost-btn"
          onClick={() => void handleRefreshAllData()}
          disabled={isRefreshing || isSubmitting}
        >
          {isRefreshing ? "Đang tải..." : "Tải lại dữ liệu"}
        </button>
      </header>

      <div className="mode-tabs" role="tablist" aria-label="Chế độ quản lý">
        <button
          type="button"
          className={`mode-tab ${activeSection === "brand" ? "is-active" : ""}`}
          role="tab"
          aria-selected={activeSection === "brand"}
          onClick={() => setActiveSection("brand")}
          disabled={isSubmitting}
        >
          Quản lý nhãn hiệu
        </button>
        <button
          type="button"
          className={`mode-tab ${activeSection === "product" ? "is-active" : ""}`}
          role="tab"
          aria-selected={activeSection === "product"}
          onClick={() => setActiveSection("product")}
          disabled={isSubmitting}
        >
          Quản lý sản phẩm
        </button>
      </div>

      {activeSection === "brand" ? (
        <article className="panel products-panel">
          <div className="panel-head">
            <h2>1. Quản lý nhãn hiệu</h2>
          </div>

          <form className="products-form" onSubmit={handleSubmitBrand}>
            <label className="field field-wide">
              <span>Tên nhãn hiệu</span>
              <input
                type="text"
                value={brandForm.name}
                onChange={(e) =>
                  setBrandForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ví dụ: Hitachi"
                disabled={isSubmitting}
              />
            </label>

            <label className="field field-wide">
              <span>Mã brand</span>
              <input
                type="text"
                value={brandForm.brand}
                onChange={(e) =>
                  setBrandForm((prev) => ({ ...prev, brand: e.target.value }))
                }
                placeholder="Ví dụ: hitachi"
                disabled={isSubmitting}
              />
            </label>

            <label className="field">
              <span>Trạng thái</span>
              <button
                type="button"
                className={`switch ${brandForm.is_active === 1 ? "is-on" : "is-off"}`}
                onClick={() =>
                  setBrandForm((prev) => ({
                    ...prev,
                    is_active: prev.is_active === 1 ? 0 : 1,
                  }))
                }
                aria-pressed={brandForm.is_active === 1}
                disabled={isSubmitting}
              >
                <span className="switch-thumb" />
                <span className="switch-label">
                  {brandForm.is_active === 1 ? "Đang bật" : "Đang tắt"}
                </span>
              </button>
            </label>

            <div className="products-actions field-wide">
              <button
                className="primary-btn"
                type="submit"
                disabled={isSubmitting}
              >
                {editingBrandId === null
                  ? "Thêm nhãn hiệu"
                  : "Cập nhật nhãn hiệu"}
              </button>
              {editingBrandId !== null ? (
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={resetBrandForm}
                  disabled={isSubmitting}
                >
                  Hủy sửa
                </button>
              ) : null}
            </div>
          </form>

          <div className="table-wrap">
            <table className="products-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nhãn hiệu</th>
                  <th>Mã brand</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {brandItems.map((item) => (
                  <tr key={item.id}>
                    <td>#{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.brand}</td>
                    <td>{item.is_active === 1 ? "Bật" : "Tắt"}</td>
                    <td className="products-row-actions">
                      <button
                        type="button"
                        className="row-action-btn"
                        onClick={() => void handleToggleBrandActive(item.id)}
                        disabled={isSubmitting}
                      >
                        {item.is_active === 1 ? "Tắt hiển thị" : "Bật hiển thị"}
                      </button>
                      <button
                        type="button"
                        className="row-action-btn"
                        onClick={() => handleStartEditBrand(item.id)}
                        disabled={isSubmitting}
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        className="row-action-btn row-action-btn--danger"
                        onClick={() =>
                          void handleDeleteBrand(item.id, item.name)
                        }
                        disabled={isSubmitting}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}

      {activeSection === "product" ? (
        <article className="panel products-panel">
          <div className="panel-head">
            <h2>2. Quản lý sản phẩm theo nhãn hiệu</h2>
          </div>

          <form className="products-form" onSubmit={handleSubmitProduct}>
            <label className="field">
              <span>Nhãn hiệu</span>
              <select
                value={productForm.brand_id}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    brand_id: Number(e.target.value) || 0,
                  }))
                }
                disabled={isSubmitting || brandItems.length === 0}
              >
                {brandItems.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field field-wide">
              <span>Tên sản phẩm</span>
              <select
                value={
                  isPresetName(productForm.name)
                    ? productForm.name
                    : "__CUSTOM__"
                }
                onChange={(e) => {
                  const next = e.target.value;
                  if (next === "__CUSTOM__") {
                    setProductForm((prev) => ({
                      ...prev,
                      name: customNameInput.trim(),
                    }));
                    return;
                  }
                  setCustomNameInput("");
                  setProductForm((prev) => ({ ...prev, name: next }));
                }}
                disabled={isSubmitting}
              >
                {PRODUCT_NAME_PRESETS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
                <option value="__CUSTOM__">Thêm máy...</option>
              </select>
            </label>

            {!isPresetName(productForm.name) ? (
              <label className="field field-wide">
                <span>Tên máy tùy chỉnh</span>
                <input
                  type="text"
                  value={customNameInput}
                  onChange={(e) => {
                    setCustomNameInput(e.target.value);
                    setProductForm((prev) => ({
                      ...prev,
                      name: e.target.value.trim(),
                    }));
                  }}
                  placeholder="Ví dụ: Máy Khoan"
                  disabled={isSubmitting}
                />
              </label>
            ) : null}

            <label className="field field-wide">
              <span>Owner</span>
              <select
                value={
                  isPresetOwner(productForm.owner)
                    ? productForm.owner
                    : "__CUSTOM__"
                }
                onChange={(e) => {
                  const nextValue = e.target.value;
                  if (nextValue === "__CUSTOM__") {
                    setProductForm((prev) => ({
                      ...prev,
                      owner: customOwnerInput.trim(),
                    }));
                    return;
                  }

                  setCustomOwnerInput("");
                  setProductForm((prev) => ({ ...prev, owner: nextValue }));
                }}
                disabled={isSubmitting}
              >
                {OWNER_PRESET_OPTIONS.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.label}
                  </option>
                ))}
                <option value="__CUSTOM__">Thêm lựa chọn mới</option>
              </select>
            </label>

            {!isPresetOwner(productForm.owner) ? (
              <label className="field field-wide">
                <span>Owner tùy chỉnh</span>
                <input
                  type="text"
                  value={customOwnerInput}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setCustomOwnerInput(nextValue);
                    setProductForm((prev) => ({
                      ...prev,
                      owner: nextValue.trim(),
                    }));
                  }}
                  placeholder="Ví dụ: Máy Công Trình ABC (id AB)"
                  disabled={isSubmitting}
                />
              </label>
            ) : null}

            <label className="field field-wide">
              <span>Model</span>
              <div
                style={{ display: "flex", gap: "6px", alignItems: "center" }}
              >
                <select
                  value={productForm.model}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      model: e.target.value,
                    }))
                  }
                  disabled={isSubmitting}
                  style={{ flex: 1 }}
                >
                  <option value="">-- Chọn model --</option>
                  {brandModels.map((m) => (
                    <option key={m.id} value={m.model_name}>
                      {m.model_name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setIsAddingModel((v) => !v)}
                  disabled={isSubmitting || productForm.brand_id <= 0}
                  title="Thêm model mới cho nhãn hiệu này"
                >
                  + Thêm Model
                </button>
                <button
                  type="button"
                  className="row-action-btn row-action-btn--danger"
                  onClick={() => void handleDeleteSelectedModel()}
                  disabled={isSubmitting || !productForm.model.trim()}
                  title="Xóa model đang chọn của nhãn hiệu này"
                >
                  Xóa Model
                </button>
              </div>
            </label>

            {isAddingModel ? (
              <div
                className="field field-wide"
                style={{ display: "flex", gap: "6px" }}
              >
                <input
                  type="text"
                  value={newModelInput}
                  onChange={(e) => setNewModelInput(e.target.value)}
                  placeholder="Tên model mới, ví dụ: ZX200"
                  disabled={isSubmitting}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="primary-btn"
                  disabled={isSubmitting || !newModelInput.trim()}
                  onClick={() => {
                    const name = newModelInput.trim();
                    if (!name) return;
                    setIsSubmitting(true);
                    void addBrandModel(productForm.brand_id, name).then(
                      (result) => {
                        if (result.ok) {
                          setProductForm((prev) => ({ ...prev, model: name }));
                          setNewModelInput("");
                          setIsAddingModel(false);
                        } else {
                          setMessage(result.message ?? "Thêm model thất bại.");
                        }
                        setIsSubmitting(false);
                      },
                    );
                  }}
                >
                  Lưu
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => {
                    setIsAddingModel(false);
                    setNewModelInput("");
                  }}
                  disabled={isSubmitting}
                >
                  Hủy
                </button>
              </div>
            ) : null}

            <label className="field">
              <span>Năm</span>
              <select
                value={productForm.date}
                onChange={(e) =>
                  setProductForm((prev) => ({ ...prev, date: e.target.value }))
                }
                disabled={isSubmitting}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Liên hệ</span>
              <input
                type="tel"
                value={productForm.contact}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    contact: e.target.value,
                  }))
                }
                placeholder="Ví dụ: 0901234567"
                disabled={isSubmitting}
              />
            </label>

            <label className="field">
              <span>Tình trạng</span>
              <select
                value={productForm.status}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
                disabled={isSubmitting}
              >
                {PRODUCT_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Badge</span>
              <select
                value={productForm.badge}
                onChange={(e) =>
                  setProductForm((prev) => ({ ...prev, badge: e.target.value }))
                }
                disabled={isSubmitting}
              >
                {BADGE_OPTIONS.map((badge) => (
                  <option key={badge || "none"} value={badge}>
                    {badge === "" ? "None" : badge}
                  </option>
                ))}
              </select>
            </label>

            <label className="field field-wide">
              <span>Image</span>
              <input
                type="url"
                value={productForm.image}
                onChange={(e) =>
                  setProductForm((prev) => ({ ...prev, image: e.target.value }))
                }
                placeholder="https://..."
                disabled={isSubmitting}
              />
            </label>

            <label className="field">
              <span>Hiển thị</span>
              <button
                type="button"
                className={`switch ${productForm.is_active === 1 ? "is-on" : "is-off"}`}
                onClick={() =>
                  setProductForm((prev) => ({
                    ...prev,
                    is_active: prev.is_active === 1 ? 0 : 1,
                  }))
                }
                aria-pressed={productForm.is_active === 1}
                disabled={isSubmitting}
              >
                <span className="switch-thumb" />
                <span className="switch-label">
                  {productForm.is_active === 1 ? "Đang bật" : "Đang tắt"}
                </span>
              </button>
            </label>

            <div className="products-actions field-wide">
              <button
                className="primary-btn"
                type="submit"
                disabled={isSubmitting || brandItems.length === 0}
              >
                {editingProductId === null
                  ? "Thêm sản phẩm"
                  : "Cập nhật sản phẩm"}
              </button>
              {editingProductId !== null ? (
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={resetProductForm}
                  disabled={isSubmitting}
                >
                  Hủy sửa
                </button>
              ) : null}
            </div>
          </form>

          <div className="table-wrap">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Mã SP</th>
                  <th>Nhãn hiệu</th>
                  <th>Tên sản phẩm</th>
                  <th>Owner</th>
                  <th>Model</th>
                  <th>Năm</th>
                  <th>Liên hệ</th>
                  <th>Tình trạng</th>
                  <th>Badge</th>
                  <th>Image</th>
                  <th>Hiển thị</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {productItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{getBrandCode(item.brand_id)}</td>
                    <td>{item.name}</td>
                    <td>{item.owner || "-"}</td>
                    <td>{item.model}</td>
                    <td>{item.date}</td>
                    <td>{item.contact}</td>
                    <td>{item.status}</td>
                    <td>{item.badge || "None"}</td>
                    <td>
                      {item.image ? (
                        <a href={item.image} target="_blank" rel="noreferrer">
                          Ảnh
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{item.is_active === 1 ? "Bật" : "Tắt"}</td>
                    <td className="products-row-actions">
                      <button
                        type="button"
                        className="row-action-btn"
                        onClick={() => void handleToggleProductActive(item.id)}
                        disabled={isSubmitting}
                      >
                        {item.is_active === 1 ? "Tắt hiển thị" : "Bật hiển thị"}
                      </button>
                      <button
                        type="button"
                        className="row-action-btn"
                        onClick={() => handleStartEditProduct(item.id)}
                        disabled={isSubmitting}
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        className="row-action-btn row-action-btn--danger"
                        onClick={() =>
                          void handleDeleteProduct(item.id, item.name)
                        }
                        disabled={isSubmitting}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}

      {message ? <p className="products-status">{message}</p> : null}

      {createdProduct ? (
        <div
          className="product-confirm-overlay"
          onClick={() => setCreatedProduct(null)}
        >
          <div
            className="product-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="product-confirm-title">
              ✅ Thêm sản phẩm thành công
            </h3>
            <table className="product-confirm-table">
              <tbody>
                <tr>
                  <th>Mã SP</th>
                  <td>{createdProduct.id}</td>
                </tr>
                <tr>
                  <th>Nhãn hiệu</th>
                  <td>{getBrandName(createdProduct.brand_id)}</td>
                </tr>
                <tr>
                  <th>Tên sản phẩm</th>
                  <td>{createdProduct.name}</td>
                </tr>
                <tr>
                  <th>Owner</th>
                  <td>{createdProduct.owner || "-"}</td>
                </tr>
                <tr>
                  <th>Model</th>
                  <td>{createdProduct.model || "-"}</td>
                </tr>
                <tr>
                  <th>Năm</th>
                  <td>{createdProduct.date || "-"}</td>
                </tr>
                <tr>
                  <th>Liên hệ</th>
                  <td>{createdProduct.contact || "-"}</td>
                </tr>
                <tr>
                  <th>Tình trạng</th>
                  <td>{createdProduct.status || "-"}</td>
                </tr>
                <tr>
                  <th>Badge</th>
                  <td>{createdProduct.badge || "None"}</td>
                </tr>
                <tr>
                  <th>Ảnh</th>
                  <td>
                    {createdProduct.image ? (
                      <a
                        href={createdProduct.image}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {createdProduct.image}
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
                <tr>
                  <th>Hiển thị</th>
                  <td>{createdProduct.is_active === 1 ? "Bật" : "Tắt"}</td>
                </tr>
                <tr>
                  <th>Link</th>
                  <td>
                    <a
                      href={createdProduct.link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {createdProduct.link}
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
            <button
              type="button"
              className="primary-btn product-confirm-close"
              onClick={() => setCreatedProduct(null)}
            >
              Đóng
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default Products;
