"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Bọc một thẻ tin: bấm vào sẽ mở flip-book (Heyzine…) ngay trong trang.
 * Vẫn render thẻ <a href> thật để mở tab mới / SEO / khi tắt JS vẫn dùng được.
 *
 * Modal đưa ra document.body bằng portal để không bị thanh menu (sticky) đè lên.
 */
export default function FlipbookCard({
  url,
  title,
  className,
  children,
  style,
}: {
  url: string;
  title: string;
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-9999 flex flex-col bg-black/85 p-2 backdrop-blur-sm sm:p-4"
      onClick={() => setOpen(false)}
    >
      <div className="mb-2 flex items-center gap-3 px-1 text-white">
        <b className="truncate text-sm sm:text-base">{title}</b>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="ml-auto shrink-0 rounded-md bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25"
        >
          Mở tab mới ↗
        </a>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Đóng"
          className="shrink-0 cursor-pointer rounded-md bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25"
        >
          ✕ Đóng
        </button>
      </div>

      <iframe
        src={url}
        title={title}
        allowFullScreen
        onClick={(e) => e.stopPropagation()}
        className="min-h-0 w-full flex-1 rounded-lg border-0 bg-white shadow-2xl"
      />
    </div>
  );

  return (
    <>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        data-reveal=""
        className={className}
        style={style}
        onClick={(e) => {
          // giữ Ctrl/Cmd/chuột giữa để mở tab mới như bình thường
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          e.preventDefault();
          setOpen(true);
        }}
      >
        {children}
      </a>

      {open && mounted ? createPortal(modal, document.body) : null}
    </>
  );
}
