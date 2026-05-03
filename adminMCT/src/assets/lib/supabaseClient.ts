import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

export const SUPABASE_BUCKET =
  (import.meta.env.VITE_SUPABASE_BUCKET || "products").trim() || "products";

export const supabaseClient =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export function buildSupabasePublicUrl(path: string): string {
  const normalizedPath = path.replace(/^\/+/, "");
  const cleanedUrl = supabaseUrl.replace(/\/+$/, "");
  if (!cleanedUrl || !normalizedPath) {
    return "";
  }

  return `${cleanedUrl}/storage/v1/object/public/${SUPABASE_BUCKET}/${normalizedPath}`;
}
