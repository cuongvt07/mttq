import Emblem from "./Emblem";

/**
 * Khung chung của một khối màu: ảnh nền + viên tiêu đề + nút về đầu trang.
 */
export default function SectionShell({
  id,
  title,
  background,
  gradientFrom,
  gradientTo,
  children,
}: {
  id: string;
  title: string;
  /** ảnh nền cào từ site gốc; không có thì dùng gradient màu của cụm */
  background?: string;
  gradientFrom: string;
  gradientTo: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="relative isolate scroll-mt-14 bg-cover bg-center py-9"
      style={{
        backgroundImage: background
          ? `url('${background}')`
          : `linear-gradient(180deg, ${gradientFrom}, ${gradientTo})`,
      }}
    >
      {/* phủ nhẹ màu của cụm để chữ luôn nổi trên mọi ảnh nền */}
      {background ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 opacity-25"
          style={{ background: `linear-gradient(180deg, ${gradientFrom}, ${gradientTo})` }}
        />
      ) : null}

      <div className="relative mx-auto max-w-[1440px] px-5">
        <h2
          data-reveal="slide"
          className="mb-5 inline-flex items-center gap-2.5 rounded-full bg-white py-2 pr-6 pl-3 text-sm font-black tracking-wide text-brand-dark uppercase shadow-lg sm:text-base"
        >
          <Emblem className="size-7" />
          {title}
        </h2>

        {children}

        <div className="mt-4 flex justify-end" data-reveal>
          <a
            href="#top"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1f7ad6] px-4 py-2 text-xs
                       font-extrabold tracking-wide text-white uppercase shadow-md transition-colors
                       hover:bg-brand-dark"
          >
            ▲ Trang chủ
          </a>
        </div>
      </div>
    </section>
  );
}
