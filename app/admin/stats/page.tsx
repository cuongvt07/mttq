import { redirect } from "next/navigation";

/** Đã gộp vào trang "Trang chủ" — giữ đường dẫn cũ để không gãy bookmark. */
export default function StatsRedirect() {
  redirect("/admin/settings#so-lieu");
}
