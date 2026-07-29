import Link from "next/link";
import {
  getClustersForAdmin,
  getMediaForAdmin,
  getStatsForAdmin,
  getUnitCounts,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

const TILE =
  "block rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-lg";

export default async function AdminHome() {
  const [clusters, stats, media, counts] = await Promise.all([
    getClustersForAdmin(),
    getStatsForAdmin(),
    getMediaForAdmin(),
    getUnitCounts(),
  ]);

  const totalUnits = Object.values(counts).reduce((a, b) => a + b, 0);

  const tiles = [
    { href: "/admin/settings", title: "Cấu hình chung", note: "Tiêu đề, banner, màu khối, chân trang" },
    { href: "/admin/stats", title: `Số liệu (${stats.length})`, note: "Các ô số liệu trên banner" },
    { href: "/admin/media", title: `Ảnh nổi bật (${media.length})`, note: "Khối dưới banner" },
    { href: "/admin/clusters", title: `Các cụm (${clusters.length})`, note: `${totalUnits} đơn vị phường/xã` },
  ];

  return (
    <>
      <h1 className="text-xl font-bold">Tổng quan</h1>
      <p className="mt-1 mb-5 text-sm text-slate-500">
        Chọn phần nội dung cần chỉnh sửa. Thay đổi hiển thị ngay trên trang chủ.
      </p>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className={TILE}>
            <b className="mb-1 block">{t.title}</b>
            <span className="text-sm text-slate-500">{t.note}</span>
          </Link>
        ))}
      </div>

      {!clusters.length ? (
        <div className="adm-panel mt-5">
          <h2 className="mb-2 font-bold">Chưa có dữ liệu</h2>
          <p className="text-sm text-slate-500">
            Mở Supabase &gt; SQL Editor và chạy <code>supabase/schema.sql</code> rồi{" "}
            <code>supabase/seed.sql</code>.
          </p>
        </div>
      ) : null}
    </>
  );
}
