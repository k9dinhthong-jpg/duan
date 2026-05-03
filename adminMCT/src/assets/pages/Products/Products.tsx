import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { useNavigate, useParams } from "react-router-dom";
import {
  useBrandContext,
  type BrandPayload,
} from "../../Context/BrandContext/BrandContext.tsx";
import {
  useProductContext,
  type ProductItem,
  type ProductPayload,
} from "../../Context/ProductContext/ProductContext.tsx";
import {
  buildSupabasePublicUrl,
  supabaseClient,
  SUPABASE_BUCKET,
} from "../../lib/supabaseClient.ts";
import "./Products.css";

const PRODUCT_STATUS_OPTIONS = [
  "Còn hàng",
  "Đặt hàng",
  "Đang về hàng",
  "Đã bán",
] as const;
const BADGE_OPTIONS = ["", "Hot", "New"] as const;
const ORIGIN_OPTIONS = ["China", "Japan", "Singgapore"] as const;
const PRODUCT_PAGE_SIZE = 10;
const PRODUCT_NAME_PRESETS = [
  "Máy Xúc",
  "Máy Cẩu",
  "Máy Cân Cừ",
  "Máy Xúc Lật",
  "Máy Phá Đá",
] as const;

function getStatusPillClass(status: string): string {
  if (status === "Còn hàng") return "status-pill status-pill--available";
  if (status === "Đặt hàng") return "status-pill status-pill--order";
  return "status-pill status-pill--sold";
}

function isPresetName(value: string): boolean {
  return (PRODUCT_NAME_PRESETS as readonly string[]).includes(value);
}

const OWNER_PRESET_OPTIONS = [
  { id: "DS", label: "Đài Soạn (DS)" },
  { id: "TV", label: "Thảo Vân (TV)" },
] as const;

function isPresetOwner(value: string): boolean {
  return OWNER_PRESET_OPTIONS.some((item) => item.id === value);
}

function normalizeCompareValue(value: string): string {
  return value.trim().toLowerCase();
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

function extractOwnerCode(owner: string): string {
  const parenMatch = /\(([^)]+)\)/.exec(owner || "");
  if (parenMatch) {
    return parenMatch[1].trim().toUpperCase().replace(/\s+/g, "");
  }

  const upper = (owner || "").replace(/[^A-Za-z]/g, "").toUpperCase();
  return upper.slice(0, 4) || "XX";
}

function buildProductLink(name: string): string {
  return `https://maycongtrinhnhapkhau.com.vn/product/${createSlug(name)}`;
}

function buildProductImageUrl(productCode: string): string {
  const fromConfig = buildSupabasePublicUrl(`${productCode}/title.jpg`);
  if (fromConfig) {
    return fromConfig;
  }

  return `https://ehsccjufbaehvfovguvm.supabase.co/storage/v1/object/public/${SUPABASE_BUCKET}/${productCode}/title.jpg`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeStorageFolder(value: string): string {
  return value.trim().replace(/^\/+/, "").replace(/\/+$/, "");
}

function createImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Không tải được ảnh để crop."));
    image.src = src;
  });
}

async function cropImageToJpegBlob(
  imageSrc: string,
  cropArea: Area,
): Promise<Blob> {
  const image = await createImageElement(imageSrc);

  const width = Math.max(1, Math.round(cropArea.width));
  const height = Math.max(1, Math.round(cropArea.height));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Trình duyệt không hỗ trợ xử lý canvas.");
  }

  const sx = clamp(Math.round(cropArea.x), 0, Math.max(0, image.width - 1));
  const sy = clamp(Math.round(cropArea.y), 0, Math.max(0, image.height - 1));
  const sw = clamp(Math.round(cropArea.width), 1, image.width - sx);
  const sh = clamp(Math.round(cropArea.height), 1, image.height - sy);

  context.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error("Không tạo được ảnh sau khi crop."));
      },
      "image/jpeg",
      0.92,
    );
  });
}

function toLocalIsoDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const defaultBrandForm: BrandPayload = {
  name: "",
  brand: "",
  is_active: 1,
};

const defaultProductForm: ProductPayload = {
  brand_id: "",
  name: "",
  link: "",
  owner: "",
  model: "",
  date: "",
  contact: "0966121686",
  note: "",
  vat: "Liên Hệ",
  origin: "",
  status: "",
  badge: "",
  image: "",
  link_image_product: "",
  is_active: 1,
};

