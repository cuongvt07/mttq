import Link from "next/link";
import { notFound } from "next/navigation";
import BookEditor from "@/components/book/BookEditor";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import CopyLinkButton from "@/components/admin/CopyLinkButton";
import { getBook } from "@/lib/book-queries";
import { PAGE_RATIOS } from "@/lib/book-types";
import { deleteBook, duplicateBook, updateBookMeta } from "../actions";

export const dynamic = "force-dynamic";

export default async function BookEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) notFound();

  return (
    <>
      {/* data-wide: bảo layout admin nới khung rộng ra cho trang thiết kế */}
      <div data-wide className="mb-3 flex flex-wrap items-center gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold">{book.title}</h1>
          <p className="text-sm text-slate-500">
            <Link href="/admin/books" className="text-brand hover:underline">
              ← Danh sách sách
            </Link>{" "}
            · {book.pages.length} trang ·{" "}
            <Link href={`/sach/${book.slug}`} target="_blank" className="text-brand hover:underline">
              /sach/{book.slug} ↗
            </Link>
          </p>
        </div>
        <div className="ml-auto">
          <CopyLinkButton path={`/sach/${book.slug}`} label="Chép link sách" />
        </div>
      </div>

      <BookEditor book={book} />

      <details className="adm-panel mt-6">
        <summary className="cursor-pointer font-bold">Thông tin sách</summary>
        <form action={updateBookMeta} className="mt-3">
          <input type="hidden" name="id" value={book.id} />
          <div className="grid gap-x-4 sm:grid-cols-2">
            <label className="adm-field">
              <span>Tên sách</span>
              <input type="text" name="title" defaultValue={book.title} required className="adm-input" />
            </label>
            <label className="adm-field">
              <span>Đường dẫn công khai (tự sinh theo tên)</span>
              <span className="flex h-10 items-center rounded-lg bg-slate-100 px-3 font-mono text-sm text-slate-500">
                /sach/{book.slug}
              </span>
              <span className="mt-1 block text-[0.72rem] font-normal tracking-normal text-slate-400 normal-case">
                Đổi tên sách thì đường dẫn tự đổi theo; trùng với sách khác sẽ tự thêm -2, -3…
                <b className="text-amber-700"> Link cũ sẽ không còn dùng được.</b>
              </span>
            </label>
          </div>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <label className="adm-field">
              <span>Tỉ lệ trang</span>
              <select name="page_ratio" defaultValue={book.page_ratio} className="adm-input">
                {Object.keys(PAGE_RATIOS).map((r) => (
                  <option key={r} value={r}>
                    {r === "a4" ? "A4 (210×297)" : r}
                  </option>
                ))}
              </select>
            </label>
            <label className="adm-field">
              <span>Ảnh bìa (URL, hiện ở danh sách)</span>
              <input type="text" name="cover_url" defaultValue={book.cover_url ?? ""} className="adm-input" />
            </label>
          </div>
          <label className="adm-field">
            <span className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="is_published" defaultChecked={book.is_published} className="size-4" />
              Cho phép xem công khai
            </span>
          </label>
          <div className="flex flex-wrap gap-2.5">
            <button type="submit" className="adm-btn">
              Lưu thông tin
            </button>
            <button type="submit" formAction={duplicateBook} className="adm-btn adm-btn-ghost">
              Nhân bản sách này
            </button>
            <ConfirmSubmit
              message={`Xoá sách "${book.title}" và toàn bộ trang?`}
              formAction={deleteBook}
              className="adm-btn adm-btn-danger"
            >
              Xoá sách
            </ConfirmSubmit>
          </div>
        </form>
      </details>
    </>
  );
}
