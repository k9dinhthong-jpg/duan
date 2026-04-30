type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getEnvVar(name: string): string | undefined {
  const value = (import.meta.env as Record<string, string | undefined>)[name];
  if (!value) return undefined;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function getConfiguredApiPath(envVar: string, fallbackPath: string) {
  return getEnvVar(envVar) ?? fallbackPath;
}

function getApiBaseUrl() {
  return getEnvVar("VITE_API_BASE_URL");
}

function normalizePath(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return path.startsWith("/") ? path : `/${path}`;
}

function buildApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = normalizePath(path);
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return normalizedPath;
  }

  return new URL(normalizedPath, apiBaseUrl).toString();
}

function extractErrorMessage(payload: unknown, fallback: string) {
  if (!isRecord(payload)) {
    return fallback;
  }

  const message = payload.message;
  if (typeof message === "string" && message.trim()) {
    return message;
  }

  const error = payload.error;
  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return fallback;
}

export async function requestJson(path: string): Promise<unknown> {
  const response = await fetch(buildApiUrl(path), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const rawText = await response.text();
  const payload = rawText ? (JSON.parse(rawText) as unknown) : null;

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(payload, `HTTP ${response.status}: ${response.statusText}`),
    );
  }

  return payload;
}

export function extractCollection(payload: unknown): JsonRecord[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (!isRecord(payload)) {
    return [];
  }

  const collectionKeys = ["data", "items", "results", "rows", "list"];
  for (const key of collectionKeys) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value.filter(isRecord);
    }
  }

  return [];
}

export function extractRecord(payload: unknown): JsonRecord | null {
  if (Array.isArray(payload)) {
    const firstItem = payload.find(isRecord);
    return firstItem ?? null;
  }

  if (!isRecord(payload)) {
    return null;
  }

  if (isRecord(payload.data)) {
    return payload.data;
  }

  return payload;
}