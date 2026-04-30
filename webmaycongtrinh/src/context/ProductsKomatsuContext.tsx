import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  extractCollection,
  getConfiguredApiPath,
  requestJson,
} from "../lib/apiClient";
import { warnMissingCollectionFields } from "../lib/schemaGuard";

export type ProductItem = {
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

export type ProductGroup = {
  id: string;
  brand: string;
  groupTitle: string;
  products: ProductItem[];
};

type ProductsKomatsuContextValue = {
  komatsuGroup: ProductGroup;
  isLoading: boolean;
  error: string | null;
};

const productsKomatsuApiPath = getConfiguredApiPath(
  "VITE_API_PRODUCTS_KOMATSU_PATH",
  "/api/products/komatsu",
);

const defaultKomatsuGroup: ProductGroup = {
  id: "Komatsu",
  brand: "Komatsu",
  groupTitle: "",
  products: [],
};

const ProductsKomatsuContext = createContext<
  ProductsKomatsuContextValue | undefined
>(undefined);

function normalizeText(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof value === "number") {
    return `${value}`;
  }

  return undefined;
}

function normalizeBadge(value: unknown): "Hot" | null {
  const badge = normalizeText(value);
  if (!badge) {
    return null;
  }

  return badge.toLowerCase() === "hot" ? "Hot" : null;
}

function normalizeImagePath(value: unknown): string {
  const image = normalizeText(value);
  if (image) {
    return image;
  }

  return "";
}

function normalizeRow(row: Record<string, unknown>): ProductItem | null {
  const id = normalizeText(row.id);
  if (!id) return null;

  const model = normalizeText(row.model);
  const status = normalizeText(row.status);

  return {
    id,
    model,
    name: normalizeText(row.name),
    date: normalizeText(row.date),
    contact: normalizeText(row.contact),
    price: normalizeText(row.price) ?? "",
    status,
    badge: normalizeBadge(row.badge),
    image: normalizeImagePath(row.image),
    alt: normalizeText(row.alt) ?? "",
  };
}

export function ProductsKomatsuProvider({ children }: { children: ReactNode }) {
  const [komatsuGroup, setKomatsuGroup] =
    useState<ProductGroup>(defaultKomatsuGroup);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchProductsKomatsu() {
      try {
        const payload = await requestJson(productsKomatsuApiPath);
        const rows = extractCollection(payload);

        if (!isMounted) return;

        warnMissingCollectionFields(
          rows,
          ["id", "image", "price", "group_title", "status", "badge"],
          "ProductsKomatsu",
        );

        const normalizedProducts = rows
          .map((row) => normalizeRow(row))
          .filter((item): item is ProductItem => item !== null)
          .sort((a, b) =>
            a.id.localeCompare(b.id, undefined, { numeric: true }),
          );

        const firstRow = rows[0] ?? null;

        setKomatsuGroup({
          id: "Komatsu",
          brand: "Komatsu",
          groupTitle: normalizeText(firstRow?.group_title) ?? "",
          products: normalizedProducts,
        });
        setError(null);
      } catch (unknownError) {
        if (!isMounted) return;
        setError(
          unknownError instanceof Error
            ? unknownError.message
            : "Khong the tai du lieu Komatsu tu backend.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchProductsKomatsu();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({ komatsuGroup, isLoading, error }),
    [komatsuGroup, isLoading, error],
  );

  return (
    <ProductsKomatsuContext.Provider value={value}>
      {children}
    </ProductsKomatsuContext.Provider>
  );
}

export function useProductsKomatsu() {
  const context = useContext(ProductsKomatsuContext);
  if (!context) {
    throw new Error(
      "useProductsKomatsu must be used within ProductsKomatsuProvider",
    );
  }

  return context;
}
