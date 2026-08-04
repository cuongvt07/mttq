import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Kiểm tra email có nằm trong bảng admin_emails hay không.
 * RLS chỉ cho đọc đúng dòng của chính mình nên truy vấn này an toàn.
 */
export async function isAdminEmail(supabase: SupabaseClient, email?: string | null) {
  if (!email) return false;

  const { data } = await supabase
    .from("admin_emails")
    .select("email")
    .ilike("email", email)
    .maybeSingle();

  return Boolean(data);
}