function Products() {
  const navigate = useNavigate();
  const { id: routeProductId } = useParams<{ id?: string }>();
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
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "brand" | "product-form" | "product-list"
  >("brand");
  const [productPage, setProductPage] = useState(1);
  const [filterBrand, setFilterBrand] = useState("");
  const [filterOwner, setFilterOwner] = useState("");
  const [filterModel, setFilterModel] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("");
  const [filterBadge, setFilterBadge] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPostedDate, setFilterPostedDate] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [createdProduct, setCreatedProduct] = useState<ProductItem | null>(
    null,
  );
  const [storageFolder, setStorageFolder] = useState("");
  const [selectedImageSource, setSelectedImageSource] = useState("");
  const [selectedImageName, setSelectedImageName] = useState("");
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState(1);
  const [cropAreaPixels, setCropAreaPixels] = useState<Area | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const routeProduct = useMemo(
    () =>
      routeProductId
        ? (productItems.find((item) => item.id === routeProductId) ?? null)
        : null,
    [productItems, routeProductId],
  );

  const selectedBrandId = useMemo(() => {
    const selectedBrandCode = productForm.brand_id.trim();
    if (!selectedBrandCode) {
      return 0;
    }

    const byCode = brandItems.find((item) => item.brand === selectedBrandCode);
    if (byCode) {
      return byCode.id;
    }

    const legacyId = Number(selectedBrandCode);
    if (!Number.isFinite(legacyId) || legacyId <= 0) {
      return 0;
    }

    const byLegacyId = brandItems.find((item) => item.id === legacyId);
    return byLegacyId?.id ?? 0;
  }, [brandItems, productForm.brand_id]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - 2000 + 1 }, (_, index) =>
      String(currentYear - index),
    );
  }, []);

  const nextProductCode = useMemo(() => {
    const ownerCode = extractOwnerCode(productForm.owner);
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const prefix = `${ownerCode}${dd}${mm}`;
    const count = productItems.filter((item) =>
      item.id.startsWith(prefix),
    ).length;
    const sequence = String(count + 1).padStart(2, "0");
    return `${prefix}${sequence}`;
  }, [productForm.owner, productItems]);

  const productCodeDisplay =
    editingProductId === null ? nextProductCode : editingProductId;
  const selectedNameValue = productForm.name.trim()
    ? isPresetName(productForm.name)
      ? productForm.name
      : "__CUSTOM__"
    : "";
  const selectedOwnerValue = productForm.owner.trim()
    ? isPresetOwner(productForm.owner)
      ? productForm.owner
      : "__CUSTOM__"
    : "";
  const productImageDisplay = useMemo(
    () =>
      productForm.image.trim() ||
      buildProductImageUrl(editingProductId ?? productCodeDisplay),
    [editingProductId, productCodeDisplay, productForm.image],
  );

  useEffect(() => {
    setStorageFolder(editingProductId ?? productCodeDisplay);
  }, [editingProductId, productCodeDisplay]);

  useEffect(() => {
    if (selectedBrandId > 0) {
      void loadBrandModels(selectedBrandId);
      return;
    }

    setProductForm((prev) => {
      if (!prev.model) {
        return prev;
      }
      return { ...prev, model: "" };
    });
  }, [selectedBrandId]);

  const sortedProductItems = useMemo(() => {
    const cloned = [...productItems];
    cloned.sort((a, b) => {
      const aTime = Date.parse(a.created_at || "");
      const bTime = Date.parse(b.created_at || "");
      if (Number.isNaN(aTime) && Number.isNaN(bTime)) {
        return b.id.localeCompare(a.id);
      }
      if (Number.isNaN(aTime)) return 1;
      if (Number.isNaN(bTime)) return -1;
      return bTime - aTime;
    });
    return cloned;
  }, [productItems]);

  const filterBrandOptions = useMemo(() => {
    return Array.from(
      new Set(
        sortedProductItems
          .map((item) => getBrandCode(item.brand_id))
          .filter((value) => value.trim() !== ""),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [sortedProductItems, brandItems]);

  const filterOwnerOptions = useMemo(() => {
    return Array.from(
      new Set(
        sortedProductItems
          .map((item) => (item.owner || "").trim())
          .filter((value) => value !== ""),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [sortedProductItems]);

  const filterModelOptions = useMemo(() => {
    return Array.from(
      new Set(
        sortedProductItems
          .map((item) => (item.model || "").trim())
          .filter((value) => value !== ""),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [sortedProductItems]);

  const filterOriginOptions = useMemo(() => {
    return Array.from(
      new Set(
        sortedProductItems
          .map((item) => (item.origin || "").trim())
          .filter((value) => value !== ""),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [sortedProductItems]);

  const filterBadgeOptions = useMemo(() => {
    return Array.from(
      new Set(
        sortedProductItems
          .map((item) => (item.badge || "").trim())
          .filter((value) => value !== ""),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [sortedProductItems]);

  const filterStatusOptions = useMemo(() => {
    return Array.from(
      new Set(
        sortedProductItems
          .map((item) => (item.status || "").trim())
          .filter((value) => value !== ""),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [sortedProductItems]);

  const filterYearOptions = useMemo(() => {
    return Array.from(
      new Set(
        sortedProductItems
          .map((item) => (item.date || "").trim())
          .filter((value) => value !== ""),
      ),
    ).sort((a, b) => Number(b) - Number(a));
  }, [sortedProductItems]);

  const filteredProductItems = useMemo(() => {
    return sortedProductItems.filter((item) => {
      const brandCode = getBrandCode(item.brand_id);
      const owner = (item.owner || "").trim();
      const model = (item.model || "").trim();
      const origin = (item.origin || "").trim();
      const badge = (item.badge || "").trim();
      const status = (item.status || "").trim();
      const year = (item.date || "").trim();
      const postedDate = toLocalIsoDate(item.created_at || "");

      if (filterBrand && brandCode !== filterBrand) return false;
      if (filterOwner && owner !== filterOwner) return false;
      if (filterModel && model !== filterModel) return false;
      if (filterOrigin && origin !== filterOrigin) return false;
      if (filterStatus && status !== filterStatus) return false;
      if (filterYear && year !== filterYear) return false;
      if (filterPostedDate && postedDate !== filterPostedDate) return false;

      if (filterBadge === "__NONE__") {
        if (badge !== "") return false;
      } else if (filterBadge && badge !== filterBadge) {
        return false;
      }

      return true;
    });
  }, [
    sortedProductItems,
    filterBrand,
    filterOwner,
    filterModel,
    filterOrigin,
    filterBadge,
    filterStatus,
    filterPostedDate,
    filterYear,
    brandItems,
  ]);

  const totalProductPages = Math.max(
    1,
    Math.ceil(filteredProductItems.length / PRODUCT_PAGE_SIZE),
  );

  const pagedProductItems = useMemo(() => {
    const start = (productPage - 1) * PRODUCT_PAGE_SIZE;
    return filteredProductItems.slice(start, start + PRODUCT_PAGE_SIZE);
  }, [productPage, filteredProductItems]);

  useEffect(() => {
    setProductPage(1);
  }, [
    filterBrand,
    filterOwner,
    filterModel,
    filterOrigin,
    filterBadge,
    filterStatus,
    filterPostedDate,
    filterYear,
  ]);

  useEffect(() => {
    if (productPage > totalProductPages) {
      setProductPage(totalProductPages);
    }
  }, [productPage, totalProductPages]);

  function findBrandByProductBrand(brandValue: string) {
    const normalized = String(brandValue || "").trim();
    if (!normalized) {
      return undefined;
    }

    const byCode = brandItems.find((item) => item.brand === normalized);
    if (byCode) {
      return byCode;
    }

    const legacyId = Number(normalized);
    if (!Number.isFinite(legacyId) || legacyId <= 0) {
      return undefined;
    }

    return brandItems.find((item) => item.id === legacyId);
  }

  function getBrandName(brandValue: string): string {
    const brand = findBrandByProductBrand(brandValue);
    return brand ? brand.name : "Không xác định";
  }

  function resolveBrandCodeForForm(brandValue: string): string {
    const brand = findBrandByProductBrand(brandValue);
    if (brand) {
      return brand.brand;
    }

    return String(brandValue || "").trim();
  }

  function getBrandCode(brandValue: string): string {
    const brand = findBrandByProductBrand(brandValue);
    if (brand) {
      return brand.brand;
    }

    return brandValue.trim() || "-";
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

    setActiveSection("product-form");
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
      brand_id: resolveBrandCodeForForm(target.brand_id),
      name: nameValue,
      link: target.link,
      owner: ownerValue,
      model: target.model,
      date: target.date || "",
      contact: target.contact,
      note: target.note,
      vat: target.vat || "Liên Hệ",
      origin: target.origin || "",
      status: target.status || "",
      badge: target.badge,
      image: target.image,
      link_image_product: target.link_image_product,
      is_active: target.is_active,
    });
    setStorageFolder(target.id);
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
    setStorageFolder("");
    setSelectedImageSource("");
    setSelectedImageName("");
    setCropAreaPixels(null);
    setCropZoom(1);
    setCropPosition({ x: 0, y: 0 });
    setProductForm(defaultProductForm);
  }

  async function handleChooseImageForCrop(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage("Vui lòng chọn file ảnh hợp lệ.");
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Không đọc được file ảnh."));
      reader.readAsDataURL(file);
    }).catch(() => "");

    if (!dataUrl) {
      setMessage("Không đọc được file ảnh đã chọn.");
      return;
    }

    setSelectedImageSource(dataUrl);
    setSelectedImageName(file.name);
    setCropPosition({ x: 0, y: 0 });
    setCropZoom(1);
    setCropAreaPixels(null);
  }

  async function handleCropAndUploadImage() {
    const folder = normalizeStorageFolder(storageFolder || productCodeDisplay);
    if (!folder) {
      setMessage("Vui lòng nhập thư mục Supabase để lưu ảnh.");
      return;
    }

    if (!supabaseClient) {
      setMessage(
        "Thiếu cấu hình Supabase. Hãy thêm VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY trong file .env.",
      );
      return;
    }

    if (!selectedImageSource || !cropAreaPixels) {
      setMessage("Vui lòng chọn ảnh và crop trước khi upload.");
      return;
    }

    setIsUploadingImage(true);
    try {
      const croppedBlob = await cropImageToJpegBlob(
        selectedImageSource,
        cropAreaPixels,
      );
      const fileBaseName = "title";
      const uploadPath = `${folder}/${fileBaseName}.jpg`;

      const uploadResult = await supabaseClient.storage
        .from(SUPABASE_BUCKET)
        .upload(uploadPath, croppedBlob, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadResult.error) {
        setMessage(`Upload ảnh thất bại: ${uploadResult.error.message}`);
        setIsUploadingImage(false);
        return;
      }

      const uploadedPublicUrl =
        buildSupabasePublicUrl(uploadPath) || buildProductImageUrl(folder);

      setProductForm((prev) => ({
        ...prev,
        image: uploadedPublicUrl,
      }));
      setSelectedImageSource("");
      setSelectedImageName("");
      setCropAreaPixels(null);
      setMessage(
        `Đã crop và lưu ảnh "${fileBaseName}.jpg" vào thư mục "${folder}" trên Supabase.`,
      );
    } catch {
      setMessage("Crop hoặc upload ảnh thất bại. Vui lòng thử lại.");
    }

    setIsUploadingImage(false);
  }

  async function handleSubmitBrand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!brandForm.name.trim() || !brandForm.brand.trim()) {
      setFormError("Vui lòng nhập tên nhãn hiệu và mã brand.");
      return;
    }

    const normalizedBrandName = normalizeCompareValue(brandForm.name);
    const normalizedBrandCode = normalizeCompareValue(brandForm.brand);

    const duplicateBrandName = brandItems.some(
      (item) =>
        item.id !== editingBrandId &&
        normalizeCompareValue(item.name) === normalizedBrandName,
    );
    if (duplicateBrandName) {
      setFormError(
        "Tên thương hiệu đã tồn tại (không phân biệt hoa thường). Vui lòng nhập tên khác.",
      );
      return;
    }

    const duplicateBrandCode = brandItems.some(
      (item) =>
        item.id !== editingBrandId &&
        normalizeCompareValue(item.brand) === normalizedBrandCode,
    );
    if (duplicateBrandCode) {
      setFormError(
        "Mã thương hiệu đã tồn tại (không phân biệt hoa thường). Vui lòng nhập mã khác.",
      );
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
    setFormError("");

    {
      const missing: string[] = [];
      if (!productForm.brand_id.trim()) missing.push("Nhãn hiệu");
      if (!productForm.name.trim()) missing.push("Tên sản phẩm");
      if (!productForm.owner.trim()) missing.push("Đơn vị sở hữu");
      if (!productForm.model.trim()) missing.push("Dòng máy (Model)");
      if (!productForm.date.trim()) missing.push("Năm");
      if (!productForm.contact.trim()) missing.push("Liên hệ");
      if (!productForm.vat.trim()) missing.push("VAT");
      if (!productForm.origin.trim()) missing.push("Xuất xứ");
      if (!productForm.status.trim()) missing.push("Tình trạng");
      if (missing.length > 0) {
        setFormError(`Vui lòng nhập đầy đủ: ${missing.join(", ")}.`);
        return;
      }
    }

    if (editingProductId === null) {
      const normalizedName = normalizeCompareValue(productForm.name);
      const normalizedOwner = normalizeCompareValue(productForm.owner);

      if (!isPresetName(productForm.name)) {
        const nameExists = productItems.some(
          (item) => normalizeCompareValue(item.name) === normalizedName,
        );
        if (nameExists) {
          setFormError(
            "Tên sản phẩm đã tồn tại (không phân biệt hoa thường). Vui lòng chọn/nhập tên khác.",
          );
          return;
        }
      }

      if (!isPresetOwner(productForm.owner)) {
        const ownerExists = productItems.some(
          (item) => normalizeCompareValue(item.owner) === normalizedOwner,
        );
        if (ownerExists) {
          setFormError(
            "Đơn vị sở hữu đã tồn tại (không phân biệt hoa thường). Vui lòng chọn/nhập đơn vị khác.",
          );
          return;
        }
      }
    }

    setIsSubmitting(true);

    const productImage =
      productForm.image.trim() ||
      buildProductImageUrl(editingProductId ?? productCodeDisplay);

    const result =
      editingProductId === null
        ? await createProductItem({
            brand_id: productForm.brand_id.trim(),
            name: productForm.name.trim(),
            link: buildProductLink(productForm.name),
            owner: productForm.owner.trim(),
            model: productForm.model.trim(),
            date: productForm.date.trim(),
            contact: productForm.contact.trim(),
            note: productForm.note.trim(),
            vat: productForm.vat.trim(),
            origin: productForm.origin.trim(),
            status: productForm.status.trim(),
            badge: productForm.badge.trim(),
            image: productImage,
            link_image_product: productForm.link_image_product.trim(),
            is_active: productForm.is_active,
          })
        : await updateProductItem(editingProductId, {
            brand_id: productForm.brand_id.trim(),
            name: productForm.name.trim(),
            link: buildProductLink(productForm.name),
            owner: productForm.owner.trim(),
            model: productForm.model.trim(),
            date: productForm.date.trim(),
            contact: productForm.contact.trim(),
            note: productForm.note.trim(),
            vat: productForm.vat.trim(),
            origin: productForm.origin.trim(),
            status: productForm.status.trim(),
            badge: productForm.badge.trim(),
            image: productImage,
            link_image_product: productForm.link_image_product.trim(),
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
      note: target.note,
      vat: target.vat,
      origin: target.origin,
      status: target.status,
      badge: target.badge,
      image: target.image,
      link_image_product: target.link_image_product,
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

    if (selectedBrandId > 0) {
      await loadBrandModels(selectedBrandId);
    }
    setProductForm((prev) => ({ ...prev, model: "" }));
    setMessage(`Đã xóa model: ${selectedModelName}.`);
    setIsSubmitting(false);
  }

  const isRefreshing = isLoadingBrands || isLoadingProducts;

  async function handleRefreshAllData() {
    await Promise.all([refreshBrandData(), refreshProductData()]);
  }

  if (routeProductId) {
    return (
      <section className="products-page product-detail-page">
        <header className="topbar">
          <div>
            <p className="eyebrow">Chi tiết sản phẩm</p>
            <h1>
              {routeProduct ? routeProduct.name : "Không tìm thấy sản phẩm"}
            </h1>
            {routeProduct ? (
              <p className="products-note">
                Mã SP: {routeProduct.id} · Thương hiệu:{" "}
                {getBrandName(routeProduct.brand_id)}
              </p>
            ) : (
              <p className="products-note">
                Sản phẩm có thể đã bị xóa hoặc mã không còn hợp lệ.
              </p>
            )}
          </div>
          <div className="product-detail-head-actions">
            <button
              type="button"
              className="ghost-btn"
              onClick={() => navigate("/products")}
            >
              Quay lại danh sách
            </button>
            {routeProduct ? (
              <button
                type="button"
                className="primary-btn"
                onClick={() => {
                  handleStartEditProduct(routeProduct.id);
                  navigate("/products");
                }}
                disabled={isSubmitting}
              >
                Sửa sản phẩm
              </button>
            ) : null}
          </div>
        </header>

        {routeProduct ? (
          <div className="product-detail-layout">
            <article className="products-panel product-detail-hero">
              <div className="product-detail-image-wrap">
                {routeProduct.image ? (
                  <img
                    src={routeProduct.image}
                    alt={routeProduct.name}
                    className="product-detail-image"
                  />
                ) : (
                  <div className="product-detail-image product-detail-image--empty">
                    Chưa có ảnh title
                  </div>
                )}
              </div>
              <div className="product-detail-summary">
                <div className="product-detail-badges">
                  <span className={getStatusPillClass(routeProduct.status)}>
                    {routeProduct.status || "Chưa cập nhật"}
                  </span>
                  <span
                    className={
                      routeProduct.is_active === 1
                        ? "status-pill status-pill--available"
                        : "status-pill status-pill--sold"
                    }
                  >
                    {routeProduct.is_active === 1 ? "Đang hiển thị" : "Đã ẩn"}
                  </span>
                  {routeProduct.badge ? (
                    <span className="badge-tag">{routeProduct.badge}</span>
                  ) : null}
                </div>

                <div className="product-detail-title-block">
                  <h2>{routeProduct.name}</h2>
                  <p>
                    {getBrandName(routeProduct.brand_id)} (
                    {getBrandCode(routeProduct.brand_id)})
                  </p>
                </div>

                <dl className="product-detail-meta-grid">
                  <div>
                    <dt>Mã sản phẩm</dt>
                    <dd>{routeProduct.id}</dd>
                  </div>
                  <div>
                    <dt>Đơn vị sở hữu</dt>
                    <dd>{routeProduct.owner || "-"}</dd>
                  </div>
                  <div>
                    <dt>Dòng máy</dt>
                    <dd>{routeProduct.model || "-"}</dd>
                  </div>
                  <div>
                    <dt>Năm sản xuất</dt>
                    <dd>{routeProduct.date || "-"}</dd>
                  </div>
                  <div>
                    <dt>Xuất xứ</dt>
                    <dd>{routeProduct.origin || "-"}</dd>
                  </div>
                  <div>
                    <dt>Liên hệ</dt>
                    <dd>{routeProduct.contact || "-"}</dd>
                  </div>
                </dl>
              </div>
            </article>

            <div className="product-detail-grid">
              <article className="products-panel product-detail-card">
                <div className="panel-head">
                  <h2>Thông tin chính</h2>
                </div>
                <dl className="product-detail-fields">
                  <div>
                    <dt>VAT</dt>
                    <dd>{routeProduct.vat || "-"}</dd>
                  </div>
                  <div>
                    <dt>Ngày đăng</dt>
                    <dd>{routeProduct.created_at || "-"}</dd>
                  </div>
                  <div>
                    <dt>Link sản phẩm</dt>
                    <dd>
                      {routeProduct.link ? (
                        <a
                          href={routeProduct.link}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {routeProduct.link}
                        </a>
                      ) : (
                        "-"
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Ảnh title</dt>
                    <dd>
                      {routeProduct.image ? (
                        <a
                          href={routeProduct.image}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {routeProduct.image}
                        </a>
                      ) : (
                        "-"
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Link ảnh thực tế</dt>
                    <dd>
                      {routeProduct.link_image_product ? (
                        <a
                          href={routeProduct.link_image_product}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {routeProduct.link_image_product}
                        </a>
                      ) : (
                        "-"
                      )}
                    </dd>
                  </div>
                </dl>
              </article>

              <article className="products-panel product-detail-card">
                <div className="panel-head">
                  <h2>Ghi chú</h2>
                </div>
                <div className="product-detail-note">
                  {routeProduct.note
                    ? routeProduct.note
                    : "Chưa có ghi chú cho sản phẩm này."}
                </div>
              </article>
            </div>
          </div>
        ) : (
          <article className="products-panel product-detail-empty-state">
            <div className="panel-head">
              <h2>Không có dữ liệu</h2>
            </div>
            <p className="products-empty">
              Không tìm thấy sản phẩm theo mã trên URL.
            </p>
          </article>
        )}
      </section>
    );
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
          {isRefreshing ? "Đang tải..." : "Làm mới"}
        </button>
      </header>

      <div className="mode-tabs" role="tablist" aria-label="Phân khu quản lý">
        <button
          type="button"
          className={`mode-tab ${activeSection === "brand" ? "is-active" : ""}`}
          role="tab"
          aria-selected={activeSection === "brand"}
          onClick={() => setActiveSection("brand")}
          disabled={isSubmitting}
        >
          Thương hiệu
        </button>
        <button
          type="button"
          className={`mode-tab ${activeSection === "product-form" ? "is-active" : ""}`}
          role="tab"
          aria-selected={activeSection === "product-form"}
          onClick={() => setActiveSection("product-form")}
          disabled={isSubmitting}
        >
          Quản lý sản phẩm
        </button>
        <button
          type="button"
          className={`mode-tab ${activeSection === "product-list" ? "is-active" : ""}`}
          role="tab"
          aria-selected={activeSection === "product-list"}
          onClick={() => setActiveSection("product-list")}
          disabled={isSubmitting}
        >
          Danh sách sản phẩm
        </button>
      </div>

      {activeSection === "brand" ? (
        <article className="panel products-panel">
          <div className="panel-head">
            <h2>Quản lý thương hiệu</h2>
            <span className="panel-count">{brandItems.length} thương hiệu</span>
          </div>

          <form className="products-form" onSubmit={handleSubmitBrand}>
            <label className="field field-wide">
              <span>Tên thương hiệu</span>
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
              <span>Mã thương hiệu</span>
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

            {formError && activeSection === "brand" ? (
              <p className="form-error field-wide">{formError}</p>
            ) : null}
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
                  <th>Tên thương hiệu</th>
                  <th>Mã</th>
                  <th>Hiển thị</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {brandItems.map((item) => (
                  <tr key={item.id}>
                    <td className="col-id">#{item.id}</td>
                    <td className="col-name">{item.name}</td>
                    <td>{item.brand}</td>
                    <td>
                      <span
                        className={
                          item.is_active === 1
                            ? "status-pill status-pill--available"
                            : "status-pill status-pill--sold"
                        }
                      >
                        {item.is_active === 1 ? "Đang hiển thị" : "Đã ẩn"}
                      </span>
                    </td>
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

      {activeSection === "product-form" ? (
        <article className="panel products-panel">
          <div className="panel-head">
            <h2>Quản lý sản phẩm</h2>
            <span className="panel-count">{productItems.length} sản phẩm</span>
          </div>

          <form className="products-form" onSubmit={handleSubmitProduct}>
            <label className="field">
              <span>Mã sản phẩm</span>
              <input
                type="text"
                value={productCodeDisplay}
                readOnly
                disabled
                className="input-readonly-muted"
                title="Mã sản phẩm được tạo tự động theo quy tắc hệ thống"
              />
            </label>

            <label className="field">
              <span>Nhãn hiệu</span>
              <select
                value={productForm.brand_id}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    brand_id: e.target.value,
                    model: "",
                  }))
                }
                disabled={isSubmitting || brandItems.length === 0}
              >
                <option value="">Lựa chọn</option>
                {brandItems.map((brand) => (
                  <option key={brand.id} value={brand.brand}>
                    {brand.name} ({brand.brand})
                  </option>
                ))}
              </select>
            </label>

            <label className="field field-wide">
              <span>Tên sản phẩm</span>
              <select
                value={selectedNameValue}
                onChange={(e) => {
                  const next = e.target.value;
                  if (next === "") {
                    setCustomNameInput("");
                    setProductForm((prev) => ({ ...prev, name: "" }));
                    return;
                  }
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
                <option value="">Lựa chọn</option>
                {PRODUCT_NAME_PRESETS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
                <option value="__CUSTOM__">Thêm loại máy mới...</option>
              </select>
            </label>

            {productForm.name.trim() && !isPresetName(productForm.name) ? (
              <label className="field field-wide">
                <span>Tên loại máy</span>
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
              <span>Đơn vị sở hữu</span>
              <select
                value={selectedOwnerValue}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  if (nextValue === "") {
                    setCustomOwnerInput("");
                    setProductForm((prev) => ({ ...prev, owner: "" }));
                    return;
                  }
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
                <option value="">Lựa chọn</option>
                {OWNER_PRESET_OPTIONS.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.label}
                  </option>
                ))}
                <option value="__CUSTOM__">Đơn vị khác...</option>
              </select>
            </label>

            {productForm.owner.trim() && !isPresetOwner(productForm.owner) ? (
              <label className="field field-wide">
                <span>Tên đơn vị sở hữu</span>
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
                  placeholder="Ví dụ: Công ty Cơ khí ABC (mã AB)"
                  disabled={isSubmitting}
                />
              </label>
            ) : null}

            <label className="field field-wide">
              <span>Dòng máy (Model)</span>
              <div className="model-inline-row">
                <select
                  value={productForm.model}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      model: e.target.value,
                    }))
                  }
                  disabled={isSubmitting}
                >
                  <option value="">Lựa chọn</option>
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
                  disabled={isSubmitting || selectedBrandId <= 0}
                  title="Thêm dòng máy mới"
                >
                  + Thêm
                </button>
                <button
                  type="button"
                  className="row-action-btn row-action-btn--danger"
                  onClick={() => void handleDeleteSelectedModel()}
                  disabled={isSubmitting || !productForm.model.trim()}
                  title="Xóa dòng máy đang chọn"
                >
                  Xóa
                </button>
              </div>
            </label>

            {isAddingModel ? (
              <div className="field field-wide">
                <div className="model-add-row">
                  <input
                    type="text"
                    value={newModelInput}
                    onChange={(e) => setNewModelInput(e.target.value)}
                    placeholder="Nhập tên dòng máy mới, ví dụ: ZX200"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="primary-btn"
                    disabled={isSubmitting || !newModelInput.trim()}
                    onClick={() => {
                      const name = newModelInput.trim();
                      if (!name) return;

                      const normalizedName = normalizeCompareValue(name);
                      const duplicateModel = brandModels.some(
                        (item) =>
                          normalizeCompareValue(item.model_name) ===
                          normalizedName,
                      );
                      if (duplicateModel) {
                        setMessage(
                          "Model đã tồn tại (không phân biệt hoa thường). Vui lòng nhập model khác.",
                        );
                        return;
                      }

                      if (selectedBrandId <= 0) {
                        setMessage("Vui lòng chọn thương hiệu hợp lệ trước.");
                        return;
                      }
                      setIsSubmitting(true);
                      void addBrandModel(selectedBrandId, name).then(
                        (result) => {
                          if (result.ok) {
                            setProductForm((prev) => ({
                              ...prev,
                              model: name,
                            }));
                            setNewModelInput("");
                            setIsAddingModel(false);
                          } else {
                            setMessage(
                              result.message ?? "Thêm dòng máy thất bại.",
                            );
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
                <option value="">Lựa chọn</option>
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
              <span>VAT</span>
              <input
                type="text"
                value={productForm.vat}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    vat: e.target.value,
                  }))
                }
                placeholder="Liên Hệ"
                disabled={isSubmitting}
              />
            </label>

            <label className="field">
              <span>Xuất xứ</span>
              <select
                value={productForm.origin}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    origin: e.target.value,
                  }))
                }
                disabled={isSubmitting}
              >
                <option value="">Lựa chọn</option>
                {ORIGIN_OPTIONS.map((origin) => (
                  <option key={origin} value={origin}>
                    {origin}
                  </option>
                ))}
              </select>
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
                <option value="">Lựa chọn</option>
                {PRODUCT_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Nhãn nổi bật</span>
              <select
                value={productForm.badge}
                onChange={(e) =>
                  setProductForm((prev) => ({ ...prev, badge: e.target.value }))
                }
                disabled={isSubmitting}
              >
                <option value="">Lựa chọn</option>
                {BADGE_OPTIONS.map((badge) => (
                  <option key={badge || "none"} value={badge}>
                    {badge === "" ? "Không có" : badge}
                  </option>
                ))}
              </select>
            </label>

            <label className="field field-wide">
              <span>Ghi chú</span>
              <textarea
                value={productForm.note}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    note: e.target.value,
                  }))
                }
                placeholder="Ví dụ: Máy đẹp, sẵn kho, giấy tờ đầy đủ..."
                rows={3}
                disabled={isSubmitting}
              />
            </label>

            <label className="field field-wide">
              <span>Ảnh sản phẩm (URL)</span>
              <input
                type="url"
                value={productImageDisplay}
                readOnly
                disabled
                className="input-readonly-muted"
                title="Link ảnh được tạo tự động theo Mã SP"
              />
            </label>

            <div className="field field-wide">
              <span>Chọn ảnh từ máy tính + Crop + Lưu Supabase</span>
              <div className="image-upload-tools">
                <input
                  type="text"
                  value={storageFolder}
                  onChange={(e) => setStorageFolder(e.target.value)}
                  placeholder="Thư mục đã có trên Supabase, ví dụ: DS0205"
                  disabled={isSubmitting || isUploadingImage}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    void handleChooseImageForCrop(e);
                  }}
                  disabled={isSubmitting || isUploadingImage}
                />
              </div>
              <p className="field-note">
                Ảnh sau khi crop sẽ upload vào bucket {SUPABASE_BUCKET} theo thư
                mục bạn nhập, với tên mặc định là title.jpg.
              </p>
            </div>

            <label className="field field-wide">
              <span>Link ảnh sản phẩm thực tế</span>
              <input
                type="url"
                value={productForm.link_image_product}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    link_image_product: e.target.value,
                  }))
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

            {formError && activeSection === "product-form" ? (
              <p className="form-error field-wide">{formError}</p>
            ) : null}
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
        </article>
      ) : null}

      {activeSection === "product-list" ? (
        <article className="panel products-panel">
          <div className="panel-head">
            <h2>Danh sách sản phẩm</h2>
            <span className="panel-count">{productItems.length} sản phẩm</span>
          </div>

          <div className="products-list-filters">
            <label className="field">
              <span>Hãng</span>
              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="">Tất cả</option>
                {filterBrandOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Đơn vị sở hữu</span>
              <select
                value={filterOwner}
                onChange={(e) => setFilterOwner(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="">Tất cả</option>
                {filterOwnerOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Dòng máy</span>
              <select
                value={filterModel}
                onChange={(e) => setFilterModel(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="">Tất cả</option>
                {filterModelOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Xuất xứ</span>
              <select
                value={filterOrigin}
                onChange={(e) => setFilterOrigin(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="">Tất cả</option>
                {filterOriginOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Nhãn</span>
              <select
                value={filterBadge}
                onChange={(e) => setFilterBadge(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="">Tất cả</option>
                <option value="__NONE__">Không có</option>
                {filterBadgeOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Trạng thái</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="">Tất cả</option>
                {filterStatusOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Ngày đăng</span>
              <input
                type="date"
                value={filterPostedDate}
                onChange={(e) => setFilterPostedDate(e.target.value)}
                disabled={isSubmitting}
              />
            </label>

            <label className="field">
              <span>Năm</span>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="">Tất cả</option>
                {filterYearOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <div className="products-list-filters__actions">
              <button
                type="button"
                className="ghost-btn"
                onClick={() => {
                  setFilterBrand("");
                  setFilterOwner("");
                  setFilterModel("");
                  setFilterOrigin("");
                  setFilterBadge("");
                  setFilterStatus("");
                  setFilterPostedDate("");
                  setFilterYear("");
                }}
                disabled={isSubmitting}
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>

          <div className="table-wrap">
            <table className="products-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Mã SP</th>
                  <th>Thương hiệu</th>
                  <th>Tên sản phẩm</th>
                  <th>Ngày đăng</th>
                  <th>Đơn vị</th>
                  <th>Dòng máy</th>
                  <th>Xuất xứ</th>
                  <th>Tình trạng</th>
                  <th>Nhãn</th>
                  <th>Ảnh</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pagedProductItems.map((item, index) => (
                  <tr key={item.id}>
                    <td className="col-id">
                      {(productPage - 1) * PRODUCT_PAGE_SIZE + index + 1}
                    </td>
                    <td className="col-id">{item.id}</td>
                    <td>{getBrandCode(item.brand_id)}</td>
                    <td className="col-name">
                      <a
                        href={`/products/${item.id}`}
                        onClick={(event) => {
                          event.preventDefault();
                          navigate(`/products/${item.id}`);
                        }}
                      >
                        {item.name}
                      </a>
                    </td>
                    <td>{toLocalIsoDate(item.created_at || "") || "-"}</td>
                    <td>{item.owner || "-"}</td>
                    <td>{item.model || "-"}</td>
                    <td>{item.origin || "-"}</td>
                    <td>
                      <span className={getStatusPillClass(item.status)}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      {item.badge ? (
                        <span className="badge-tag">{item.badge}</span>
                      ) : (
                        <span
                          style={{
                            color: "var(--color-text-muted)",
                            fontSize: "12px",
                          }}
                        >
                          —
                        </span>
                      )}
                    </td>
                    <td>
                      {item.image ? (
                        <a href={item.image} target="_blank" rel="noreferrer">
                          Xem ảnh
                        </a>
                      ) : (
                        <span
                          style={{
                            color: "var(--color-text-muted)",
                            fontSize: "12px",
                          }}
                        >
                          —
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={
                          item.is_active === 1
                            ? "status-pill status-pill--available"
                            : "status-pill status-pill--sold"
                        }
                      >
                        {item.is_active === 1 ? "Hiển thị" : "Đã ẩn"}
                      </span>
                    </td>
                    <td className="products-row-actions">
                      <button
                        type="button"
                        className="row-action-btn"
                        onClick={() => navigate(`/products/${item.id}`)}
                        disabled={isSubmitting}
                      >
                        Xem chi tiết
                      </button>
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
                {pagedProductItems.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="products-empty">
                      Không có sản phẩm phù hợp bộ lọc.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="products-pagination">
            <button
              type="button"
              className="ghost-btn"
              onClick={() => setProductPage((prev) => Math.max(1, prev - 1))}
              disabled={productPage === 1 || isSubmitting}
            >
              Trang trước
            </button>
            <span className="products-pagination__info">
              Trang {productPage}/{totalProductPages} -{" "}
              {filteredProductItems.length} kết quả
            </span>
            <button
              type="button"
              className="ghost-btn"
              onClick={() =>
                setProductPage((prev) => Math.min(totalProductPages, prev + 1))
              }
              disabled={productPage === totalProductPages || isSubmitting}
            >
              Trang sau
            </button>
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
            <div className="product-confirm-head">
              <span className="product-confirm-icon">✅</span>
              <div>
                <h3 className="product-confirm-title">
                  Thêm sản phẩm thành công
                </h3>
                <p className="product-confirm-subtitle">
                  Sản phẩm đã được lưu vào hệ thống.
                </p>
              </div>
            </div>
            <div className="product-confirm-body">
              <table className="product-confirm-table">
                <tbody>
                  <tr>
                    <th>Mã SP</th>
                    <td>{createdProduct.id}</td>
                  </tr>
                  <tr>
                    <th>Thương hiệu</th>
                    <td>{getBrandName(createdProduct.brand_id)}</td>
                  </tr>
                  <tr>
                    <th>Tên sản phẩm</th>
                    <td>{createdProduct.name}</td>
                  </tr>
                  <tr>
                    <th>Đơn vị</th>
                    <td>{createdProduct.owner || "-"}</td>
                  </tr>
                  <tr>
                    <th>Dòng máy</th>
                    <td>{createdProduct.model || "-"}</td>
                  </tr>
                  <tr>
                    <th>Năm SX</th>
                    <td>{createdProduct.date || "-"}</td>
                  </tr>
                  <tr>
                    <th>Liên hệ</th>
                    <td>{createdProduct.contact || "-"}</td>
                  </tr>
                  <tr>
                    <th>Ghi chú</th>
                    <td>{createdProduct.note || "-"}</td>
                  </tr>
                  <tr>
                    <th>VAT</th>
                    <td>{createdProduct.vat || "-"}</td>
                  </tr>
                  <tr>
                    <th>Xuất xứ</th>
                    <td>{createdProduct.origin || "-"}</td>
                  </tr>
                  <tr>
                    <th>Tình trạng</th>
                    <td>{createdProduct.status || "-"}</td>
                  </tr>
                  <tr>
                    <th>Nhãn nổi bật</th>
                    <td>{createdProduct.badge || "Không có"}</td>
                  </tr>
                  <tr>
                    <th>Ảnh sản phẩm</th>
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
                    <th>Trạng thái</th>
                    <td>
                      {createdProduct.is_active === 1 ? "Hiển thị" : "Đã ẩn"}
                    </td>
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
            </div>
            <div className="product-confirm-footer">
              <button
                type="button"
                className="primary-btn"
                onClick={() => setCreatedProduct(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedImageSource ? (
        <div
          className="crop-modal-overlay"
          onClick={() => {
            if (isUploadingImage) return;
            setSelectedImageSource("");
            setSelectedImageName("");
            setCropAreaPixels(null);
          }}
        >
          <div
            className="crop-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="crop-modal__header">
              <h3>Crop ảnh trước khi lưu</h3>
              <p>{selectedImageName || "Ảnh mới"}</p>
            </div>

            <div className="cropper-wrap">
              <Cropper
                image={selectedImageSource}
                crop={cropPosition}
                zoom={cropZoom}
                aspect={4 / 3}
                onCropChange={setCropPosition}
                onZoomChange={setCropZoom}
                onCropComplete={(_, croppedAreaPixelsValue) => {
                  setCropAreaPixels(croppedAreaPixelsValue);
                }}
              />
            </div>

            <div className="crop-controls">
              <label>
                Zoom
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={cropZoom}
                  onChange={(event) => setCropZoom(Number(event.target.value))}
                  disabled={isUploadingImage}
                />
              </label>
            </div>

            <div className="crop-actions">
              <button
                type="button"
                className="ghost-btn"
                onClick={() => {
                  setSelectedImageSource("");
                  setSelectedImageName("");
                  setCropAreaPixels(null);
                }}
                disabled={isUploadingImage}
              >
                Hủy
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={() => {
                  void handleCropAndUploadImage();
                }}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? "Đang upload..." : "Crop và lưu ảnh"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default Products;
