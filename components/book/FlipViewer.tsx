"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import { PAGE_WIDTH, pageHeight, type BookWithPages } from "@/lib/book-types";
import PageRenderer from "./PageRenderer";

/**
 * Trình xem sách lật.
 * - PC: mở 2 trang, lật cong như sách thật (StPageFlip).
 * - Mobile: 1 trang toàn màn hình, vuốt trái/phải (usePortrait tự chuyển).
 */
export default function FlipViewer({ book }: { book: BookWithPages }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<{ pageFlip: () => { flipNext: () => void; flipPrev: () => void } } | null>(
    null,
  );
  const [size, setSize] = useState({ w: 420, h: 560 });
  const [portrait, setPortrait] = useState(false);
  const [current, setCurrent] = useState(0);

  const H = pageHeight(book.page_ratio);
  const ratio = H / PAGE_WIDTH;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const measure = () => {
      const isPortrait = window.innerWidth < 768;
      const availW = el.clientWidth - (isPortrait ? 8 : 32);
      const availH = window.innerHeight - (isPortrait ? 96 : 150);

      // PC hiển thị 2 trang cạnh nhau nên mỗi trang chỉ được một nửa bề ngang
      let w = isPortrait ? availW : availW / 2;
      let h = w * ratio;
      if (h > availH) {
        h = availH;
        w = h / ratio;
      }
      setPortrait(isPortrait);
      setSize({ w: Math.max(200, Math.floor(w)), h: Math.max(260, Math.floor(h)) });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [ratio]);

  const flip = useCallback((dir: -1 | 1) => {
    const api = flipRef.current?.pageFlip?.();
    if (!api) return;
    dir === 1 ? api.flipNext() : api.flipPrev();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") flip(1);
      if (e.key === "ArrowLeft") flip(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flip]);

  if (!book.pages.length) {
    return <p className="p-8 text-center text-sm text-slate-500">Sách chưa có trang nào.</p>;
  }

  return (
    <div ref={wrapRef} className="flex w-full flex-col items-center gap-3">
      <HTMLFlipBook
        ref={flipRef}
        width={size.w}
        height={size.h}
        size="fixed"
        minWidth={200}
        maxWidth={900}
        minHeight={260}
        maxHeight={1400}
        usePortrait={portrait}
        showCover={!portrait}
        maxShadowOpacity={0.4}
        mobileScrollSupport
        drawShadow
        flippingTime={700}
        className="book-flip"
        style={{}}
        startPage={0}
        startZIndex={0}
        clickEventForward
        useMouseEvents
        swipeDistance={30}
        showPageCorners
        disableFlipByClick={false}
        autoSize={false}
        onFlip={(e: { data: number }) => setCurrent(e.data)}
      >
        {book.pages.map((p, i) => (
          // bìa trước/sau là bìa cứng (lật nguyên tấm), trang ruột gập mềm
          // như giấy khi kéo góc
          <div
            key={p.id}
            className="bg-white"
            data-density={i === 0 || i === book.pages.length - 1 ? "hard" : "soft"}
          >
            <PageRenderer
              page={p}
              ratio={book.page_ratio}
              width={size.w}
              chrome={book.chrome}
              pageNumber={i + 1}
              totalPages={book.pages.length}
            />
          </div>
        ))}
      </HTMLFlipBook>

      <div className="flex items-center gap-3 text-sm text-white">
        <button
          type="button"
          onClick={() => flip(-1)}
          className="cursor-pointer rounded-md bg-white/15 px-3 py-1.5 font-semibold hover:bg-white/25"
        >
          ‹ Trước
        </button>
        <span className="tabular-nums">
          {Math.min(current + 1, book.pages.length)} / {book.pages.length}
        </span>
        <button
          type="button"
          onClick={() => flip(1)}
          className="cursor-pointer rounded-md bg-white/15 px-3 py-1.5 font-semibold hover:bg-white/25"
        >
          Sau ›
        </button>
      </div>
    </div>
  );
}
