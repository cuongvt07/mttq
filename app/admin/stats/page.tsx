import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { getStatsForAdmin } from "@/lib/queries";
import { createStat, deleteStat, updateStat } from "../actions";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const stats = await getStatsForAdmin();
  const nextOrder = (stats.at(-1)?.sort_order ?? 0) + 1;

  return (
    <>
      <h1 className="text-xl font-bold">Số liệu trên banner</h1>
      <p className="mt-1 mb-5 text-sm text-slate-500">
        Kiểu &ldquo;Nổi bật&rdquo; là ô màu cam lớn ở giữa.
      </p>

      <div className="grid gap-3">
        {stats.map((s) => (
          <form key={s.id} action={updateStat} className="rounded-xl border border-slate-200 bg-white p-4">
            <input type="hidden" name="id" value={s.id} />
            <div className="grid gap-x-4 sm:grid-cols-2">
              <label className="adm-field">
                <span>Con số</span>
                <input type="text" name="value" defaultValue={s.value} required className="adm-input" />
              </label>
              <label className="adm-field">
                <span>Nhãn</span>
                <input type="text" name="label" defaultValue={s.label} required className="adm-input" />
              </label>
            </div>
            <div className="grid gap-x-4 sm:grid-cols-3">
              <label className="adm-field">
                <span>Kiểu</span>
                <select name="variant" defaultValue={s.variant} className="adm-input">
                  <option value="default">Thường (xanh)</option>
                  <option value="big">Nổi bật (cam, to)</option>
                </select>
              </label>
              <label className="adm-field">
                <span>Thứ tự</span>
                <input type="number" name="sort_order" defaultValue={s.sort_order} className="adm-input" />
              </label>
              <label className="adm-field">
                <span>Hiển thị</span>
                <span className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" name="is_visible" defaultChecked={s.is_visible} className="size-4" />
                  Hiện trên trang chủ
                </span>
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button type="submit" className="adm-btn adm-btn-sm">
                Lưu
              </button>
              <ConfirmSubmit message={`Xoá ô số liệu "${s.label}"?`} formAction={deleteStat}>
                Xoá
              </ConfirmSubmit>
            </div>
          </form>
        ))}
      </div>

      <div className="adm-panel mt-5">
        <h2 className="mb-3 font-bold">Thêm ô số liệu</h2>
        <form action={createStat}>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <label className="adm-field">
              <span>Con số</span>
              <input type="text" name="value" required placeholder="1.075.590" className="adm-input" />
            </label>
            <label className="adm-field">
              <span>Nhãn</span>
              <input type="text" name="label" required placeholder="Người dân tham gia hưởng ứng" className="adm-input" />
            </label>
          </div>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <label className="adm-field">
              <span>Kiểu</span>
              <select name="variant" defaultValue="default" className="adm-input">
                <option value="default">Thường (xanh)</option>
                <option value="big">Nổi bật (cam, to)</option>
              </select>
            </label>
            <label className="adm-field">
              <span>Thứ tự</span>
              <input type="number" name="sort_order" defaultValue={nextOrder} className="adm-input" />
            </label>
          </div>
          <button type="submit" className="adm-btn">
            Thêm
          </button>
        </form>
      </div>
    </>
  );
}
