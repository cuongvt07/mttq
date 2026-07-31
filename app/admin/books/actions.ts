"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { BookPage, PageChrome } from "@/lib/book-types";
import { slugify } from "@/lib/slug";
import { createClient } from "@/utils/supabase/server";

function str(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}

export async function createBook(form: FormData) {
  const supabase = await createClient();
  const title = str(form, "title") || "Sách mới";
  const base = slugify(title) || "sach";
  const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;

  const { data, error } = await supabase
    .from("books")
    .insert({ title, slug, page_ratio: str(form, "page_ratio") || "3:4" })
    .select("id")
    .maybeSingle();

  if (error || !data) throw new Error(error?.message ?? "Không tạo được sách");

  // Sách mới có sẵn 1 trang trắng
  await supabase.from("book_pages").insert({ book_id: data.id, sort_order: 0 });

  revalidatePath("/admin/books");
  redirect(`/admin/books/${data.id}`);
}

export async function updateBookMeta(form: FormData) {
  const supabase = await createClient();
  const id = str(form, "id");
  await supabase
    .from("books")
    .update({
      title: str(form, "title"),
      slug: str(form, "slug") || undefined,
      page_ratio: str(form, "page_ratio"),
      cover_url: str(form, "cover_url") || null,
      is_published: form.get("is_published") === "on",
    })
    .eq("id", id);

  revalidatePath("/admin/books");
  revalidatePath(`/admin/books/${id}`);
  revalidatePath("/", "layout");
}

export async function deleteBook(form: FormData) {
  const supabase = await createClient();
  await supabase.from("books").delete().eq("id", str(form, "id"));
  revalidatePath("/admin/books");
  redirect("/admin/books");
}

/**
 * Lưu toàn bộ trang của một sách (gọi từ trình soạn thảo, có autosave).
 * Trang bị xoá trong editor sẽ bị xoá khỏi DB.
 */
export async function saveBookPages(
  bookId: string,
  pages: BookPage[],
): Promise<{ ok: true; savedAt: string } | { ok: false; error: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Phiên đăng nhập đã hết hạn" };

  const keep = pages.map((p) => p.id);
  const { data: existing } = await supabase
    .from("book_pages")
    .select("id")
    .eq("book_id", bookId);

  const toDelete = ((existing as { id: string }[] | null) ?? [])
    .map((r) => r.id)
    .filter((id) => !keep.includes(id));

  if (toDelete.length) {
    const { error } = await supabase.from("book_pages").delete().in("id", toDelete);
    if (error) return { ok: false, error: error.message };
  }

  const rows = pages.map((p, i) => ({
    id: p.id,
    book_id: bookId,
    sort_order: i,
    background: p.background,
    background_image: p.background_image,
    elements: p.elements,
  }));

  const { error } = await supabase.from("book_pages").upsert(rows, { onConflict: "id" });
  if (error) return { ok: false, error: error.message };

  await supabase.from("books").update({ updated_at: new Date().toISOString() }).eq("id", bookId);

  revalidatePath(`/admin/books/${bookId}`);
  revalidatePath("/", "layout");
  return { ok: true, savedAt: new Date().toISOString() };
}

/** Lưu cấu hình đầu/chân trang (gọi từ trình soạn thảo, có debounce). */
export async function saveBookChrome(
  bookId: string,
  chrome: PageChrome,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Phiên đăng nhập đã hết hạn" };

  const { error } = await supabase.from("books").update({ chrome }).eq("id", bookId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/books/${bookId}`);
  revalidatePath("/", "layout");
  return { ok: true };
}
