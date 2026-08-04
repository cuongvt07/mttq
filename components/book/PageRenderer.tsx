import {
  PAGE_WIDTH,
  pageHeight,
  type BookElement,
  type BookPage,
  type PageChrome,
} from "@/lib/book-types";
import PageChromeView from "./PageChromeView";

/**
 * Render engine dùng chung cho cả trình soạn thảo và trình xem (WYSIWYG).
 * Nội dung luôn dựng trong khung 800 × pageHeight rồi scale xuống kích thước hiển thị.
 */

export function ElementView({ el }: { el: BookElement }) {
  const base: React.CSSProperties = {
    position: "absolute",
    left: el.x,
    top: el.y,
    width: el.w,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    transformOrigin: "center center",
  };

  if (el.type === "text") {
    const Tag = el.href ? "a" : "div";
    const linkProps = el.href
      ? { href: el.href, target: "_blank", rel: "noopener noreferrer" }
      : {};
    return (
      <Tag
        {...linkProps}
        data-el-id={el.id}
        style={{
          ...base,
          fontSize: el.fontSize,
          fontFamily: el.fontFamily,
          color: el.color,
          fontWeight: el.bold ? 700 : 400,
          fontStyle: el.italic ? "italic" : "normal",
          textAlign: el.align,
          lineHeight: el.lineHeight,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {el.content}
      </Tag>
    );
  }

  return (
    <div data-el-id={el.id} style={{ ...base, height: el.h }}>
      <img
        src={el.src}
        alt=""
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: el.fit,
          borderRadius: el.radius,
          opacity: el.opacity,
          border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor}` : undefined,
          display: "block",
        }}
      />
    </div>
  );
}

export default function PageRenderer({
  page,
  ratio,
  width,
  chrome,
  pageNumber = 1,
  totalPages = 1,
  className = "",
  children,
}: {
  page: BookPage;
  ratio: string;
  /** bề rộng hiển thị thực tế (px) */
  width: number;
  /** cấu hình đầu/chân trang dùng chung của sách */
  chrome?: PageChrome;
  /** số thứ tự trang (từ 1) — cần cho số trang ở chân trang */
  pageNumber?: number;
  totalPages?: number;
  className?: string;
  /** lớp phủ thêm (handle của editor) — đặt trong cùng hệ toạ độ trang */
  children?: React.ReactNode;
}) {
  const h = pageHeight(ratio);
  const scale = width / PAGE_WIDTH;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ width, height: h * scale }}
    >
      <div
        style={{
          width: PAGE_WIDTH,
          height: h,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "relative",
          background: page.background,
          backgroundImage: page.background_image ? `url('${page.background_image}')` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {chrome ? (
          <PageChromeView
            chrome={chrome}
            pageWidth={PAGE_WIDTH}
            pageHeight={h}
            pageNumber={pageNumber}
            total={totalPages}
          />
        ) : null}

        {page.elements.map((el) => (
          <ElementView key={el.id} el={el} />
        ))}
        {children}
      </div>
    </div>
  );
}
