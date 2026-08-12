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

/**
 * Đổi font hệ điều hành sang webfont tự host (khai báo ở app/fonts.css).
 *
 * Sách cũ đã lưu sẵn chuỗi font của Windows trong CSDL. Nếu để nguyên thì trên
 * iOS/Android trình duyệt phải thay bằng font khác, số đo chữ đổi, đoạn văn ngắt
 * thêm dòng và đè lên phần tử bên dưới. Ánh xạ ngay lúc render nên không phải
 * đụng vào dữ liệu, và sách cũ lẫn sách mới đều hiện giống nhau trên mọi máy.
 *
 * Ba font Croscore (Tinos/Arimo/Cousine) trùng số đo tuyệt đối với
 * Times New Roman/Arial/Courier New, nên bố cục cũ giữ nguyên từng dòng.
 */
const LEGACY_FONT_MAP: Record<string, string> = {
  '"Segoe UI", system-ui, sans-serif': "'Source Sans 3', system-ui, sans-serif",
  '"Times New Roman", Times, serif': "'Tinos', Times, serif",
  "Arial, Helvetica, sans-serif": "'Arimo', Arial, sans-serif",
  "Tahoma, Verdana, sans-serif": "'Source Sans 3', Tahoma, sans-serif",
  '"Courier New", monospace': "'Cousine', 'Courier New', monospace",
};

export function mapLegacyFont(family: string): string {
  return LEGACY_FONT_MAP[family] ?? family;
}

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
          fontFamily: mapLegacyFont(el.fontFamily),
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

  if (el.type === "shape") {
    return (
      <div
        data-el-id={el.id}
        style={{
          ...base,
          height: el.h,
          background: el.fill || "transparent",
          border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor}` : undefined,
          borderRadius: el.radius,
          opacity: el.opacity,
        }}
      />
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
          // Đầu/chân trang và số trang không tự đặt font nên sẽ thừa kế chỗ này.
          // Không đặt thì chúng rơi về font của body (Segoe UI — chỉ có trên
          // Windows) và lại lệch giữa máy soạn với điện thoại.
          fontFamily: mapLegacyFont('"Segoe UI", system-ui, sans-serif'),
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
