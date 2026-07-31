"use client";

import dynamic from "next/dynamic";
import type { BookWithPages } from "@/lib/book-types";

/** StPageFlip đụng tới window nên chỉ nạp ở phía trình duyệt. */
const FlipViewer = dynamic(() => import("./FlipViewer"), {
  ssr: false,
  loading: () => <p className="p-8 text-center text-sm text-white/70">Đang tải sách…</p>,
});

export default function BookViewerClient({ book }: { book: BookWithPages }) {
  return <FlipViewer book={book} />;
}
