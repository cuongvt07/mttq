import Link from "next/link";
import CopyLinkButton from "@/components/admin/CopyLinkButton";
import { getBooks } from "@/lib/book-queries";
import { PAGE_RATIOS } from "@/lib/book-types";
import { createBook, duplicateBook } from "./actions";

export const dynamic = "force-dynamic";

export default async function BooksPage() {
  const books = await getBooks();

  return (
    <>
      <h1 className="text-xl font-bold">Sách lật (flip-book)</h1>
      <p className="mt-1 mb-5 text-sm text-slate-500">
        Tự thiết kế từng trang rồi gắn vào thẻ tin. Link sách có dạng <code>/sach/&lt;slug&gt;</code>.
      </p>

      <div className="grid gap-3">
        {books.map((b) => (
          <div
            key={b.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
          >
            {b.cover_url ? (
              <img src={b.cover_url} alt="" className="h-14 w-11 shrink-0 rounded object-cover" />
            ) : (
              <div className="grid h-14 w-11 shrink-0 place-items-center rounded bg-slate-100 text-lg">
                📖
              </div>
            )}
            <div className="min-w-0">
              <b className="block truncate">{b.title}</b>
              <span className="text-xs text-slate-500">
                {b.page_count} trang · tỉ lệ {b.page_ratio} · /sach/{b.slug}
                {b.is_published ? "" : " · đang ẩn"}
              </span>
            </div>
            <div className="ml-auto flex gap-2">
              <Link href={`/sach/${b.slug}`} target="_blank" className="adm-btn adm-btn-sm adm-btn-ghost">
                Xem ↗
              </Link>
              <CopyLinkButton path={`/sach/${b.slug}`} />
              <form action={duplicateBook}>
                <input type="hidden" name="id" value={b.id} />
                <button
                  type="submit"
                  title="Tạo bản sao giữ nguyên khung để làm số mới"
                  className="adm-btn adm-btn-sm adm-btn-ghost"
                >
                  Nhân bản
                </button>
              </form>
              <Link href={`/admin/books/${b.id}`} className="adm-btn adm-btn-sm">
                Thiết kế
              </Link>
            </div>
          </div>
        ))}
        {!books.length ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            Chưa có sách nào. Tạo cuốn đầu tiên bên dưới.
          </p>
        ) : null}
      </div>

      <div className="adm-panel mt-5">
        <h2 className="mb-3 font-bold">Tạo sách mới</h2>
        <form action={createBook}>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <label className="adm-field">
              <span>Tên sách</span>
              <input
                type="text"
                name="title"
                required
                placeholder="Bản tin Mặt trận tháng 7/2026"
                className="adm-input"
              />
            </label>
            <label className="adm-field">
              <span>Tỉ lệ trang (chọn 1 lần cho cả sách)</span>
              <select name="page_ratio" defaultValue="3:4" className="adm-input">
                {Object.keys(PAGE_RATIOS).map((r) => (
                  <option key={r} value={r}>
                    {r === "a4" ? "A4 (210×297)" : r}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button type="submit" className="adm-btn">
            Tạo &amp; thiết kế
          </button>
        </form>
      </div>
    </>
  );
}
