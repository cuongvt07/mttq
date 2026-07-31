"use client";

import { useState } from "react";

/**
 * Ô nhập flip-book: chọn nhanh một cuốn sách tự thiết kế (/sach/<slug>)
 * hoặc dán link ngoài (Heyzine…).
 */
export default function FlipbookField({
  defaultValue,
  books,
}: {
  defaultValue?: string | null;
  books: { id: string; title: string; slug: string }[];
}) {
  const [value, setValue] = useState(defaultValue ?? "");

  return (
    <div className="adm-field">
      <span>Flip-book — bấm vào thẻ sẽ mở ngay trong trang</span>

      {books.length ? (
        <select
          value={books.some((b) => value === `/sach/${b.slug}`) ? value : ""}
          onChange={(e) => setValue(e.target.value)}
          className="adm-input mb-2"
        >
          <option value="">— Chọn sách đã thiết kế —</option>
          {books.map((b) => (
            <option key={b.id} value={`/sach/${b.slug}`}>
              {b.title}
            </option>
          ))}
        </select>
      ) : null}

      <input
        type="text"
        name="flipbook_url"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="/sach/ban-tin… hoặc https://heyzine.com/flip-book/xxxx.html"
        className="adm-input"
      />
    </div>
  );
}
