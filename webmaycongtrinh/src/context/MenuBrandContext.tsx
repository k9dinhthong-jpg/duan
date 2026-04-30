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
  link: string;
};

type MenuBrandContextValue = {
  productItems: MenuBrandItem[];
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

      return {
        id,
        name: trimmedName,
        link: trimmedLink,
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

  useEffect(() => {
    let isMounted = true;

    async function loadBrandItems() {
      try {
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
      }
    }

    loadBrandItems();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(() => ({ productItems }), [productItems]);

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
