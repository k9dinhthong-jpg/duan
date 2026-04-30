import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  extractCollection,
  getConfiguredApiPath,
  requestJson,
} from "../lib/apiClient";
import { warnMissingCollectionFields } from "../lib/schemaGuard";

export type MenuItem = {
  id: number;
  name: string;
  link: string;
};

type MenuItemsContextValue = {
  serviceItems: MenuItem[];
  introItems: MenuItem[];
};

const SERVICES_ITEMS_PATH = getConfiguredApiPath(
  "VITE_API_SERVICES_ITEMS_PATH",
  "/api/services-items",
);

const INTRO_ITEMS_PATH = getConfiguredApiPath(
  "VITE_API_INTRO_ITEMS_PATH",
  "/api/intro-items",
);

function normalizeMenuItems(rows: Record<string, unknown>[]): MenuItem[] {
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
    .filter((item): item is MenuItem => item !== null)
    .sort((a, b) => a.id - b.id);
}

const MenuItemsContext = createContext<MenuItemsContextValue | undefined>(
  undefined,
);

export function MenuItemsProvider({ children }: { children: ReactNode }) {
  const [serviceItems, setServiceItems] = useState<MenuItem[]>([]);
  const [introItems, setIntroItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadMenuItems() {
      try {
        const [servicePayload, introPayload] = await Promise.all([
          requestJson(SERVICES_ITEMS_PATH),
          requestJson(INTRO_ITEMS_PATH),
        ]);

        if (!isMounted) {
          return;
        }

        const serviceRows = extractCollection(servicePayload);
        const introRows = extractCollection(introPayload);
        warnMissingCollectionFields(
          serviceRows,
          ["id", "name", "link"],
          "MenuItems/Services",
        );
        warnMissingCollectionFields(
          introRows,
          ["id", "name", "link"],
          "MenuItems/Intro",
        );
        setServiceItems(normalizeMenuItems(serviceRows));
        setIntroItems(normalizeMenuItems(introRows));
      } catch {
        if (!isMounted) {
          return;
        }

        setServiceItems([]);
        setIntroItems([]);
      }
    }

    loadMenuItems();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({ serviceItems, introItems }),
    [serviceItems, introItems],
  );

  return (
    <MenuItemsContext.Provider value={value}>
      {children}
    </MenuItemsContext.Provider>
  );
}

export function useMenuItems() {
  const context = useContext(MenuItemsContext);

  if (!context) {
    throw new Error("useMenuItems must be used within MenuItemsProvider");
  }

  return context;
}
