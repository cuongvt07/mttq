import { clusterBackground } from "@/lib/theme";
import SectionShell from "./SectionShell";

type Book = {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  page_count: number;
};

/** Khối "Bản tin" ngoài trang chủ: mỗi cuốn một thẻ, bấm vào mở sách lật. */
export default function BooksSection({
  books,
  background,
}: {
  books: Book[];
  background?: string;
}) {
  if (!books.length) return null;

  return (
    <SectionShell
      id="ban-tin"
      title="Bản tin Mặt trận"
      background={background ?? clusterBackground(5)}
      gradientFrom="#123c7a"
      gradientTo="#08234a"
    >
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
        {books.map((b, i) => (
          <a
            key={b.id}
            href={`/sach/${b.slug}`}
            data-reveal=""
            style={{ "--reveal-delay": `${i * 60}ms` } as React.CSSProperties}
            className="group flex flex-col overflow-hidden rounded-lg bg-white shadow-card transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-card-hover motion-reduce:transform-none"
          >
            <div className="relative overflow-hidden">
              {b.cover_url ? (
                <div
                  className="aspect-3/4 bg-slate-200 bg-cover bg-top transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundImage: `url('${b.cover_url}')` }}
                />
              ) : (
                <div className="grid aspect-3/4 place-items-center bg-linear-to-br from-amber-50 to-amber-200 text-4xl">
                  📖
                </div>
              )}
              <span className="absolute top-2 right-2 rounded-md bg-black/55 px-2 py-1 text-[0.62rem] font-bold text-white backdrop-blur-sm">
                {b.page_count} trang
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-1 px-3 py-2.5">
              <b className="text-[0.85rem] leading-snug text-brand-dark">{b.title}</b>
              <span className="mt-auto text-xs font-semibold text-slate-500 group-hover:text-brand">
                Mở đọc →
              </span>
            </div>
          </a>
        ))}
      </div>
    </SectionShell>
  );
}
