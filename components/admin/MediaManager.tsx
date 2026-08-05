import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import MediaItemForm from "@/components/admin/MediaItemForm";
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
          <form
            key={m.id}
            action={updateMedia}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <input type="hidden" name="id" value={m.id} />
            <MediaItemForm item={m} books={books} />

            <div className="mt-3 flex flex-wrap items-center gap-2.5">
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
        <h3 className="mb-3 font-bold">Thêm mục mới</h3>
        <form action={createMedia}>
          <MediaItemForm books={books} nextOrder={nextOrder} />
          <button type="submit" className="adm-btn mt-3">
            Thêm
          </button>
        </form>
      </div>
    </>
  );
}
