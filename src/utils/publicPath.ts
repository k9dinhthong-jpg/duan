export function resolvePublicPath(path: string, baseUrl: string) {
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return `${normalizedBaseUrl}${path.replace(/^\/+/, "")}`;
}

export function toPublicPath(path: string) {
  return resolvePublicPath(path, import.meta.env.BASE_URL);
}