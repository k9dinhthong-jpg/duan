import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  extractCollection,
  getConfiguredApiPath,
  requestJson,
} from "../lib/apiClient";
import { warnMissingCollectionFields } from "../lib/schemaGuard";

export type NewsItem = {
  id: string;
  slug?: string;
  title: string;
  content: string;
  image: string;
  category?: string;
  publishedAt?: string;
  author?: string;
};

type NewsContextValue = {
  items: NewsItem[];
  isLoading: boolean;
  error: string | null;
};

const NewsContext = createContext<NewsContextValue | undefined>(undefined);

const newsApiPath = getConfiguredApiPath("VITE_API_NEWS_PATH", "/api/news");

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

function normalizeNewsItem(row: Record<string, unknown>): NewsItem | null {
  const id = normalizeText(row.id);
  const title = normalizeText(row.title);
  const content = normalizeText(row.content);
  const image = normalizeText(row.image);

  if (!id || !title || !content || !image) {
    return null;
  }

  return {
    id,
    slug: normalizeText(row.slug),
    title,
    content,
    image,
    category: normalizeText(row.category),
    publishedAt: normalizeText(row.published_at),
    author: normalizeText(row.author),
  };
}

function sortNewsItems(items: NewsItem[]) {
  return [...items].sort((left, right) => {
    const rightTime = right.publishedAt
      ? Date.parse(right.publishedAt)
      : Number.NaN;
    const leftTime = left.publishedAt
      ? Date.parse(left.publishedAt)
      : Number.NaN;

    if (
      !Number.isNaN(rightTime) &&
      !Number.isNaN(leftTime) &&
      rightTime !== leftTime
    ) {
      return rightTime - leftTime;
    }

    return right.id.localeCompare(left.id, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });
}

export function NewsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchNews() {
      try {
        const payload = await requestJson(newsApiPath);
        const rows = extractCollection(payload);

        if (!isMounted) return;

        warnMissingCollectionFields(
          rows,
          ["id", "title", "content", "image", "published_at", "slug"],
          "News",
        );

        const normalizedItems = rows
          .map((row) => normalizeNewsItem(row))
          .filter((item): item is NewsItem => item !== null);

        setItems(sortNewsItems(normalizedItems));
        setError(null);
      } catch (unknownError) {
        if (!isMounted) return;
        setError(
          unknownError instanceof Error
            ? unknownError.message
            : "Không thể tải dữ liệu tin tức từ backend.",
        );
        setItems([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchNews();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({ items, isLoading, error }),
    [items, isLoading, error],
  );

  return <NewsContext.Provider value={value}>{children}</NewsContext.Provider>;
}

export function useNews() {
  const context = useContext(NewsContext);
  if (!context) {
    throw new Error("useNews must be used within NewsProvider");
  }

  return context;
}
