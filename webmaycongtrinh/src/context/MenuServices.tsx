import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  extractCollection,
  getConfiguredApiPath,
  requestJson,
} from "../lib/apiClient";
import { warnMissingCollectionFields } from "../lib/schemaGuard";

export type MenuServiceItem = {
  id: number;
  name: string;
  link: string;
};

type MenuServicesContextValue = {
  serviceItems: MenuServiceItem[];
};

const SERVICES_ITEMS_PATH = getConfiguredApiPath(
  "VITE_API_SERVICES_ITEMS_PATH",
  "/api/services-items",
);

function normalizeMenuItems(
  rows: Record<string, unknown>[],
): MenuServiceItem[] {
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
    .filter((item): item is MenuServiceItem => item !== null)
    .sort((a, b) => a.id - b.id);
}

const MenuServicesContext = createContext<MenuServicesContextValue | undefined>(
  undefined,
);

export function MenuServicesProvider({ children }: { children: ReactNode }) {
  const [serviceItems, setServiceItems] = useState<MenuServiceItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadServiceItems() {
      try {
        const payload = await requestJson(SERVICES_ITEMS_PATH);

        if (!isMounted) {
          return;
        }

        const rows = extractCollection(payload);
        warnMissingCollectionFields(
          rows,
          ["id", "name", "link"],
          "MenuServices",
        );
        setServiceItems(normalizeMenuItems(rows));
      } catch {
        if (!isMounted) {
          return;
        }

        setServiceItems([]);
      }
    }

    loadServiceItems();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(() => ({ serviceItems }), [serviceItems]);

  return (
    <MenuServicesContext.Provider value={value}>
      {children}
    </MenuServicesContext.Provider>
  );
}

export function useMenuServices() {
  const context = useContext(MenuServicesContext);

  if (!context) {
    throw new Error("useMenuServices must be used within MenuServicesProvider");
  }

  return context;
}
