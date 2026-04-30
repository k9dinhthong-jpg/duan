import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  extractCollection,
  getConfiguredApiPath,
  requestJson,
} from "../lib/apiClient";
import { warnMissingCollectionFields } from "../lib/schemaGuard";

export type MenuBrandItem = {
  id: number;
  name: string;
  brand: string;
  link: string;
};

type MenuBrandContextValue = {
  productItems: MenuBrandItem[];
  error: string;
};

const BRAND_ITEMS_PATH = getConfiguredApiPath(
  "VITE_API_BRAND_ITEMS_PATH",
  "/api/brand_items",
);

function normalizeBrandItems(rows: Record<string, unknown>[]): MenuBrandItem[] {
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
        typeof rawId === "number" && Number.isFinite(rawId)
          ? rawId
          : typeof rawId === "string" && rawId.trim() !== ""
            ? Number.parseInt(rawId, 10)
            : Number.NaN;

      if (!Number.isFinite(id)) {
        return null;
      }

      // Chỉ lấy brand đang active
      if (Number(row.is_active) === 0) {
        return null;
      }

      // Nếu link là URL đầy đủ (https://...) thì chỉ lấy pathname
      let normalizedLink = trimmedLink;
      try {
        const parsed = new URL(trimmedLink);
        normalizedLink = parsed.pathname;
      } catch {
        // link đã là path tương đối, giữ nguyên
      }

      const brandRaw = row.brand;
      const brand =
        typeof brandRaw === "string" && brandRaw.trim() !== ""
          ? brandRaw.trim().toUpperCase()
          : (normalizedLink
              .replace(/\/$/, "")
              .split("/")
              .pop()
              ?.toUpperCase() ?? "");

      return {
        id,
        name: trimmedName,
        brand,
        link: normalizedLink,
      };
    })
    .filter((item): item is MenuBrandItem => item !== null)
    .sort((a, b) => a.id - b.id);
}

const MenuBrandContext = createContext<MenuBrandContextValue | undefined>(
  undefined,
);

export function MenuBrandProvider({ children }: { children: ReactNode }) {
  const [productItems, setProductItems] = useState<MenuBrandItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadBrandItems() {
      try {
        setError("");
        const payload = await requestJson(BRAND_ITEMS_PATH);
        if (!isMounted) {
          return;
        }

        const rows = extractCollection(payload);
        warnMissingCollectionFields(rows, ["id", "name", "link"], "MenuBrand");
        setProductItems(normalizeBrandItems(rows));
      } catch {
        if (!isMounted) {
          return;
        }

        setProductItems([]);
        setError("Không thể tải danh sách thương hiệu từ API.");
      }
    }

    loadBrandItems();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(() => ({ productItems, error }), [productItems, error]);

  return (
    <MenuBrandContext.Provider value={value}>
      {children}
    </MenuBrandContext.Provider>
  );
}

export function useMenuBrand() {
  const context = useContext(MenuBrandContext);

  if (!context) {
    throw new Error("useMenuBrand must be used within MenuBrandProvider");
  }

  return context;
}
