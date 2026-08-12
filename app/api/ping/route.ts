import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * Endpoint keep-alive.
 *
 * Vercel đóng băng serverless function sau ~10-15 phút vắng request, nên
 * request kế tiếp phải chịu cold start. Supabase free tier còn pause hẳn
 * project sau 7 ngày không truy vấn. Route này được ping định kỳ để giữ ấm
 * cả hai: chạy trên lambda (không phải edge) và luôn chạm DB một lần.
 *
 * Phải là force-dynamic, nếu không Vercel trả bản static từ CDN và lambda
 * vẫn ngủ đông.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const startedAt = Date.now();
  let db: "ok" | "error" = "ok";

  try {
    const supabase = await createClient();
    // Query rẻ nhất có thể: chỉ đếm, không kéo dữ liệu về.
    const { error } = await supabase
      .from("site_settings")
      .select("id", { count: "exact", head: true });
    if (error) db = "error";
  } catch {
    // Ping không bao giờ được fail — mục đích là đánh thức, không phải health gate.
    db = "error";
  }

  return NextResponse.json(
    { ok: true, db, ms: Date.now() - startedAt, ts: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
