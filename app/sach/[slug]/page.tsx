import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BookViewerClient from "@/components/book/BookViewerClient";
import { getBookBySlug } from "@/lib/book-queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  return { title: book?.title ?? "Sách" };
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) notFound();

  return (
    // fixed + inset-x-0/top-0: đưa hẳn khung sách ra khỏi luồng tài liệu nên
    // <body> không còn gì để cuộn — chặn cuộn dọc tận gốc thay vì chỉ ẩn nó đi.
    <main className="book-shell fixed inset-x-0 top-0 flex flex-col overflow-hidden overscroll-none bg-[#101a26] px-2 py-2 sm:px-4 sm:py-3">
      <h1 className="mb-2 shrink-0 text-center text-sm font-bold text-white sm:mb-3 sm:text-lg">
        {book.title}
      </h1>
      <BookViewerClient book={book} />
    </main>
  );
}
