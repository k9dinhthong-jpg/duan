import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type BrandItem = {
  id: number;
  name: string;
  brand: string;
  link: string;
  is_active: 0 | 1;
  created_at: string;
};

export type BrandPayload = {
  name: string;
  brand: string;
  is_active: 0 | 1;
};

export type BrandModel = {
  id: number;
  brand_id: number;
  model_name: string;
};

type ApiResult<T> = {
  ok: boolean;
  data?: T;
  message?: string;
};

type BrandContextValue = {
  brandItems: BrandItem[];
  isLoadingBrands: boolean;
  brandsMessage: string;
  refreshBrandData: () => Promise<void>;
  createBrandItem: (payload: BrandPayload) => Promise<ApiResult<BrandItem>>;
  updateBrandItem: (
    id: number,
    payload: BrandPayload,
  ) => Promise<ApiResult<BrandItem>>;
  deleteBrandItem: (id: number) => Promise<ApiResult<null>>;
  brandModels: BrandModel[];
  loadBrandModels: (brandId: number) => Promise<void>;
  addBrandModel: (
    brandId: number,
    modelName: string,
  ) => Promise<ApiResult<BrandModel>>;
  deleteBrandModel: (id: number) => Promise<ApiResult<null>>;
};

type BrandContextProviderProps = {
  children: ReactNode;
};

const BRAND_API_CANDIDATES = [
  import.meta.env.VITE_BRANDS_API_ENDPOINT || "",
  "/api/brand_items",
  "/api/brand-items",
  "/api/brands",
].filter(Boolean);

const BRAND_LINK_ORIGIN =
  import.meta.env.VITE_BRAND_LINK_ORIGIN ||
  "https://maycongtrinhnhapkhau.com.vn";

const BrandContext = createContext<BrandContextValue>({
  brandItems: [],
  isLoadingBrands: false,
  brandsMessage: "",
  refreshBrandData: async () => {},
  createBrandItem: async () => ({ ok: false, message: "Not implemented." }),
  updateBrandItem: async () => ({ ok: false, message: "Not implemented." }),
  deleteBrandItem: async () => ({ ok: false, message: "Not implemented." }),
  brandModels: [],
  loadBrandModels: async () => {},
  addBrandModel: async () => ({ ok: false, message: "Not implemented." }),
  deleteBrandModel: async () => ({ ok: false, message: "Not implemented." }),
});

let resolvedBrandEndpoint: string | null = null;

