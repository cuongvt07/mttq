import type { ChromeBand, PageChrome } from "@/lib/book-types";

/** Thay {trang} / {tong} trong chữ đầu–chân trang. */
function fill(text: string, pageNumber: number, total: number): string {
  return text.replace(/\{trang\}/g, String(pageNumber)).replace(/\{tong\}/g, String(total));
}

function Band({
  band,
  where,
  chrome,
  pageWidth,
  pageHeight: H,
  pageNumber,
  total,
}: {
  band: ChromeBand;
  where: "header" | "footer";
  chrome: PageChrome;
  pageWidth: number;
  pageHeight: number;
  pageNumber: number;
  total: number;
}) {
  if (!band.enabled) return null;

  const text = fill(band.text ?? "", pageNumber, total);
  const showNumber = band.pageNumber !== false && where === "footer" ? band.pageNumber : band.pageNumber;
  if (!text && !showNumber && !band.rule) return null;

  const m = chrome.margin;
  const isHeader = where === "header";
  const gap = Math.round(band.fontSize * 0.6);

  /** chữ và số trang nằm cùng một hàng, mỗi bên theo căn lề riêng */
  const slot = (align: ChromeBand["align"]) => ({
    position: "absolute" as const,
    left: m,
    right: m,
    textAlign: align,
    fontSize: band.fontSize,
    color: band.color,
    lineHeight: 1.2,
    whiteSpace: "nowrap" as const,
    overflow: "hidden" as const,
    textOverflow: "ellipsis" as const,
  });

  const textTop = isHeader ? m : H - m - band.fontSize * 1.2;
  const ruleTop = isHeader ? m + band.fontSize * 1.2 + gap : H - m - band.fontSize * 1.2 - gap;

  return (
    <>
      {text ? <div style={{ ...slot(band.align), top: textTop }}>{text}</div> : null}

      {showNumber ? (
        <div style={{ ...slot(band.pageNumberAlign ?? "right"), top: textTop }}>{pageNumber}</div>
      ) : null}

      {band.rule ? (
        <div
          style={{
            position: "absolute",
            left: m,
            right: m,
            top: ruleTop,
            borderTop: `${band.ruleWidth}px solid ${band.ruleColor}`,
          }}
        />
      ) : null}
    </>
  );
}

/**
 * Đầu trang / chân trang dùng chung cho mọi trang của sách.
 * Vẽ dưới các khối nội dung, trong hệ toạ độ trang.
 */
export default function PageChromeView({
  chrome,
  pageWidth,
  pageHeight,
  pageNumber,
  total,
}: {
  chrome: PageChrome;
  pageWidth: number;
  pageHeight: number;
  /** số thứ tự trang, bắt đầu từ 1 */
  pageNumber: number;
  total: number;
}) {
  if (chrome.skipFirstPage && pageNumber === 1) return null;

  return (
    <>
      <Band
        band={chrome.header}
        where="header"
        chrome={chrome}
        pageWidth={pageWidth}
        pageHeight={pageHeight}
        pageNumber={pageNumber}
        total={total}
      />
      <Band
        band={chrome.footer}
        where="footer"
        chrome={chrome}
        pageWidth={pageWidth}
        pageHeight={pageHeight}
        pageNumber={pageNumber}
        total={total}
      />
    </>
  );
}
