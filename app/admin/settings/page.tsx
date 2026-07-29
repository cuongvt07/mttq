import ImageField from "@/components/admin/ImageField";
import { getSettingsForAdmin } from "@/lib/queries";
import { updateSettings } from "../actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const s = await getSettingsForAdmin();

  return (
    <>
      <h1 className="text-xl font-bold">Cấu hình chung</h1>
      <p className="mt-1 mb-5 text-sm text-slate-500">
        Nội dung phần đầu trang, banner, khối nổi bật và chân trang.
      </p>

      <form action={updateSettings}>
        <div className="adm-panel">
          <h2 className="mb-3 font-bold">Thanh điều hướng &amp; SEO</h2>
          <label className="adm-field">
            <span>Tiêu đề trang (thẻ title)</span>
            <input type="text" name="site_title" defaultValue={s.site_title} required className="adm-input" />
          </label>
          <label className="adm-field">
            <span>Tên đơn vị trên thanh menu</span>
            <input type="text" name="brand_name" defaultValue={s.brand_name} required className="adm-input" />
          </label>
          <ImageField
            name="brand_logo_url"
            defaultValue={s.brand_logo_url}
            label="Logo (để trống dùng con dấu Mặt trận Tổ quốc)"
            aspect="1 / 1"
          />
        </div>

        <div className="adm-panel">
          <h2 className="mb-3 font-bold">Banner đầu trang</h2>
          <label className="adm-field">
            <span>Tiêu đề lớn</span>
            <textarea name="hero_title" defaultValue={s.hero_title} required className="adm-input min-h-20" />
          </label>
          <label className="adm-field">
            <span>Dòng phụ</span>
            <input type="text" name="hero_subtitle" defaultValue={s.hero_subtitle} className="adm-input" />
          </label>
          <ImageField
            name="hero_image_url"
            defaultValue={s.hero_image_url}
            label="Ảnh banner (trống = dùng hình minh hoạ /brand/hero-city.webp)"
            aspect="16 / 4"
          />
        </div>

        <div className="adm-panel">
          <h2 className="mb-3 font-bold">Khối nổi bật (Mặt trận Tổ quốc)</h2>
          <label className="adm-field">
            <span>Tiêu đề khối</span>
            <input type="text" name="featured_title" defaultValue={s.featured_title} className="adm-input" />
          </label>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <label className="adm-field">
              <span>Màu phủ (trên)</span>
              <input type="color" name="featured_color_from" defaultValue={s.featured_color_from} className="h-10 w-16 rounded-lg border border-slate-200 bg-white p-1" />
            </label>
            <label className="adm-field">
              <span>Màu phủ (dưới)</span>
              <input type="color" name="featured_color_to" defaultValue={s.featured_color_to} className="h-10 w-16 rounded-lg border border-slate-200 bg-white p-1" />
            </label>
          </div>
        </div>

        <div className="adm-panel">
          <h2 className="mb-3 font-bold">Chân trang</h2>
          <label className="adm-field">
            <span>Dòng đậm</span>
            <textarea name="footer_title" defaultValue={s.footer_title} className="adm-input min-h-20" />
          </label>
          <label className="adm-field">
            <span>Dòng ghi chú</span>
            <input type="text" name="footer_note" defaultValue={s.footer_note} className="adm-input" />
          </label>
        </div>

        <button type="submit" className="adm-btn">
          Lưu thay đổi
        </button>
      </form>
    </>
  );
}
