import { redirect } from "next/navigation";

/** Đã gộp vào trang "Trang chủ" — giữ đường dẫn cũ để không gãy bookmark. */
export default function MediaRedirect() {
  redirect("/admin/settings#anh-noi-bat");
}
