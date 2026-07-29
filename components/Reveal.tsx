"use client";

import { useEffect } from "react";

/**
 * Hiệu ứng xuất hiện khi cuộn tới.
 * Gắn `data-reveal` lên phần tử bất kỳ; component này (mount 1 lần ở trang chủ)
 * sẽ theo dõi và thêm class `is-visible`.
 *
 * Trạng thái ẩn ban đầu chỉ áp dụng sau khi JS chạy (class `reveal-ready` trên <html>),
 * nên nếu tắt JS thì nội dung vẫn hiện bình thường.
 */
export default function Reveal() {
  useEffect(() => {
    const root = document.documentElement;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    root.classList.add("reveal-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );

    const watch = () => {
      for (const el of document.querySelectorAll("[data-reveal]:not(.is-visible)")) {
        observer.observe(el);
      }
    };
    watch();

    // Cụm mới render (ví dụ sau khi điều hướng client) cũng được theo dõi.
    const mo = new MutationObserver(watch);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mo.disconnect();
      root.classList.remove("reveal-ready");
    };
  }, []);

  return null;
}
