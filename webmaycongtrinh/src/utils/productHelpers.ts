import { toPublicPath } from "./publicPath";
import type { ProductItemRecord } from "../context/ListAllProducts";

/**
 * Safely convert unknown value to trimmed string
 */
export function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Product item with type-coerced fields
 */
export type ProductItem = {
  id: string;
  brandId: string;
  isActive: boolean;
  model?: string;
  name?: string;
  date?: string;
  contact?: string;
  price?: string;
  status?: string;
  badge?: "Hot" | null;
  image?: string;
  alt?: string;
  origin?: string;
  vat?: string;
  created_at?: string;
};

/**
 * Convert API record to typed ProductItem
 */
export function toProductItem(row: ProductItemRecord): ProductItem {
  return {
    id: toText(row.id),
    brandId: toText(row.brand_id).toUpperCase(),
    isActive: Number(row.is_active) !== 0,
    model: toText(row.model) || undefined,
    name: toText(row.name) || undefined,
    date: toText(row.date) || undefined,
    contact: toText(row.contact) || undefined,
    price: toText(row.price) || undefined,
    status: toText(row.status) || undefined,
    badge: toText(row.badge) === "Hot" ? "Hot" : null,
    image: toText(row.image) || undefined,
    alt: toText(row.alt) || undefined,
    origin: toText(row.origin) || undefined,
    vat: toText(row.vat) || undefined,
    created_at: toText(row.created_at) || undefined,
  };
}

/**
 * Get display title for product: "BRAND MODEL"
 */
export function getProductTitle(product: ProductItem): string {
  const brand = product.brandId;
  const model = product.model ?? product.name ?? product.id;
  return brand ? `${brand} ${model}` : model;
}

/**
 * Get full image source URL or default
 */
export function getProductImageSrc(image?: string): string {
  if (!image) {
    return toPublicPath("img/Product/default.png");
  }

  return /^https?:\/\//i.test(image) ? image : toPublicPath(image);
}

/**
 * Get product model (or name as fallback)
 */
export function getProductModel(product: ProductItem): string {
  return product.model ?? product.name ?? product.id;
}

/**
 * Get display text: "MODEL (DATE)" or just "MODEL"
 */
export function getProductDisplay(product: ProductItem): string {
  const model = getProductModel(product);
  return product.date ? `${model} (${product.date})` : model;
}

/**
 * Get alt text for product image
 */
export function getProductImageAlt(product: ProductItem, brand: string): string {
  const normalizedAlt = product.alt?.trim();
  if (normalizedAlt) {
    return normalizedAlt;
  }

  const display = getProductDisplay(product);
  return `${display} - ${brand} nhập khẩu`;
}
