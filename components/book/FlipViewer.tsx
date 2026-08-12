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
  const stageRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<{ pageFlip: () => { flipNext: () => void; flipPrev: () => void } } | null>(
    null,
  );
  const [size, setSize] = useState({ w: 420, h: 560 });
  const [portrait, setPortrait] = useState(false);
  const [current, setCurrent] = useState(0);

  const H = pageHeight(book.page_ratio);
  const ratio = H / PAGE_WIDTH;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const measure = () => {
      const isPortrait = window.innerWidth < 768;

      // Đo thẳng khung chứa sách. Khung này đã bị .book-shell giới hạn trong
      // 100svh và đã trừ sẵn tiêu đề + thanh điều hướng bằng flex, nên không
      // được phép đoán chiều cao thanh trình duyệt bằng hằng số nữa —
      // đoán sai bao nhiêu là tràn ra ngoài màn hình đúng bấy nhiêu.
      const availW = stage.clientWidth - (isPortrait ? 8 : 24);
      const availH = stage.clientHeight - 8; // chừa chỗ cho bóng đổ của trang
      if (availW <= 0 || availH <= 0) return; // khung chưa có kích thước thật

      // PC hiển thị 2 trang cạnh nhau nên mỗi trang chỉ được một nửa bề ngang
      let w = isPortrait ? availW : availW / 2;
      let h = w * ratio;
      if (h > availH) {
        h = availH;
        w = h / ratio;
      }

      setPortrait(isPortrait);
      // Sàn để rất thấp: điện thoại xoay ngang chỉ còn ~250px chiều cao, sàn cao
      // hơn chỗ trống thật sẽ đẩy sách tràn trở lại.
      setSize({ w: Math.max(80, Math.floor(w)), h: Math.max(100, Math.floor(h)) });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    // Xoay máy đổi cả kích thước lẫn chiều cao thanh trình duyệt; một số máy
    // Android không bắn resize cho khung này nên nghe thêm orientationchange.
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
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

  // Cử chỉ cảm ứng do ta tự xử lý.
  //
  // Cơ chế bắt góc trang sẵn có của StPageFlip chỉ ăn khi ngón tay bắt đúng vào
  // rìa trang, nên đo thực tế thấy vuốt lật tới gần như không bao giờ nhận.
  // Ở đây chặn touch từ tầng capture (chạy trước listener của thư viện gắn trên
  // .stf__parent bên dưới) rồi tự quyết định hướng lật, nên vuốt ở bất kỳ đâu
  // trên trang cũng ăn và hai chiều đối xứng nhau. Chuột giữ nguyên hành vi cũ
  // của thư viện để vẫn kéo cong được góc trang trên PC.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const SWIPE_MIN_PX = 40; // ngắn hơn thì coi như chạm, không phải vuốt

    let startX = 0;
    let startY = 0;
    let tracking = false;

    const onStart = (e: TouchEvent) => {
      // Nhiều ngón: để yên cho trình duyệt xử lý (vd. thao tác phóng to)
      if (e.touches.length !== 1) {
        tracking = false;
        return;
      }
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      tracking = true;
      e.stopPropagation();
    };

    const onMove = (e: TouchEvent) => {
      if (tracking) e.stopPropagation();
    };

    const onEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      e.stopPropagation();

      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;

      // Vuốt sang trái là lật tới, sang phải là lật lùi.
      //
      // Chỉ xử lý VUỐT ở đây. Chạm tại chỗ để yên cho StPageFlip: sau touchend
      // trình duyệt vẫn sinh ra sự kiện click và thư viện đã lật đúng nửa trái /
      // nửa phải theo click đó. Nếu ta bắt luôn cả chạm thì mỗi lần chạm sẽ lật
      // hai trang một lúc.
      if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy)) {
        flip(dx < 0 ? 1 : -1);
      }
    };

    const opts = { capture: true, passive: true } as const;
    stage.addEventListener("touchstart", onStart, opts);
    stage.addEventListener("touchmove", onMove, opts);
    stage.addEventListener("touchend", onEnd, opts);
    stage.addEventListener("touchcancel", onEnd, opts);
    return () => {
      stage.removeEventListener("touchstart", onStart, opts);
      stage.removeEventListener("touchmove", onMove, opts);
      stage.removeEventListener("touchend", onEnd, opts);
      stage.removeEventListener("touchcancel", onEnd, opts);
    };
  }, [flip]);

  if (!book.pages.length) {
    return <p className="p-8 text-center text-sm text-slate-500">Sách chưa có trang nào.</p>;
  }

  return (
    <div className="flex w-full min-h-0 flex-1 flex-col items-center gap-2 overflow-hidden">
      {/* Vùng sách: flex-1 + min-h-0 để nó nhận đúng phần cao còn lại sau khi
          thanh điều hướng bên dưới đã lấy phần của mình. Kích thước vùng này
          không phụ thuộc kích thước sách nên ResizeObserver không bị lặp. */}
      <div
        ref={stageRef}
        className="flex w-full min-h-0 flex-1 items-center justify-center overflow-hidden"
      >
        <HTMLFlipBook
          ref={flipRef}
          width={size.w}
          height={size.h}
          size="fixed"
          minWidth={80}
          maxWidth={900}
          minHeight={100}
          maxHeight={1400}
          usePortrait={portrait}
          showCover={!portrait}
          maxShadowOpacity={0.4}
          // Trang đã không còn cuộn dọc được nữa, nên để false cho mọi cú vuốt
          // đều được hiểu là lật trang thay vì bị nhầm thành thao tác cuộn.
          mobileScrollSupport={false}
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
      </div>

      <div className="flex shrink-0 items-center gap-3 text-sm text-white">
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
