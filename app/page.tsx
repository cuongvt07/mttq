import type { Metadata } from "next";
import ClusterSection from "@/components/ClusterSection";
import FeaturedSection from "@/components/FeaturedSection";
import Reveal from "@/components/Reveal";
import TopNav from "@/components/TopNav";
import { getSiteData } from "@/lib/queries";

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getSiteData();
  return { title: settings.site_title, description: settings.hero_subtitle };
}

export default async function Home() {
  const { settings, stats, clusters, media, usingFallback } = await getSiteData();

  const navItems = [
    { href: "#top", label: "Trang chủ" },
    ...(media.length ? [{ href: "#featured", label: "Giới thiệu" }] : []),
    ...clusters.map((c, i) => ({ href: `#${c.slug}`, label: c.nav_label || `Cụm ${i + 1}` })),
  ];

  return (
    <>
      <Reveal />

      {usingFallback ? (
        <div className="bg-amber-100 px-4 py-2 text-center text-xs font-semibold text-amber-900">
          Đang hiển thị dữ liệu mẫu — hãy chạy <code>supabase/schema.sql</code> và{" "}
          <code>supabase/seed.sql</code> trong Supabase để bật chế độ quản trị.
        </div>
      ) : null}

      <TopNav
        brandName={settings.brand_name}
        brandLogoUrl={settings.brand_logo_url}
        items={navItems}
      />

      <section
        id="top"
        className="relative overflow-hidden bg-linear-to-b from-sky-top via-[#5cb9ea] to-sky-bottom pt-7"
      >
        <div className="relative z-10 px-5 text-center text-navy">
          <h1
            data-reveal
            className="mx-auto max-w-[34ch] text-lg font-black tracking-tight text-shadow-sm sm:text-2xl"
          >
            {settings.hero_title}
          </h1>
          {settings.hero_subtitle ? (
            <p
              data-reveal
              style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
              className="mt-3 inline-block rounded-full bg-[#0f66b6] px-4 py-1.5 text-[0.72rem] font-bold text-white shadow-md sm:text-sm"
            >
              {settings.hero_subtitle}
            </p>
          ) : null}
        </div>

        <img
          src={settings.hero_image_url || "/brand/hero-city.webp"}
          alt=""
          data-reveal
          style={{ "--reveal-delay": "200ms" } as React.CSSProperties}
          className="mt-2 w-full object-cover"
        />

        {stats.length ? (
          <div className="mx-auto max-w-[1440px] px-5">
            <div className="-mt-10 flex flex-wrap items-stretch justify-center gap-4 pb-6 sm:-mt-12">
              {stats.map((s, i) => (
                <div
                  key={s.id}
                  data-reveal="pop"
                  style={{ "--reveal-delay": `${280 + i * 110}ms` } as React.CSSProperties}
                  className={`min-w-[9.5rem] rounded-2xl border border-white/25 px-5 py-3.5 text-center text-white shadow-stat transition-transform duration-200 hover:-translate-y-1 sm:min-w-[12.5rem] ${
                    s.variant === "big"
                      ? "bg-linear-to-b from-amber-400 to-orange-500"
                      : "bg-linear-to-b from-[#2f86d8] to-[#1462ad]"
                  }`}
                >
                  <div
                    className={`font-black tabular-nums drop-shadow-sm ${
                      s.variant === "big" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
                    }`}
                  >
                    {s.value}
                  </div>
                  <div className="mt-1.5 text-[0.7rem] font-bold tracking-wide uppercase opacity-95">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <FeaturedSection settings={settings} media={media} />

      <main>
        {clusters.map((cluster, i) => (
          <ClusterSection key={cluster.id} cluster={cluster} index={i} />
        ))}
      </main>

      <footer className="bg-[#0b2a47] px-5 py-7 text-center text-sm text-sky-200">
        <b className="text-white">{settings.footer_title}</b>
        <br />
        {settings.footer_note}
        <br />
        <a href="/admin" className="mt-2.5 inline-block text-xs opacity-60 hover:opacity-100">
          Quản trị nội dung
        </a>
      </footer>
    </>
  );
}
