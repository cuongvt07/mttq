import Link from "next/link";
import Emblem from "@/components/Emblem";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "./actions";

export const metadata = { title: "Quản trị nội dung" };

const NAV = [
  { href: "/admin", label: "Tổng quan" },
  { href: "/admin/settings", label: "Cấu hình" },
  { href: "/admin/stats", label: "Số liệu" },
  { href: "/admin/media", label: "Ảnh nổi bật" },
  { href: "/admin/clusters", label: "Các cụm" },
  { href: "/admin/books", label: "Sách lật" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Trang đăng nhập tự dựng giao diện riêng.
  if (!user) return <div className="min-h-screen bg-slate-100">{children}</div>;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-30 bg-brand-deep text-sky-50 shadow-md">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-1 px-5 py-2">
          <Emblem className="mr-2 size-7" />
          <span className="mr-3 font-extrabold">Quản trị nội dung</span>

          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2.5 py-1.5 text-sm font-semibold text-sky-100 transition-colors hover:bg-brand hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/"
            target="_blank"
            className="rounded-md px-2.5 py-1.5 text-sm font-semibold text-sky-100 transition-colors hover:bg-brand hover:text-white"
          >
            Xem site ↗
          </Link>

          <div className="ml-auto flex items-center gap-2.5 text-xs text-sky-200">
            <span className="hidden sm:inline">{user.email}</span>
            <form action={signOut}>
              <button type="submit" className="adm-btn adm-btn-sm adm-btn-ghost">
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1100px] px-5 pt-6 pb-16">{children}</div>
    </div>
  );
}
