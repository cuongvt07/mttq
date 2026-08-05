"use client";

import { PAGE_TEMPLATES, type PageTemplate } from "@/lib/page-templates";

/**
 * Chọn nền trang bằng cách bấm vào mẫu có sẵn — không phải tự nhập màu
 * hay đường dẫn ảnh.
 */
export default function BackgroundPicker({
  current,
  onPick,
  onPickAll,
}: {
  /** ảnh nền đang dùng của trang hiện tại */
  current: string | null;
  onPick: (t: PageTemplate) => void;
  onPickAll: (t: PageTemplate) => void;
}) {
  const dangChon = (t: PageTemplate) => (t.image ?? null) === (current ?? null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PAGE_TEMPLATES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onPick(t)}
          title={`Dùng nền "${t.ten}" cho trang này`}
          className={`w-[74px] shrink-0 cursor-pointer rounded-lg border-2 p-1 text-center transition ${
            dangChon(t) ? "border-brand bg-sky-50" : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <span
            className="block h-[62px] w-full rounded bg-cover bg-center"
            style={{
              background: t.background,
              backgroundImage: t.image ? `url('${t.image}')` : undefined,
              backgroundSize: "cover",
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,.08)",
            }}
          />
          <span className="mt-1 block text-[0.65rem] leading-tight font-semibold text-slate-600">
            {t.ten}
          </span>
        </button>
      ))}

      <button
        type="button"
        onClick={() => {
          const t = PAGE_TEMPLATES.find(dangChon) ?? PAGE_TEMPLATES[0];
          if (window.confirm(`Dùng nền "${t.ten}" cho TẤT CẢ các trang?`)) onPickAll(t);
        }}
        className="adm-btn adm-btn-ghost adm-btn-sm"
        title="Áp nền của trang hiện tại cho mọi trang trong sách"
      >
        Áp cho mọi trang
      </button>
    </div>
  );
}
