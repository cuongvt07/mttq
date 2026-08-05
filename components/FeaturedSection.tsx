import type { MediaItem, SiteSettings } from "@/lib/types";
import { FEATURED_BG } from "@/lib/theme";
import FlipbookCard from "./FlipbookCard";
import SectionShell from "./SectionShell";

/**
 * Thẻ ảnh/video nổi bật. Mọi thẻ cùng khung 16:10 và cao bằng nhau để hàng luôn đều;
 * `orientation = portrait` chỉ đổi cách đặt ảnh (hiện trọn khung, không cắt).
 */
function MediaCard({ item, index }: { item: MediaItem; index: number }) {
  const contain = item.orientation === "portrait";

  // Mục đã chọn sách: ảnh bìa và tên lấy thẳng từ sách, bấm vào mở sách lật
  const anh = item.book?.cover ?? item.image_url;
  const chu = item.book?.title ?? item.caption;
  const dichSach = item.book ? `/sach/${item.book.slug}` : null;

  const inner = (
    <>
      <div className="relative overflow-hidden">
        <div
          className={`aspect-16/10 grid place-items-center bg-center text-xs font-bold ${
            contain ? "bg-contain bg-no-repeat" : "bg-cover"
          } ${anh ? "bg-slate-100" : "bg-linear-to-br from-lime-100 to-lime-300 text-lime-900"}`}
          style={anh ? { backgroundImage: `url('${anh}')` } : undefined}
        >
          {anh ? null : "Ảnh / Video"}
        </div>
        {dichSach || item.flipbook_url ? (
          <span className="absolute top-2 right-2 rounded-md bg-black/55 px-2 py-1 text-[0.62rem] font-bold text-white backdrop-blur-sm">
            📖 Xem
          </span>
        ) : null}
      </div>
      {chu ? (
        <p className="px-3 py-2.5 text-[0.8rem] leading-snug font-semibold text-slate-700">{chu}</p>
      ) : null}
    </>
  );

  const className =
    "flex h-full flex-col overflow-hidden rounded-lg bg-white shadow-card transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-card-hover motion-reduce:transform-none";

  const revealProps = {
    "data-reveal": "",
    style: { "--reveal-delay": `${index * 70}ms` } as React.CSSProperties,
  };

  if (dichSach) {
    return (
      <a className={className} href={dichSach} {...revealProps}>
        {inner}
      </a>
    );
  }

  if (item.flipbook_url) {
    return (
      <FlipbookCard
        url={item.flipbook_url}
        title={item.caption || "Flip-book"}
        className={className}
        style={revealProps.style}
      >
        {inner}
      </FlipbookCard>
    );
  }

  return item.link_url ? (
    <a
      className={className}
      href={item.link_url}
      target="_blank"
      rel="noopener noreferrer"
      {...revealProps}
    >
      {inner}
    </a>
  ) : (
    <div className={className} {...revealProps}>
      {inner}
    </div>
  );
}

export default function FeaturedSection({
  settings,
  media,
}: {
  settings: SiteSettings;
  media: MediaItem[];
}) {
  if (!media.length) return null;

  return (
    <SectionShell
      id="featured"
      title={settings.featured_title}
      background={FEATURED_BG}
      gradientFrom={settings.featured_color_from}
      gradientTo={settings.featured_color_to}
    >
      <div className="grid auto-rows-fr grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {media.map((item, i) => (
          <MediaCard key={item.id} item={item} index={i} />
        ))}
      </div>
    </SectionShell>
  );
}
