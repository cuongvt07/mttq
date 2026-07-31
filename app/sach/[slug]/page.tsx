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
    <main className="flex min-h-screen flex-col bg-[#101a26] px-2 py-4 sm:px-4">
      <h1 className="mb-3 text-center text-base font-bold text-white sm:text-lg">{book.title}</h1>
      <BookViewerClient book={book} />
    </main>
  );
}
