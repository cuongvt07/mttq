"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/admin-auth";
import { uniqueSlug } from "@/lib/unique-slug";
import { createClient } from "@/utils/supabase/server";

/* ------------------------------------------------------------------ utils -- */

function str(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}
function nullable(form: FormData, key: string): string | null {
  const v = str(form, key);
  return v === "" ? null : v;
}
function num(form: FormData, key: string, fallback = 0): number {
  const v = Number(form.get(key));
  return Number.isFinite(v) ? v : fallback;
}
function bool(form: FormData, key: string): boolean {
  return form.get(key) === "on" || form.get(key) === "true";
}

/** Xoá cache trang chủ + trang admin liên quan. */
function refresh(path?: string) {
  revalidatePath("/");
  revalidatePath("/admin", "layout");
  if (path) revalidatePath(path);
}

/* ------------------------------------------------------------------- auth -- */

export type SignInState = { error?: string } | undefined;

const NOT_ADMIN = "Tài khoản này chưa được cấp quyền quản trị.";

/** Đường dẫn gốc của site, dùng để dựng redirect URL cho Google. */
async function siteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** next phải là đường dẫn nội bộ — chặn open redirect. */
function safeNext(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/admin";
}

export async function signIn(_prev: SignInState, form: FormData): Promise<SignInState> {
  const email = str(form, "email");
  const password = str(form, "password");
  const next = safeNext(str(form, "next") || "/admin");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  if (!(await isAdminEmail(supabase, data.user.email))) {
    await supabase.auth.signOut();
    return { error: NOT_ADMIN };
  }

  redirect(next);
}

export async function signInWithGoogle(_prev: SignInState, form: FormData): Promise<SignInState> {
  const next = safeNext(str(form, "next") || "/admin");
  const origin = await siteOrigin();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error || !data.url) return { error: error?.message ?? "Không tạo được liên kết Google." };

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/* --------------------------------------------------------------- settings -- */

export async function updateSettings(form: FormData) {
  const supabase = await createClient();
  await supabase.from("site_settings").upsert({
    id: 1,
    site_title: str(form, "site_title"),
    brand_name: str(form, "brand_name"),
    brand_logo_url: nullable(form, "brand_logo_url"),
    hero_title: str(form, "hero_title"),
    hero_subtitle: str(form, "hero_subtitle"),
    hero_image_url: nullable(form, "hero_image_url"),
    featured_title: str(form, "featured_title"),
    featured_color_from: str(form, "featured_color_from"),
    featured_color_to: str(form, "featured_color_to"),
    footer_title: str(form, "footer_title"),
    footer_note: str(form, "footer_note"),
    updated_at: new Date().toISOString(),
  });
  refresh("/admin/settings");
}

/* ------------------------------------------------------------------ stats -- */

export async function createStat(form: FormData) {
  const supabase = await createClient();
  await supabase.from("stats").insert({
    value: str(form, "value"),
    label: str(form, "label"),
    variant: str(form, "variant") === "big" ? "big" : "default",
    sort_order: num(form, "sort_order"),
    is_visible: true,
  });
  refresh("/admin/stats");
}

export async function updateStat(form: FormData) {
  const supabase = await createClient();
  await supabase
    .from("stats")
    .update({
      value: str(form, "value"),
      label: str(form, "label"),
      variant: str(form, "variant") === "big" ? "big" : "default",
      sort_order: num(form, "sort_order"),
      is_visible: bool(form, "is_visible"),
    })
    .eq("id", str(form, "id"));
  refresh("/admin/stats");
}

export async function deleteStat(form: FormData) {
  const supabase = await createClient();
  await supabase.from("stats").delete().eq("id", str(form, "id"));
  refresh("/admin/stats");
}

/* --------------------------------------------------------------- clusters -- */

