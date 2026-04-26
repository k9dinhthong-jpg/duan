import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "../../lib/supabaseClient";

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

function normalizeNewsItem(
  row: Record<string, unknown>,
  index: number,
): NewsItem | null {
  const title = normalizeText(row.title);
  const content = normalizeText(row.content);

  if (!title || !content) {
    return null;
  }

  return {
    id:
      normalizeText(row.id) ??
      normalizeText(row.newsId) ??
      normalizeText(row.news_id) ??
      `news-${index + 1}`,
    slug: normalizeText(row.slug),
    title,
    content,
    image:
      normalizeText(row.image) ??
      normalizeText(row.imageUrl) ??
      normalizeText(row.image_url) ??
      "",
    category: normalizeText(row.category),
    publishedAt:
      normalizeText(row.publishedAt) ??
      normalizeText(row.published_at) ??
      normalizeText(row.created_at) ??
      normalizeText(row.createdAt),
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
        const { data, error: fetchError } = await supabase
          .from("news")
          .select("*");

        if (fetchError) {
          if (!isMounted) return;
          setError(fetchError.message);
          setItems([]);
          return;
        }

        if (!isMounted) return;

        const normalizedItems = (data ?? [])
          .map((row, index) => normalizeNewsItem(row, index))
          .filter((item): item is NewsItem => item !== null);

        setItems(sortNewsItems(normalizedItems));
        setError(null);
      } catch (unknownError) {
        if (!isMounted) return;
        setError(
          unknownError instanceof Error
            ? unknownError.message
            : "Không thể tải dữ liệu tin tức từ Supabase.",
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
