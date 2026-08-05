"use client";

import { useState } from "react";
import { EMBLEM } from "@/lib/theme";
import type { SiteSettings, Stat } from "@/lib/types";
import { updateSettings } from "@/app/admin/actions";
import ImageField from "./ImageField";

/**
 * Cấu hình chung: form gọn bên trái, khung xem trước sống bên phải.
 * Gõ tới đâu thấy tới đó nên không phải hình dung trong đầu.
 */
export default function SettingsForm({
  settings,
  stats,
}: {
  settings: SiteSettings;
  stats: Stat[];
}) {
  const [s, setS] = useState(settings);
  const set = (patch: Partial<SiteSettings>) => setS((prev) => ({ ...prev, ...patch }));

  const O = "flex flex-col gap-1.5";
  const NHAN = "text-[0.72rem] font-bold tracking-wide text-slate-500 uppercase";

  return (
    <form action={updateSettings} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* --------------------------------------------------------------- form */}
      <div className="space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <b className="mb-3 block">1. Đơn vị</b>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={O}>
              <span className={NHAN}>Tên đơn vị trên thanh menu</span>
              <input
                type="text"
                name="brand_name"
                required
                value={s.brand_name}
                onChange={(e) => set({ brand_name: e.target.value })}
                className="adm-input"
              />
            </label>
            <label className={O}>
              <span className={NHAN}>Tiêu đề trang (thẻ title)</span>
              <input
                type="text"
                name="site_title"
                required
                value={s.site_title}
                onChange={(e) => set({ site_title: e.target.value })}
                className="adm-input"
              />
            </label>
          </div>
          <div className="mt-3">
            <ImageField
              name="brand_logo_url"
              defaultValue={s.brand_logo_url}
              label="Logo (để trống dùng con dấu Mặt trận Tổ quốc)"
              aspect="1 / 1"
              previewMax="120px"
            />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <b className="mb-3 block">2. Banner đầu trang</b>
          <label className={`${O} mb-3`}>
            <span className={NHAN}>Tiêu đề lớn</span>
            <textarea
              name="hero_title"
              required
              value={s.hero_title}
              onChange={(e) => set({ hero_title: e.target.value })}
              className="adm-input min-h-20"
            />
          </label>
          <label className={`${O} mb-3`}>
            <span className={NHAN}>Dòng phụ</span>
            <input
              type="text"
              name="hero_subtitle"
              value={s.hero_subtitle}
              onChange={(e) => set({ hero_subtitle: e.target.value })}
              className="adm-input"
            />
          </label>
          <ImageField
            name="hero_image_url"
            defaultValue={s.hero_image_url}
            label="Ảnh banner (trống = hình minh hoạ mặc định)"
            aspect="16 / 4"
            previewMax="420px"
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <b className="mb-3 block">3. Khối “Hoạt động chung” &amp; chân trang</b>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={O}>
              <span className={NHAN}>Tiêu đề khối</span>
              <input
                type="text"
                name="featured_title"
                value={s.featured_title}
                onChange={(e) => set({ featured_title: e.target.value })}
                className="adm-input"
              />
            </label>
            <div className="flex gap-3">
              <label className={O}>
                <span className={NHAN}>Màu phủ trên</span>
                <input
                  type="color"
                  name="featured_color_from"
                  value={s.featured_color_from}
                  onChange={(e) => set({ featured_color_from: e.target.value })}
                  className="h-10 w-16 rounded-lg border border-slate-200 bg-white p-1"
                />
              </label>
              <label className={O}>
                <span className={NHAN}>Màu phủ dưới</span>
                <input
                  type="color"
                  name="featured_color_to"
                  value={s.featured_color_to}
                  onChange={(e) => set({ featured_color_to: e.target.value })}
                  className="h-10 w-16 rounded-lg border border-slate-200 bg-white p-1"
                />
              </label>
            </div>
          </div>

          <label className={`${O} mt-3`}>
            <span className={NHAN}>Chân trang — dòng đậm</span>
            <textarea
              name="footer_title"
              value={s.footer_title}
              onChange={(e) => set({ footer_title: e.target.value })}
              className="adm-input min-h-16"
            />
          </label>
          <label className={`${O} mt-3`}>
            <span className={NHAN}>Chân trang — dòng ghi chú</span>
            <input
              type="text"
              name="footer_note"
              value={s.footer_note}
              onChange={(e) => set({ footer_note: e.target.value })}
              className="adm-input"
            />
          </label>
        </section>

        <button type="submit" className="adm-btn w-full">
          Lưu thay đổi
        </button>
      </div>

      {/* ----------------------------------------------------------- xem trước */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <b className="mb-2 block text-sm">Xem trước trang chủ</b>

        <div className="overflow-hidden rounded-xl border-2 border-slate-200 bg-white shadow-sm">
          {/* thanh menu */}
          <div className="flex items-center gap-2 bg-brand-deep px-2.5 py-2 text-[0.6rem] font-bold text-sky-50">
            <img src={s.brand_logo_url || EMBLEM} alt="" className="size-5 object-contain" />
            <span className="truncate uppercase">{s.brand_name}</span>
          </div>

          {/* banner */}
          <div className="relative bg-linear-to-b from-sky-top via-[#5cb9ea] to-sky-bottom px-3 pt-3">
            <p className="text-center text-[0.62rem] leading-snug font-black whitespace-pre-line text-navy">
              {s.hero_title}
            </p>
            {s.hero_subtitle ? (
              <p className="mx-auto mt-1.5 w-fit rounded-full bg-[#0f66b6] px-2 py-0.5 text-center text-[0.5rem] font-bold text-white">
                {s.hero_subtitle}
              </p>
            ) : null}

            <img
              src={s.hero_image_url || "/brand/hero-city.webp"}
              alt=""
              className="mt-2 w-full object-cover"
            />

            {stats.length ? (
              <div className="relative -mt-4 flex justify-center gap-1.5 pb-3">
                {stats.slice(0, 3).map((st) => (
                  <div
                    key={st.id}
                    className={`rounded-md px-1.5 py-1 text-center text-white ${
                      st.variant === "big"
                        ? "bg-linear-to-b from-amber-400 to-orange-500"
                        : "bg-linear-to-b from-[#2f86d8] to-[#1462ad]"
                    }`}
                  >
                    <div className="text-[0.6rem] font-black tabular-nums">{st.value}</div>
                    <div className="text-[0.4rem] leading-tight font-bold uppercase opacity-95">
                      {st.label.slice(0, 26)}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* khối hoạt động chung */}
          <div
            className="px-3 py-3"
            style={{
              background: `linear-gradient(180deg, ${s.featured_color_from}, ${s.featured_color_to})`,
            }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-1 text-[0.55rem] font-black text-brand-dark uppercase">
              <img src={EMBLEM} alt="" className="size-3 object-contain" />
              {s.featured_title}
            </span>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="aspect-16/10 rounded bg-white/80" />
              ))}
            </div>
          </div>

          {/* chân trang */}
          <div className="bg-[#0b2a47] px-3 py-2.5 text-center">
            <b className="block text-[0.55rem] leading-snug text-white">{s.footer_title}</b>
            <span className="text-[0.5rem] text-sky-200">{s.footer_note}</span>
          </div>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Khung này chỉ để hình dung bố cục — trang thật rộng hơn và có đủ các khối bên dưới.
        </p>
      </aside>
    </form>
  );
}