function getNowDateTime(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function getAuthToken(): string {
  return localStorage.getItem("adminmct:token") ?? "";
}

function createSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function buildBrandLink(name: string): string {
  const origin = BRAND_LINK_ORIGIN.replace(/\/+$/, "");
  return `${origin}/product/${createSlug(name)}`;
}

function normalizeBrandRow(raw: unknown): BrandItem {
  const item = (raw ?? {}) as Record<string, unknown>;
  return {
    id: Number(item.id) || 0,
    name: String(item.name ?? item.title ?? ""),
    brand: String(item.brand ?? item.code ?? item.label ?? item.name ?? ""),
    link: String(item.link ?? item.url ?? ""),
    is_active: Number(item.is_active) === 0 ? 0 : 1,
    created_at: String(item.created_at ?? item.createdAt ?? getNowDateTime()),
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

async function resolveBrandEndpoint(token: string): Promise<string> {
  if (resolvedBrandEndpoint) {
    return resolvedBrandEndpoint;
  }

  for (const endpoint of BRAND_API_CANDIDATES) {
    try {
      const res = await fetch(endpoint, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status !== 404) {
        resolvedBrandEndpoint = endpoint;
        return endpoint;
      }
    } catch {
      // Try next endpoint.
    }
  }

  resolvedBrandEndpoint = BRAND_API_CANDIDATES[0] || "/api/brand_items";
  return resolvedBrandEndpoint || "/api/brand_items";
}

async function readListPayload<T>(res: Response): Promise<T[]> {
  const payload = (await res.json()) as
    | T[]
    | {
        items?: T[];
        data?: T[];
        rows?: T[];
        list?: T[];
        brands?: T[];
        brand_items?: T[];
      };

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.rows)) return payload.rows;
  if (Array.isArray(payload.list)) return payload.list;
  if (Array.isArray(payload.brands)) return payload.brands;
  if (Array.isArray(payload.brand_items)) return payload.brand_items;
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

export function BrandContextProvider({ children }: BrandContextProviderProps) {
  const [brandItems, setBrandItems] = useState<BrandItem[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [brandsMessage, setBrandsMessage] = useState("");
  const [brandModels, setBrandModels] = useState<BrandModel[]>([]);

  async function refreshBrandData() {
    const token = getAuthToken();
    if (!token) {
      setBrandItems([]);
      setBrandsMessage("Thiếu token đăng nhập.");
      return;
    }

    setIsLoadingBrands(true);

    try {
      const endpoint = await resolveBrandEndpoint(token);
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const message = await readResponseMessage(
          res,
          "Không tải được dữ liệu brand_items.",
        );
        setBrandItems([]);
        setBrandsMessage(message);
        setIsLoadingBrands(false);
        return;
      }

      const brandRaw = await readListPayload<unknown>(res);
      setBrandItems(
        brandRaw
          .map((item) => normalizeBrandRow(item))
          .filter((item) => item.id > 0)
          .sort((a, b) => a.id - b.id),
      );
      setBrandsMessage("");
      setIsLoadingBrands(false);
    } catch {
      setBrandItems([]);
      setBrandsMessage("Không kết nối được API.");
      setIsLoadingBrands(false);
    }
  }

  async function createBrandItem(payload: BrandPayload) {
    const token = getAuthToken();
    const endpoint = await resolveBrandEndpoint(token);

    const result = await requestMutation<BrandItem>(endpoint, "POST", {
      name: payload.name.trim(),
      brand: payload.brand.trim(),
      link: buildBrandLink(payload.name),
      is_active: payload.is_active,
    });

    if (result.ok) {
      await refreshBrandData();
      return {
        ok: true,
        data: result.data ? normalizeBrandRow(result.data) : undefined,
      };
    }

    return { ok: false, message: result.message };
  }

  async function updateBrandItem(id: number, payload: BrandPayload) {
    const token = getAuthToken();
    const endpoint = await resolveBrandEndpoint(token);

    const result = await requestMutation<BrandItem>(
      `${endpoint}/${id}`,
      "PUT",
      {
        name: payload.name.trim(),
        brand: payload.brand.trim(),
        link: buildBrandLink(payload.name),
        is_active: payload.is_active,
      },
    );

    if (result.ok) {
      await refreshBrandData();
      return {
        ok: true,
        data: result.data ? normalizeBrandRow(result.data) : undefined,
      };
    }

    return { ok: false, message: result.message };
  }

  async function deleteBrandItem(id: number) {
    const token = getAuthToken();
    const endpoint = await resolveBrandEndpoint(token);
    const result = await requestMutation<null>(`${endpoint}/${id}`, "DELETE");

    if (result.ok) {
      await refreshBrandData();
    }

    return result;
  }

  async function loadBrandModels(brandId: number) {
    const token = getAuthToken();
    if (!token || brandId <= 0) {
      setBrandModels([]);
      return;
    }
    try {
      const res = await fetch(`/api/brand_models?brand_id=${brandId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setBrandModels([]);
        return;
      }
      const data = (await res.json()) as BrandModel[];
      setBrandModels(Array.isArray(data) ? data : []);
    } catch {
      setBrandModels([]);
    }
  }

  async function addBrandModel(
    brandId: number,
    modelName: string,
  ): Promise<ApiResult<BrandModel>> {
    const token = getAuthToken();
    if (!token) return { ok: false, message: "Thiếu token đăng nhập." };
    try {
      const res = await fetch("/api/brand_models", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ brand_id: brandId, model_name: modelName }),
      });
      if (!res.ok) {
        return {
          ok: false,
          message: await readResponseMessage(res, "Thêm model thất bại."),
        };
      }
      const item = (await res.json()) as BrandModel;
      await loadBrandModels(brandId);
      return { ok: true, data: item };
    } catch {
      return { ok: false, message: "Không kết nối được API." };
    }
  }

  async function deleteBrandModel(id: number): Promise<ApiResult<null>> {
    const token = getAuthToken();
    if (!token) return { ok: false, message: "Thiếu token đăng nhập." };
    try {
      const res = await fetch(`/api/brand_models/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        return {
          ok: false,
          message: await readResponseMessage(res, "Xóa model thất bại."),
        };
      }
      return { ok: true, data: null };
    } catch {
      return { ok: false, message: "Không kết nối được API." };
    }
  }

  useEffect(() => {
    void refreshBrandData();
  }, []);

  const value = useMemo(
    () => ({
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
    }),
    [brandItems, isLoadingBrands, brandsMessage, brandModels],
  );

  return (
    <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
  );
}

export function useBrandContext(): BrandContextValue {
  return useContext(BrandContext);
}
