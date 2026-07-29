import { createClient } from "@/utils/supabase/server";
import {
  FALLBACK_CLUSTERS,
  FALLBACK_MEDIA,
  FALLBACK_SETTINGS,
  FALLBACK_STATS,
  FALLBACK_SITE_DATA,
} from "./fallback-data";
import type {
  Cluster,
  ClusterWithUnits,
  MediaItem,
  SiteData,
  SiteSettings,
  Stat,
  Unit,
} from "./types";

/**
 * Lấy toàn bộ dữ liệu trang chủ từ Supabase.
 * Nếu chưa cấu hình / chưa chạy schema.sql thì rơi về dữ liệu mẫu để trang vẫn chạy.
 */
export async function getSiteData(): Promise<SiteData> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return FALLBACK_SITE_DATA;

  try {
    const supabase = await createClient();

    const [settingsRes, statsRes, clustersRes, mediaRes] = await Promise.all([
      supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
      supabase.from("stats").select("*").eq("is_visible", true).order("sort_order"),
      supabase
        .from("clusters")
        .select("*, units(*)")
        .eq("is_published", true)
        .order("sort_order")
        .order("sort_order", { referencedTable: "units" }),
      supabase.from("media_items").select("*").eq("is_visible", true).order("sort_order"),
    ]);

    // Bảng chưa tồn tại => dùng dữ liệu mẫu
    if (settingsRes.error && clustersRes.error) return FALLBACK_SITE_DATA;

    const clusters = (clustersRes.data as ClusterWithUnits[] | null) ?? [];

    return {
      settings: (settingsRes.data as SiteSettings | null) ?? FALLBACK_SETTINGS,
      stats: (statsRes.data as Stat[] | null) ?? FALLBACK_STATS,
      clusters: clusters.length ? clusters : FALLBACK_CLUSTERS,
      media: (mediaRes.data as MediaItem[] | null) ?? FALLBACK_MEDIA,
      usingFallback: false,
    };
  } catch {
    return FALLBACK_SITE_DATA;
  }
}

/* ------------------------------- dùng cho khu vực /admin ------------------------------- */

export async function getSettingsForAdmin(): Promise<SiteSettings> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  return (data as SiteSettings | null) ?? FALLBACK_SETTINGS;
}

export async function getStatsForAdmin(): Promise<Stat[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("stats").select("*").order("sort_order");
  return (data as Stat[] | null) ?? [];
}

export async function getClustersForAdmin(): Promise<Cluster[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("clusters").select("*").order("sort_order");
  return (data as Cluster[] | null) ?? [];
}

export async function getClusterWithUnits(id: string): Promise<ClusterWithUnits | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clusters")
    .select("*, units(*)")
    .eq("id", id)
    .order("sort_order", { referencedTable: "units" })
    .maybeSingle();
  return (data as ClusterWithUnits | null) ?? null;
}

export async function getUnitCounts(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase.from("units").select("cluster_id");
  const counts: Record<string, number> = {};
  for (const row of (data as Pick<Unit, "cluster_id">[] | null) ?? []) {
    counts[row.cluster_id] = (counts[row.cluster_id] ?? 0) + 1;
  }
  return counts;
}

export async function getMediaForAdmin(): Promise<MediaItem[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("media_items").select("*").order("sort_order");
  return (data as MediaItem[] | null) ?? [];
}
