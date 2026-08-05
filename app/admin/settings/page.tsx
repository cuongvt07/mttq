import MediaManager from "@/components/admin/MediaManager";
import SettingsForm from "@/components/admin/SettingsForm";
import StatsManager from "@/components/admin/StatsManager";
import { getBookOptions } from "@/lib/book-queries";
import { getMediaForAdmin, getSettingsForAdmin, getStatsForAdmin } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** Ba phần của trang chủ gom về một chỗ: cấu hình, số liệu, ảnh nổi bật. */
export default async function TrangChuPage() {
  const [settings, stats, media, books] = await Promise.all([
    getSettingsForAdmin(),
    getStatsForAdmin(),
    getMediaForAdmin(),
    getBookOptions(),
  ]);

  const MUC = "scroll-mt-24 border-t border-slate-200 pt-7 mt-8";

  return (
    <>
      <h1 className="text-xl font-bold">Trang chủ</h1>
      <p className="mt-1 mb-4 text-sm text-slate-500">
        Sửa bên trái, khung bên phải hiện ngay kết quả. Kéo xuống để chỉnh số liệu và ảnh nổi bật.
      </p>

      <nav className="mb-6 flex flex-wrap gap-2">
        <a href="#cau-hinh" className="adm-btn adm-btn-ghost adm-btn-sm">
          1. Cấu hình
        </a>
        <a href="#so-lieu" className="adm-btn adm-btn-ghost adm-btn-sm">
          2. Số liệu ({stats.length})
        </a>
        <a href="#anh-noi-bat" className="adm-btn adm-btn-ghost adm-btn-sm">
          3. Ảnh nổi bật ({media.length})
        </a>
      </nav>

      <section id="cau-hinh" className="scroll-mt-24">
        <SettingsForm settings={settings} stats={stats.filter((s) => s.is_visible)} />
      </section>

      <section id="so-lieu" className={MUC}>
        <h2 className="mb-1 text-lg font-bold">Số liệu trên banner</h2>
        <p className="mb-4 text-sm text-slate-500">
          Kiểu &ldquo;Nổi bật&rdquo; là ô màu cam lớn ở giữa.
        </p>
        <StatsManager stats={stats} />
      </section>

      <section id="anh-noi-bat" className={MUC}>
        <h2 className="mb-1 text-lg font-bold">Ảnh nổi bật</h2>
        <p className="mb-4 text-sm text-slate-500">Khối ảnh ngay dưới banner trang chủ.</p>
        <MediaManager media={media} books={books} />
      </section>
    </>
  );
}
