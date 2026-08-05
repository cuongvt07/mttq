"use client";

import { useState } from "react";
import type { MediaItem } from "@/lib/types";
import ImageField from "./ImageField";

type BookOption = { id: string; title: string; slug: string };

/**
 * Một mục trong khối "Hoạt động chung". Chỉ có hai kiểu, không phải nhập gì thừa:
 *  · Sách lật  → chọn cuốn, ảnh và tên tự lấy từ sách.
 *  · Tin ngoài → ảnh + tiêu đề + link.
 */
export default function MediaItemForm({
  item,
  books,
  nextOrder,
}: {
  /** không truyền = form thêm mới */
  item?: MediaItem;
  books: BookOption[];
  nextOrder?: number;
}) {
  const [kieu, setKieu] = useState<"sach" | "tin">(item?.book_id ? "sach" : "tin");
  const [bookId, setBookId] = useState(item?.book_id ?? "");

  const NHAN = "text-[0.72rem] font-bold tracking-wide text-slate-500 uppercase";

  return (
    <>
      <input type="hidden" name="book_id" value={kieu === "sach" ? bookId : ""} />

      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setKieu("sach")}
          className={kieu === "sach" ? "adm-btn adm-btn-sm" : "adm-btn adm-btn-ghost adm-btn-sm"}
        >
          📖 Sách lật
        </button>
        <button
          type="button"
          onClick={() => setKieu("tin")}
          className={kieu === "tin" ? "adm-btn adm-btn-sm" : "adm-btn adm-btn-ghost adm-btn-sm"}
        >
          📰 Tin ngoài
        </button>
      </div>

      {kieu === "sach" ? (
        <label className="adm-field">
          <span>Chọn sách — ảnh và tên lấy tự động</span>
          <select
            value={bookId}
            onChange={(e) => setBookId(e.target.value)}
            className="adm-input"
            required
          >
            <option value="">— Chọn một cuốn —</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <>
          <ImageField
            name="image_url"
            defaultValue={item?.image_url}
            label="Ảnh"
            aspect="16 / 10"
            previewMax="260px"
          />
          <label className="adm-field">
            <span>Tiêu đề</span>
            <input
              type="text"
              name="caption"
              defaultValue={item?.caption}
              placeholder="Tên bài viết"
              className="adm-input"
            />
          </label>
          <label className="adm-field">
            <span>Link bài viết</span>
            <input
              type="text"
              name="link_url"
              defaultValue={item?.link_url ?? ""}
              placeholder="https://hanoimoi.vn/…"
              className="adm-input"
            />
          </label>
        </>
      )}

      <div className="flex flex-wrap items-end gap-4">
        <label className="adm-field mb-0">
          <span className={NHAN}>Thứ tự</span>
          <input
            type="number"
            name="sort_order"
            defaultValue={item?.sort_order ?? nextOrder ?? 1}
            className="adm-input w-24"
          />
        </label>
        {item ? (
          <label className="mb-2 flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              name="is_visible"
              defaultChecked={item.is_visible}
              className="size-4"
            />
            Hiển thị
          </label>
        ) : null}
      </div>
    </>
  );
}
