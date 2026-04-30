import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  extractCollection,
  getConfiguredApiPath,
  requestJson,
} from "../lib/apiClient";
import { warnMissingCollectionFields } from "../lib/schemaGuard";

export type ProductItemRecord = {
  [key: string]: unknown;
  id: string;
  name: string;
  link: string;
};

type ListAllProductsContextValue = {
  productItems: ProductItemRecord[];
  isLoading: boolean;
  error: string;
};

const PRODUCT_ITEMS_PATH = getConfiguredApiPath(
  "VITE_API_PRODUCT_ITEMS_PATH",
  "/api/product_items",
);

function normalizeProductItems(
  rows: Record<string, unknown>[],
): ProductItemRecord[] {
  return rows
    .map((row) => {
      const name = row.name;
      const link = row.link;

      if (typeof name !== "string" || typeof link !== "string") {
        return null;
      }

      const trimmedName = name.trim();
      const trimmedLink = link.trim();

      if (!trimmedName || !trimmedLink) {
        return null;
      }

      const rawId = row.id;
      const id =
        typeof rawId === "string"
          ? rawId.trim()
          : typeof rawId === "number" && Number.isFinite(rawId)
            ? String(rawId)
            : "";

      if (!id) {
        return null;
      }

      // Giữ toàn bộ field API trả về, chỉ chuẩn hóa id/name/link
      return {
        ...row,
        id,
        name: trimmedName,
        link: trimmedLink,
      };
    })
    .filter((item): item is ProductItemRecord => item !== null)
    .sort((a, b) => a.id.localeCompare(b.id));
}

const ListAllProductsContext = createContext<
  ListAllProductsContextValue | undefined
>(undefined);

export function ListAllProductsProvider({ children }: { children: ReactNode }) {
  const [productItems, setProductItems] = useState<ProductItemRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadAllProducts() {
      try {
        setIsLoading(true);
        setError("");

        const payload = await requestJson(PRODUCT_ITEMS_PATH);
        if (!isMounted) {
          return;
        }

        const rows = extractCollection(payload);
        warnMissingCollectionFields(
          rows,
          ["id", "name", "link"],
          "ListAllProducts",
        );
        setProductItems(normalizeProductItems(rows));
      } catch {
        if (!isMounted) {
          return;
        }

        setProductItems([]);
        setError("Không thể tải danh sách product_items từ API.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAllProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({ productItems, isLoading, error }),
    [productItems, isLoading, error],
  );

  return (
    <ListAllProductsContext.Provider value={value}>
      {children}
    </ListAllProductsContext.Provider>
  );
}

export function useListAllProducts() {
  const context = useContext(ListAllProductsContext);

  if (!context) {
    throw new Error(
      "useListAllProducts must be used within ListAllProductsProvider",
    );
  }

  return context;
}