export async function createCluster(form: FormData) {
  const supabase = await createClient();
  const name = str(form, "name");
  const slug = await uniqueSlug(supabase, "clusters", name, "ban");

  const { data } = await supabase
    .from("clusters")
    .insert({
      name,
      slug,
      nav_label: nullable(form, "nav_label"),
      color_from: str(form, "color_from") || "#4aa6e6",
      color_to: str(form, "color_to") || "#1f7fca",
      sort_order: num(form, "sort_order"),
      is_published: true,
    })
    .select("id")
    .maybeSingle();

  refresh("/admin/clusters");
  if (data?.id) redirect(`/admin/clusters/${data.id}`);
}

export async function updateCluster(form: FormData) {
  const supabase = await createClient();
  const id = str(form, "id");
  await supabase
    .from("clusters")
    .update({
      name: str(form, "name"),
      // slug giữ nguyên sau khi tạo để không gãy đường dẫn neo #… đã chia sẻ
      nav_label: nullable(form, "nav_label"),
      color_from: str(form, "color_from"),
      color_to: str(form, "color_to"),
      sort_order: num(form, "sort_order"),
      is_published: bool(form, "is_published"),
    })
    .eq("id", id);
  refresh(`/admin/clusters/${id}`);
}

export async function deleteCluster(form: FormData) {
  const supabase = await createClient();
  await supabase.from("clusters").delete().eq("id", str(form, "id"));
  refresh("/admin/clusters");
  redirect("/admin/clusters");
}

/* ------------------------------------------------------------------ units -- */

export async function createUnit(form: FormData) {
  const supabase = await createClient();
  const clusterId = str(form, "cluster_id");
  await supabase.from("units").insert({
    cluster_id: clusterId,
    label: str(form, "label"),
    image_url: nullable(form, "image_url"),
    link_url: nullable(form, "link_url"),
    flipbook_url: nullable(form, "flipbook_url"),
    sort_order: num(form, "sort_order"),
  });
  refresh(`/admin/clusters/${clusterId}`);
}

export async function updateUnit(form: FormData) {
  const supabase = await createClient();
  await supabase
    .from("units")
    .update({
      label: str(form, "label"),
      image_url: nullable(form, "image_url"),
      link_url: nullable(form, "link_url"),
      flipbook_url: nullable(form, "flipbook_url"),
      sort_order: num(form, "sort_order"),
    })
    .eq("id", str(form, "id"));
  refresh(`/admin/clusters/${str(form, "cluster_id")}`);
}

export async function deleteUnit(form: FormData) {
  const supabase = await createClient();
  await supabase.from("units").delete().eq("id", str(form, "id"));
  refresh(`/admin/clusters/${str(form, "cluster_id")}`);
}

/* ------------------------------------------------------------------ media -- */

export async function createMedia(form: FormData) {
  const supabase = await createClient();
  const bookId = nullable(form, "book_id");

  await supabase.from("media_items").insert({
    book_id: bookId,
    // đã chọn sách thì ảnh, tên và link lấy từ sách — không lưu bản nhập tay
    caption: bookId ? "" : str(form, "caption"),
    image_url: bookId ? null : nullable(form, "image_url"),
    link_url: bookId ? null : nullable(form, "link_url"),
    orientation: "landscape",
    sort_order: num(form, "sort_order"),
    is_visible: true,
  });
  refresh("/admin/settings");
}

export async function updateMedia(form: FormData) {
  const supabase = await createClient();
  const bookId = nullable(form, "book_id");

  await supabase
    .from("media_items")
    .update({
      book_id: bookId,
      caption: bookId ? "" : str(form, "caption"),
      image_url: bookId ? null : nullable(form, "image_url"),
      link_url: bookId ? null : nullable(form, "link_url"),
      sort_order: num(form, "sort_order"),
      is_visible: bool(form, "is_visible"),
    })
    .eq("id", str(form, "id"));
  refresh("/admin/settings");
}

export async function deleteMedia(form: FormData) {
  const supabase = await createClient();
  await supabase.from("media_items").delete().eq("id", str(form, "id"));
  refresh("/admin/media");
}
