import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  extractCollection,
  getConfiguredApiPath,
  requestJson,
} from "../lib/apiClient";
import { warnMissingCollectionFields } from "../lib/schemaGuard";

export type MenuIntroductionItem = {
  id: number;
  name: string;
  link: string;
};

type MenuIntroductionContextValue = {
  introItems: MenuIntroductionItem[];
};

const INTRO_ITEMS_PATH = getConfiguredApiPath(
  "VITE_API_INTRO_ITEMS_PATH",
  "/api/intro-items",
);

function normalizeMenuItems(
  rows: Record<string, unknown>[],
): MenuIntroductionItem[] {
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
    .filter((item): item is MenuIntroductionItem => item !== null)
    .sort((a, b) => a.id - b.id);
}

const MenuIntroductionContext = createContext<
  MenuIntroductionContextValue | undefined
>(undefined);

export function MenuIntroductionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [introItems, setIntroItems] = useState<MenuIntroductionItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadIntroItems() {
      try {
        const payload = await requestJson(INTRO_ITEMS_PATH);

        if (!isMounted) {
          return;
        }

        const rows = extractCollection(payload);
        warnMissingCollectionFields(
          rows,
          ["id", "name", "link"],
          "MenuIntroduction",
        );
        setIntroItems(normalizeMenuItems(rows));
      } catch {
        if (!isMounted) {
          return;
        }

        setIntroItems([]);
      }
    }

    loadIntroItems();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(() => ({ introItems }), [introItems]);

  return (
    <MenuIntroductionContext.Provider value={value}>
      {children}
    </MenuIntroductionContext.Provider>
  );
}

export function useMenuIntroduction() {
  const context = useContext(MenuIntroductionContext);

  if (!context) {
    throw new Error(
      "useMenuIntroduction must be used within MenuIntroductionProvider",
    );
  }

  return context;
}
