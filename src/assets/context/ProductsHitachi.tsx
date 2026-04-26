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

type ProductsHitachiContextValue = {
  hitachiGroup: ProductGroup;
  isLoading: boolean;
  error: string | null;
};

const defaultHitachiGroup: ProductGroup = {
  id: "Hitachi",
  brand: "Hitachi",
  groupTitle: "MAY CONG TRINH HITACHI",
  products: [],
};

const ProductsHitachiContext = createContext<
  ProductsHitachiContextValue | undefined
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

  return `/img/Product/Hitachi/${id}.png`;
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
    alt: normalizeText(row.alt) ?? "Hitachi",
  };
}

export function ProductsHitachiProvider({ children }: { children: ReactNode }) {
  const [hitachiGroup, setHitachiGroup] =
    useState<ProductGroup>(defaultHitachiGroup);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchProductsHitachi() {
      try {
        const { data, error: fetchError } = await supabase
          .from("products_hitachi")
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

        setHitachiGroup((prev) => ({
          id: "Hitachi",
          brand: "Hitachi",
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
            : "Khong the tai du lieu Hitachi tu Supabase.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchProductsHitachi();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({ hitachiGroup, isLoading, error }),
    [hitachiGroup, isLoading, error],
  );

  return (
    <ProductsHitachiContext.Provider value={value}>
      {children}
    </ProductsHitachiContext.Provider>
  );
}

export function useProductsHitachi() {
  const context = useContext(ProductsHitachiContext);
  if (!context) {
    throw new Error(
      "useProductsHitachi must be used within ProductsHitachiProvider",
    );
  }

  return context;
}
