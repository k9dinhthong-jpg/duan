import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type ProductItem = {
  id: string;
  brand_id: string;
  name: string;
  link: string;
  owner: string;
  model: string;
  date: string;
  contact: string;
  note: string;
  vat: string;
  origin: string;
  status: string;
  badge: string;
  image: string;
  link_image_product: string;
  is_active: 0 | 1;
  created_at: string;
};

export type ProductPayload = {
  brand_id: string;
  name: string;
  link: string;
  owner: string;
  model: string;
  date: string;
  contact: string;
  note: string;
  vat: string;
  origin: string;
  status: string;
  badge: string;
  image: string;
  link_image_product: string;
  is_active: 0 | 1;
};

type ApiResult<T> = {
  ok: boolean;
  data?: T;
  message?: string;
};

type ProductContextValue = {
  productItems: ProductItem[];
  isLoadingProducts: boolean;
  productsMessage: string;
  refreshProductData: () => Promise<void>;
  createProductItem: (
    payload: ProductPayload,
  ) => Promise<ApiResult<ProductItem>>;
  updateProductItem: (
    id: string,
    payload: ProductPayload,
  ) => Promise<ApiResult<ProductItem>>;
  deleteProductItem: (id: string) => Promise<ApiResult<null>>;
};

type ProductContextProviderProps = {
  children: ReactNode;
};

const PRODUCT_API_CANDIDATES = [
  import.meta.env.VITE_PRODUCTS_API_ENDPOINT || "",
  "/api/product_items",
  "/api/product-items",
  "/api/products",
].filter(Boolean);

const ProductContext = createContext<ProductContextValue>({
  productItems: [],
  isLoadingProducts: false,
  productsMessage: "",
  refreshProductData: async () => {},
  createProductItem: async () => ({ ok: false, message: "Not implemented." }),
  updateProductItem: async () => ({ ok: false, message: "Not implemented." }),
  deleteProductItem: async () => ({ ok: false, message: "Not implemented." }),
});

let resolvedProductEndpoint: string | null = null;

function getNowDateTime(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function getAuthToken(): string {
  return localStorage.getItem("adminmct:token") ?? "";
}

function readStringOrFallback(value: unknown, fallback: string): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || fallback;
  }

  if (value === null || typeof value === "undefined") {
    return fallback;
  }

  const normalized = String(value).trim();
  return normalized || fallback;
}

function normalizeProductRow(raw: unknown): ProductItem {
  const item = (raw ?? {}) as Record<string, unknown>;
  const brandRaw = item.brand_id ?? item.brandId;
  const createdAtValue =
    typeof item.created_at !== "undefined" ? item.created_at : item.createdAt;
  return {
    id: String(item.id ?? ""),
    brand_id:
      brandRaw === null || typeof brandRaw === "undefined"
        ? ""
        : String(brandRaw).trim(),
    name: String(item.name ?? item.title ?? ""),
    link: String(item.link ?? item.url ?? ""),
    owner: String(item.owner ?? ""),
    model: String(item.model ?? ""),
    date: String(item.date ?? ""),
    contact: String(item.contact ?? ""),
    note: String(item.note ?? ""),
    vat: String(item.vat ?? ""),
    origin: String(item.origin ?? ""),
    status: String(item.status ?? ""),
    badge: String(item.badge ?? ""),
    image: String(item.image ?? ""),
    link_image_product: String(item.link_image_product ?? ""),
    is_active: Number(item.is_active) === 0 ? 0 : 1,
    created_at: readStringOrFallback(createdAtValue, getNowDateTime()),
  };
}

async function readResponseMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string };
    return data.message ?? fallback;
  } catch {
    return fallback;
  }
}

async function resolveProductEndpoint(token: string): Promise<string> {
  if (resolvedProductEndpoint) {
    return resolvedProductEndpoint;
  }

  for (const endpoint of PRODUCT_API_CANDIDATES) {
    try {
      const res = await fetch(endpoint, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status !== 404) {
        resolvedProductEndpoint = endpoint;
        return endpoint;
      }
    } catch {
      // Try next endpoint.
    }
  }

  resolvedProductEndpoint = PRODUCT_API_CANDIDATES[0] || "/api/product_items";
  return resolvedProductEndpoint || "/api/product_items";
}

async function readListPayload<T>(res: Response): Promise<T[]> {
  const payload = (await res.json()) as
    | T[]
    | {
        items?: T[];
        data?: T[];
        rows?: T[];
        list?: T[];
        products?: T[];
        product_items?: T[];
      };

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.rows)) return payload.rows;
  if (Array.isArray(payload.list)) return payload.list;
  if (Array.isArray(payload.products)) return payload.products;
  if (Array.isArray(payload.product_items)) return payload.product_items;
  return [];
}

