import { createClient } from "@/utils/supabase/server";
import { DEFAULT_CHROME, type Book, type BookPage, type BookWithPages } from "./book-types";

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
  return {
    ...book,
    chrome: { ...DEFAULT_CHROME, ...(book.chrome ?? {}) },
    pages: (book_pages ?? []).map(toPage),
  };
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
  return {
    ...book,
    chrome: { ...DEFAULT_CHROME, ...(book.chrome ?? {}) },
    pages: (book_pages ?? []).map(toPage),
  };
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

/** Sách đã xuất bản, dùng cho khối "Bản tin" ngoài trang chủ. */
export async function getPublishedBooks(): Promise<
  (Pick<Book, "id" | "title" | "slug" | "cover_url" | "updated_at"> & { page_count: number })[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("books")
    .select("id,title,slug,cover_url,updated_at, book_pages(id,sort_order,background_image)")
    .eq("is_published", true)
    .order("updated_at", { ascending: false });

  type Row = Book & { book_pages: { id: string; sort_order: number; background_image: string | null }[] };

  return ((data as Row[] | null) ?? []).map((b) => ({
    id: b.id,
    title: b.title,
    slug: b.slug,
    // chưa đặt bìa thì lấy nền trang đầu làm ảnh đại diện
    cover_url:
      b.cover_url ??
      [...(b.book_pages ?? [])].sort((x, y) => x.sort_order - y.sort_order)[0]?.background_image ??
      null,
    updated_at: b.updated_at,
    page_count: b.book_pages?.length ?? 0,
  }));
}
