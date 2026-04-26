import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "../../lib/supabaseClient";

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

const defaultKomatsuGroup: ProductGroup = {
  id: "Komatsu",
  brand: "Komatsu",
  groupTitle: "MAY CONG TRINH KOMATSU",
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

function normalizeStatus(value?: string): string {
  if (!value) return "Con hang";
  return value;
}

function normalizeBadge(value: unknown, index: number): "Hot" | null {
  const badge = normalizeText(value);
  if (!badge) {
    return index < 7 ? "Hot" : null;
  }

  return badge.toLowerCase() === "hot" ? "Hot" : null;
}

function normalizeImagePath(id: string, value: unknown): string {
  const image = normalizeText(value);
  if (image) {
    return image;
  }

  return `/img/Product/Komatsu/${id}.png`;
}

function normalizeRow(
  row: Record<string, unknown>,
  index: number,
): ProductItem | null {
  const id = normalizeText(row.id);
  if (!id) return null;

  const model = normalizeText(row.model) ?? normalizeText(row.name);
  const status =
    normalizeText(row.status) ??
    normalizeText(row.productStatus) ??
    normalizeText(row.product_status);

  return {
    id,
    model,
    name: normalizeText(row.name),
    date: normalizeText(row.date),
    contact: normalizeText(row.contact),
    price: normalizeText(row.price) ?? "",
    status: normalizeStatus(status),
    badge: normalizeBadge(row.badge, index),
    image: normalizeImagePath(id, row.image),
    alt: normalizeText(row.alt) ?? "Komatsu",
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
        const { data, error: fetchError } = await supabase
          .from("products_komatsu")
          .select("*");

        if (fetchError) {
          if (!isMounted) return;
          setError(fetchError.message);
          return;
        }

        if (!isMounted) return;

        const normalizedProducts = (data ?? [])
          .map((row, index) => normalizeRow(row, index))
          .filter((item): item is ProductItem => item !== null)
          .sort((a, b) =>
            a.id.localeCompare(b.id, undefined, { numeric: true }),
          );

        const firstRow = (data?.[0] ?? null) as Record<string, unknown> | null;

        setKomatsuGroup((prev) => ({
          id: "Komatsu",
          brand: "Komatsu",
          groupTitle:
            normalizeText(firstRow?.groupTitle) ??
            normalizeText(firstRow?.group_title) ??
            prev.groupTitle,
          products: normalizedProducts,
        }));
        setError(null);
      } catch (unknownError) {
        if (!isMounted) return;
        setError(
          unknownError instanceof Error
            ? unknownError.message
            : "Khong the tai du lieu Komatsu tu Supabase.",
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
