import type { SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "./slug";

/**
 * Sinh slug từ tên và bảo đảm không trùng trong bảng.
 * Người dùng không phải tự nhập — trùng thì tự thêm -2, -3…
 */
export async function uniqueSlug(
  supabase: SupabaseClient,
  table: "clusters" | "books",
  ten: string,
  macDinh = "muc",
): Promise<string> {
  const goc = slugify(ten) || macDinh;

  const { data } = await supabase.from(table).select("slug").like("slug", `${goc}%`);
  const daDung = new Set(((data as { slug: string }[] | null) ?? []).map((r) => r.slug));

  if (!daDung.has(goc)) return goc;
  for (let i = 2; i < 500; i++) {
    const thu = `${goc}-${i}`;
    if (!daDung.has(thu)) return thu;
  }
  return `${goc}-${Date.now()}`;
}
