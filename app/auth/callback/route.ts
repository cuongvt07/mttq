import { NextResponse, type NextRequest } from "next/server";
import { isAdminEmail } from "@/lib/admin-auth";
import { createClient } from "@/utils/supabase/server";

/** Nơi Google trả người dùng về sau khi bấm "Cho phép". */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";
  // Người dùng bấm "Huỷ" ở màn hình Google.
  const oauthError = searchParams.get("error_description") ?? searchParams.get("error");

  const backToLogin = (message: string) =>
    NextResponse.redirect(`${origin}/admin/login?error=${encodeURIComponent(message)}`);

  if (oauthError) return backToLogin(oauthError);
  if (!code) return backToLogin("Thiếu mã xác thực từ Google.");

  const supabase = await createClient();

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return backToLogin(error.message);

  if (!(await isAdminEmail(supabase, data.user.email))) {
    await supabase.auth.signOut();
    return backToLogin(
      `Tài khoản ${data.user.email ?? ""} chưa được cấp quyền quản trị.`.trim(),
    );
  }

  // next luôn là đường dẫn nội bộ — chặn open redirect.
  const target = next.startsWith("/") && !next.startsWith("//") ? next : "/admin";
  return NextResponse.redirect(`${origin}${target}`);
}
