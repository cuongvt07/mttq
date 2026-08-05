"use client";

import type { BookElement, ImageElement, TextElement } from "@/lib/book-types";

/**
 * Thanh công cụ nổi ngay cạnh đối tượng đang chọn.
 * Chỉ để những thao tác hay dùng nhất, nút to, có chữ tiếng Việt.
 */

/** mọi nút cùng cấu trúc (.adm-btn), biến thể chỉ khác màu */
const BTN = "adm-btn adm-btn-ghost";
const BTN_ON = "adm-btn adm-btn-on";
const BTN_XOA = "adm-btn adm-btn-danger";

export default function ElementToolbar({
  el,
  onChange,
  onEditText,
  onReplaceImage,
  onDuplicate,
  onDelete,
  onLayer,
}: {
  el: BookElement;
  onChange: (patch: Partial<BookElement>) => void;
  onEditText: () => void;
  onReplaceImage: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onLayer: (dir: -1 | 1) => void;
}) {
  const laChu = el.type === "text";
  const chu = el as TextElement;
  const anh = el as ImageElement;

  const canhTiep = { left: "center", center: "right", right: "left" } as const;
  const nhanCanh = { left: "Trái", center: "Giữa", right: "Phải" } as const;

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="flex h-[60px] items-center gap-1.5 overflow-x-auto rounded-xl border-2 border-brand/30 bg-white px-2 shadow-sm"
    >
      <span className="mr-1 shrink-0 text-sm font-bold text-brand">
        {laChu ? "Khối chữ" : "Khối ảnh"}
      </span>
      {laChu ? (
        <>
          <button type="button" className={BTN} onClick={onEditText} title="Bấm để sửa nội dung chữ">
            ✏️ Sửa chữ
          </button>

          <span className="flex shrink-0 items-center overflow-hidden rounded-lg border border-slate-200">
            <button
              type="button"
              className="h-10 w-9 cursor-pointer bg-white text-slate-700 text-lg font-bold hover:bg-slate-100"
              onClick={() => onChange({ fontSize: Math.max(8, chu.fontSize - 2) })}
              title="Chữ nhỏ lại"
            >
              A−
            </button>
            <span className="grid h-10 w-10 place-items-center bg-slate-50 text-sm font-bold tabular-nums">
              {chu.fontSize}
            </span>
            <button
              type="button"
              className="h-10 w-9 cursor-pointer bg-white text-slate-700 text-lg font-bold hover:bg-slate-100"
              onClick={() => onChange({ fontSize: chu.fontSize + 2 })}
              title="Chữ to lên"
            >
              A+
            </button>
          </span>

          <button
            type="button"
            className={chu.bold ? BTN_ON : BTN}
            onClick={() => onChange({ bold: !chu.bold })}
            title="Chữ đậm"
          >
            <b>B</b>
          </button>

          <button
            type="button"
            className={BTN}
            onClick={() => onChange({ align: canhTiep[chu.align] })}
            title="Đổi căn lề"
          >
            ↔ {nhanCanh[chu.align]}
          </button>

          <label className={`${BTN} relative overflow-hidden`} title="Màu chữ">
            <span
              className="size-5 rounded border border-slate-300"
              style={{ background: chu.color }}
            />
            Màu
            <input
              type="color"
              value={chu.color}
              onChange={(e) => onChange({ color: e.target.value })}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
        </>
      ) : (
        <>
          <button type="button" className={BTN} onClick={onReplaceImage} title="Chọn ảnh khác">
            🖼️ Đổi ảnh
          </button>

          <button
            type="button"
            className={BTN}
            onClick={() => onChange({ fit: anh.fit === "cover" ? "contain" : "cover" })}
            title="Cắt vừa khung hoặc hiện trọn ảnh"
          >
            {anh.fit === "cover" ? "Cắt vừa khung" : "Hiện trọn ảnh"}
          </button>

          <span className="flex shrink-0 items-center overflow-hidden rounded-lg border border-slate-200">
            <button
              type="button"
              className="h-10 w-9 cursor-pointer bg-white text-slate-700 font-bold hover:bg-slate-100"
              onClick={() => onChange({ radius: Math.max(0, anh.radius - 4) })}
              title="Bớt bo góc"
            >
              −
            </button>
            <span className="grid h-10 place-items-center bg-slate-50 px-2 text-xs font-semibold">
              bo {anh.radius}
            </span>
            <button
              type="button"
              className="h-10 w-9 cursor-pointer bg-white text-slate-700 font-bold hover:bg-slate-100"
              onClick={() => onChange({ radius: anh.radius + 4 })}
              title="Bo góc nhiều hơn"
            >
              +
            </button>
          </span>
        </>
      )}

      <span className="mx-0.5 h-7 w-px bg-slate-200" />

      <button type="button" className={BTN} onClick={() => onLayer(1)} title="Đưa lên trên">
        ⬆
      </button>
      <button type="button" className={BTN} onClick={() => onLayer(-1)} title="Đưa xuống dưới">
        ⬇
      </button>
      <button type="button" className={BTN} onClick={onDuplicate} title="Tạo bản sao">
        ⧉
      </button>
      <button
        type="button"
        className={BTN_XOA}
        onClick={onDelete}
        title="Xoá khối này"
      >
        🗑
      </button>
    </div>
  );
}
