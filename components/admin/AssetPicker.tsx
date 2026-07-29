"use client";

import { useMemo, useState } from "react";
import canva from "@/lib/canva-assets.json";

type Asset = { id: string; path: string; width: number; height: number; uses: number };

/** Thư viện ảnh cào từ site Canva gốc (public/canva) — bấm để chọn. */
export default function AssetPicker({ onPick }: { onPick: (path: string) => void }) {
  const [open, setOpen] = useState(false);

  const assets = useMemo(() => {
    const seen = new Set<string>();
    return (canva.assets as Asset[]).filter((a) => {
      if (seen.has(a.path)) return false;
      seen.add(a.path);
      return true;
    });
  }, []);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="adm-btn adm-btn-sm adm-btn-ghost">
        Thư viện ảnh ({assets.length})
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center gap-3">
              <b className="text-sm">Ảnh từ trang gốc</b>
              <span className="text-xs text-slate-500">Bấm vào ảnh để chọn</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="adm-btn adm-btn-sm adm-btn-ghost ml-auto"
              >
                Đóng
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-5">
              {assets.map((a) => (
                <button
                  key={a.path}
                  type="button"
                  onClick={() => {
                    onPick(a.path);
                    setOpen(false);
                  }}
                  className="aspect-4/3 cursor-pointer overflow-hidden rounded-md border border-slate-200 bg-slate-100 transition hover:ring-2 hover:ring-sky-400"
                >
                  <img src={a.path} alt="" loading="lazy" className="size-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
