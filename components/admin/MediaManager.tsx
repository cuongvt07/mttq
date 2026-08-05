import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import FlipbookField from "@/components/admin/FlipbookField";
import ImageField from "@/components/admin/ImageField";
import type { MediaItem } from "@/lib/types";
import { createMedia, deleteMedia, updateMedia } from "@/app/admin/actions";

/** Khối ảnh "Hoạt động chung" dưới banner. */
export default function MediaManager({
  media,
  books,
}: {
  media: MediaItem[];
  books: { id: string; title: string; slug: string }[];
}) {
  const nextOrder = (media.at(-1)?.sort_order ?? 0) + 1;

  return (
    <>
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {media.map((m) => (
          <form key={m.id} action={updateMedia} className="rounded-xl border border-slate-200 bg-white p-4">
            <input type="hidden" name="id" value={m.id} />
            <ImageField
              name="image_url"
              defaultValue={m.image_url}
              label="Ảnh"
              aspect={m.orientation === "portrait" ? "3 / 4" : "16 / 10"}
            />
            <label className="adm-field">
              <span>Chú thích</span>
              <textarea name="caption" defaultValue={m.caption} className="adm-input min-h-20" />
            </label>
            <label className="adm-field">
              <span>Liên kết (tuỳ chọn)</span>
              <input type="text" name="link_url" defaultValue={m.link_url ?? ""} placeholder="https://…" className="adm-input" />
            </label>
            <FlipbookField defaultValue={m.flipbook_url} books={books} />
            <div className="grid gap-x-4 sm:grid-cols-2">
              <label className="adm-field">
                <span>Khung ảnh</span>
                <select name="orientation" defaultValue={m.orientation} className="adm-input">
                  <option value="landscape">Ngang</option>
                  <option value="portrait">Dọc</option>
                </select>
              </label>
              <label className="adm-field">
                <span>Thứ tự</span>
                <input type="number" name="sort_order" defaultValue={m.sort_order} className="adm-input" />
              </label>
            </div>
            <label className="adm-field">
              <span className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" name="is_visible" defaultChecked={m.is_visible} className="size-4" />
                Hiển thị
              </span>
            </label>
            <div className="flex flex-wrap items-center gap-2.5">
              <button type="submit" className="adm-btn adm-btn-sm">
                Lưu
              </button>
              <ConfirmSubmit message="Xoá mục này?" formAction={deleteMedia}>
                Xoá
              </ConfirmSubmit>
            </div>
          </form>
        ))}
      </div>

      <div className="adm-panel mt-5">
        <h2 className="mb-3 font-bold">Thêm ảnh nổi bật</h2>
        <form action={createMedia}>
          <ImageField name="image_url" label="Ảnh" aspect="16 / 10" />
          <label className="adm-field">
            <span>Chú thích</span>
            <textarea name="caption" className="adm-input min-h-20" />
          </label>
          <label className="adm-field">
            <span>Liên kết (tuỳ chọn)</span>
            <input type="text" name="link_url" placeholder="https://…" className="adm-input" />
          </label>
          <FlipbookField books={books} />
          <div className="grid gap-x-4 sm:grid-cols-2">
            <label className="adm-field">
              <span>Khung ảnh</span>
              <select name="orientation" defaultValue="landscape" className="adm-input">
                <option value="landscape">Ngang</option>
                <option value="portrait">Dọc</option>
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