async function requestMutation<T>(
  endpoint: string,
  method: "POST" | "PUT" | "DELETE",
  body?: unknown,
): Promise<ApiResult<T>> {
  const token = getAuthToken();
  if (!token) {
    return { ok: false, message: "Thiếu token đăng nhập." };
  }

  try {
    const res = await fetch(endpoint, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      return {
        ok: false,
        message: await readResponseMessage(res, "Thao tác API thất bại."),
      };
    }

    if (method === "DELETE") {
      return { ok: true, data: null as T };
    }

    const data = (await res.json()) as T | { item?: T; data?: T };
    const value =
      typeof data === "object" &&
      data !== null &&
      ("item" in data || "data" in data)
        ? (((data as { item?: T }).item ?? (data as { data?: T }).data) as T)
        : (data as T);

    return { ok: true, data: value };
  } catch {
    return { ok: false, message: "Không kết nối được API." };
  }
}

export function ProductContextProvider({
  children,
}: ProductContextProviderProps) {
  const [productItems, setProductItems] = useState<ProductItem[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productsMessage, setProductsMessage] = useState("");

  async function refreshProductData() {
    const token = getAuthToken();
    if (!token) {
      setProductItems([]);
      setProductsMessage("Thiếu token đăng nhập.");
      return;
    }

    setIsLoadingProducts(true);

    try {
      const endpoint = await resolveProductEndpoint(token);
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const message = await readResponseMessage(
          res,
          "Không tải được dữ liệu product_items.",
        );
        setProductItems([]);
        setProductsMessage(message);
        setIsLoadingProducts(false);
        return;
      }

      const productRaw = await readListPayload<unknown>(res);
      setProductItems(
        productRaw
          .map((item) => normalizeProductRow(item))
          .filter((item) => Boolean(item.id))
          .sort((a, b) => b.created_at.localeCompare(a.created_at)),
      );
      setProductsMessage("");
      setIsLoadingProducts(false);
    } catch {
      setProductItems([]);
      setProductsMessage("Không kết nối được API.");
      setIsLoadingProducts(false);
    }
  }

  async function createProductItem(payload: ProductPayload) {
    const token = getAuthToken();
    const endpoint = await resolveProductEndpoint(token);

    const result = await requestMutation<ProductItem>(endpoint, "POST", {
      brand_id: payload.brand_id,
      name: payload.name.trim(),
      link: payload.link.trim(),
      owner: payload.owner.trim(),
      model: payload.model.trim(),
      date: payload.date.trim(),
      contact: payload.contact.trim(),
      note: payload.note.trim(),
      vat: payload.vat.trim(),
      origin: payload.origin.trim(),
      status: payload.status.trim(),
      badge: payload.badge.trim(),
      image: payload.image.trim(),
      link_image_product: payload.link_image_product.trim(),
      is_active: payload.is_active,
    });

    if (result.ok) {
      await refreshProductData();
      return {
        ok: true,
        data: result.data ? normalizeProductRow(result.data) : undefined,
      };
    }

    return { ok: false, message: result.message };
  }

  async function updateProductItem(id: string, payload: ProductPayload) {
    const token = getAuthToken();
    const endpoint = await resolveProductEndpoint(token);

    const result = await requestMutation<ProductItem>(
      `${endpoint}/${id}`,
      "PUT",
      {
        brand_id: payload.brand_id,
        name: payload.name.trim(),
        link: payload.link.trim(),
        owner: payload.owner.trim(),
        model: payload.model.trim(),
        date: payload.date.trim(),
        contact: payload.contact.trim(),
        note: payload.note.trim(),
        vat: payload.vat.trim(),
        origin: payload.origin.trim(),
        status: payload.status.trim(),
        badge: payload.badge.trim(),
        image: payload.image.trim(),
        link_image_product: payload.link_image_product.trim(),
        is_active: payload.is_active,
      },
    );

    if (result.ok) {
      await refreshProductData();
      return {
        ok: true,
        data: result.data ? normalizeProductRow(result.data) : undefined,
      };
    }

    return { ok: false, message: result.message };
  }

  async function deleteProductItem(id: string) {
    const token = getAuthToken();
    const endpoint = await resolveProductEndpoint(token);
    const result = await requestMutation<null>(`${endpoint}/${id}`, "DELETE");

    if (result.ok) {
      await refreshProductData();
    }

    return result;
  }

  useEffect(() => {
    void refreshProductData();
  }, []);

  const value = useMemo(
    () => ({
      productItems,
      isLoadingProducts,
      productsMessage,
      refreshProductData,
      createProductItem,
      updateProductItem,
      deleteProductItem,
    }),
    [productItems, isLoadingProducts, productsMessage],
  );

  return (
    <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
  );
}

export function useProductContext(): ProductContextValue {
  return useContext(ProductContext);
}
