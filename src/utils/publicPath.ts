export function toPublicPath(path: string) {
  const normalizedBaseUrl = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  return `${normalizedBaseUrl}${path.replace(/^\/+/, "")}`;
}