import { createClient } from "@/utils/supabase/server";
import type { Book, BookPage, BookWithPages } from "./book-types";

type PageRow = {
  id: string;
  sort_order: number;
  background: string;
  background_image: string | null;
  elements: BookPage["elements"];
};

const toPage = (r: PageRow): BookPage => ({
  id: r.id,
  background: r.background,
  background_image: r.background_image,
  elements: Array.isArray(r.elements) ? r.elements : [],
});

export async function getBooks(): Promise<(Book & { page_count: number })[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("books")
    .select("*, book_pages(id)")
    .order("updated_at", { ascending: false });

  return ((data as (Book & { book_pages: { id: string }[] })[] | null) ?? []).map((b) => ({
    ...b,
    page_count: b.book_pages?.length ?? 0,
  }));
}

export async function getBook(id: string): Promise<BookWithPages | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("books")
    .select("*, book_pages(*)")
    .eq("id", id)
    .order("sort_order", { referencedTable: "book_pages" })
    .maybeSingle();

  if (!data) return null;
  const { book_pages, ...book } = data as Book & { book_pages: PageRow[] };
  return { ...book, pages: (book_pages ?? []).map(toPage) };
}

export async function getBookBySlug(slug: string): Promise<BookWithPages | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("books")
    .select("*, book_pages(*)")
    .eq("slug", slug)
    .eq("is_published", true)
    .order("sort_order", { referencedTable: "book_pages" })
    .maybeSingle();

  if (!data) return null;
  const { book_pages, ...book } = data as Book & { book_pages: PageRow[] };
  return { ...book, pages: (book_pages ?? []).map(toPage) };
}

/** Danh sách rút gọn để chọn nhanh trong form tin/hoạt động. */
export async function getBookOptions(): Promise<Pick<Book, "id" | "title" | "slug">[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("books")
    .select("id,title,slug")
    .eq("is_published", true)
    .order("updated_at", { ascending: false });
  return (data as Pick<Book, "id" | "title" | "slug">[] | null) ?? [];
}
