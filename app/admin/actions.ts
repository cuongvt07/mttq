"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/slug";
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

export async function signIn(_prev: SignInState, form: FormData): Promise<SignInState> {
  const email = str(form, "email");
  const password = str(form, "password");
  const next = str(form, "next") || "/admin";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  redirect(next);
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
  const slug = str(form, "slug") || slugify(name) || `cum-${Date.now()}`;

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
      slug: str(form, "slug") || slugify(str(form, "name")),
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
  await supabase.from("media_items").insert({
    caption: str(form, "caption"),
    image_url: nullable(form, "image_url"),
    link_url: nullable(form, "link_url"),
    orientation: str(form, "orientation") === "portrait" ? "portrait" : "landscape",
    sort_order: num(form, "sort_order"),
    is_visible: true,
  });
  refresh("/admin/media");
}

export async function updateMedia(form: FormData) {
  const supabase = await createClient();
  await supabase
    .from("media_items")
    .update({
      caption: str(form, "caption"),
      image_url: nullable(form, "image_url"),
      link_url: nullable(form, "link_url"),
      orientation: str(form, "orientation") === "portrait" ? "portrait" : "landscape",
      sort_order: num(form, "sort_order"),
      is_visible: bool(form, "is_visible"),
    })
    .eq("id", str(form, "id"));
  refresh("/admin/media");
}

export async function deleteMedia(form: FormData) {
  const supabase = await createClient();
  await supabase.from("media_items").delete().eq("id", str(form, "id"));
  refresh("/admin/media");
}
