"use client";

import { useEffect, useState } from "react";

/**
 * Thông báo nhỏ hiện ở góc dưới sau mỗi thao tác.
 *
 * Dùng ở bất kỳ đâu (kể cả ngoài React):  toast("Đã xoá khối", "ok")
 * Chỉ cần <ToastHost /> mount một lần trong layout admin.
 */

export type ToastKind = "ok" | "info" | "error";

type Item = { id: number; text: string; kind: ToastKind };

const SU_KIEN = "admin-toast";

export function toast(text: string, kind: ToastKind = "ok") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SU_KIEN, { detail: { text, kind } }));
}

const MAU: Record<ToastKind, string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
  error: "border-red-200 bg-red-50 text-red-800",
};

const ICON: Record<ToastKind, string> = { ok: "✓", info: "ℹ", error: "!" };

export default function ToastHost() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let dem = 0;
    const nhan = (e: Event) => {
      const { text, kind } = (e as CustomEvent<{ text: string; kind: ToastKind }>).detail;
      const id = ++dem;
      setItems((prev) => [...prev.slice(-2), { id, text, kind }]);
      setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 2600);
    };
    window.addEventListener(SU_KIEN, nhan);
    return () => window.removeEventListener(SU_KIEN, nhan);
  }, []);

  if (!items.length) return null;

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${MAU[t.kind]}`}
        >
          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-white/70 text-xs">
            {ICON[t.kind]}
          </span>
          {t.text}
        </div>
      ))}
    </div>
  );
}
