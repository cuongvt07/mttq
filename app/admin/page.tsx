import Link from "next/link";
import { getBooks } from "@/lib/book-queries";
import {
  getClustersForAdmin,
  getMediaForAdmin,
  getStatsForAdmin,
  getUnitCounts,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

const THE =
  "flex items-start gap-4 rounded-2xl border-2 border-slate-200 bg-white p-5 transition " +
  "hover:-translate-y-0.5 hover:border-brand hover:shadow-lg";

export default async function AdminHome() {
  const [clusters, stats, media, counts, books] = await Promise.all([
    getClustersForAdmin(),
    getStatsForAdmin(),
    getMediaForAdmin(),
    getUnitCounts(),
    getBooks(),
  ]);

  const tongDonVi = Object.values(counts).reduce((a, b) => a + b, 0);

  const nhom = [
    {
      ten: "Sách lật (bản tin)",
      mo: "Tự thiết kế từng trang, nhân bản cho số tháng sau",
      soLieu: `${books.length} cuốn`,
      icon: "📖",
      href: "/admin/books",
      chinh: true,
    },
    {
      ten: "Các Ban Công tác Mặt trận",
      mo: "Tên ban, màu khối, ảnh và tên từng hoạt động",
      soLieu: `${clusters.length} ban · ${tongDonVi} hoạt động`,
      icon: "🏘️",
      href: "/admin/clusters",
    },
    {
      ten: "Ảnh nổi bật trang chủ",
      mo: "Khối ảnh ngay dưới banner",
      soLieu: `${media.length} ảnh`,
      icon: "🖼️",
      href: "/admin/media",
    },
    {
      ten: "Số liệu trên banner",
      mo: "Các ô số ở đầu trang chủ",
      soLieu: `${stats.length} ô`,
      icon: "🔢",
      href: "/admin/stats",
    },
    {
      ten: "Cấu hình chung",
      mo: "Tên đơn vị, tiêu đề, banner, chân trang",
      soLieu: "Thông tin site",
      icon: "⚙️",
      href: "/admin/settings",
    },
  ];

  return (
    <>
      <h1 className="text-2xl font-bold">Trang quản trị</h1>
      <p className="mt-1.5 mb-6 text-base text-slate-600">
        Chọn phần cần sửa. Mọi thay đổi hiện ngay trên trang công khai.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {nhom.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`${THE} ${n.chinh ? "md:col-span-2 border-brand/40 bg-sky-50/50" : ""}`}
          >
            <span className="text-4xl leading-none">{n.icon}</span>
            <span className="min-w-0">
              <b className="block text-lg">{n.ten}</b>
              <span className="mt-0.5 block text-[0.95rem] text-slate-600">{n.mo}</span>
              <span className="mt-1.5 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-semibold text-slate-600">
                {n.soLieu}
              </span>
            </span>
            <span className="ml-auto self-center text-2xl text-slate-300">›</span>
          </Link>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <b className="mb-2 block">Hướng dẫn nhanh</b>
        <ul className="space-y-1.5 text-[0.95rem] text-slate-600">
          <li>· Làm bản tin tháng mới: vào <b>Sách lật</b> → bấm <b>Nhân bản</b> ở cuốn cũ → sửa chữ và ảnh.</li>
          <li>· Trong trang thiết kế: bấm vào khối để hiện thanh công cụ, bấm hai lần vào chữ để gõ trực tiếp.</li>
          <li>· Kéo khối để di chuyển, kéo ô vuông xanh ở góc để đổi kích thước.</li>
          <li>· Mọi thay đổi tự lưu sau khoảng 1 giây, góc phải hiện “Đã lưu ✓”.</li>
        </ul>
      </div>
    </>
  );
}
