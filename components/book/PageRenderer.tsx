import { PAGE_WIDTH, pageHeight, type BookElement, type BookPage } from "@/lib/book-types";

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
    return (
      <div
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
      </div>
    );
  }

  return (
    <div style={{ ...base, height: el.h }}>
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
  className = "",
  children,
}: {
  page: BookPage;
  ratio: string;
  /** bề rộng hiển thị thực tế (px) */
  width: number;
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
        {page.elements.map((el) => (
          <ElementView key={el.id} el={el} />
        ))}
        {children}
      </div>
    </div>
  );
}
