/**
 * Ảnh nền + icon cào từ trang Canva gốc (scripts/scrape-canva.mjs).
 * Gán theo VỊ TRÍ của cụm nên không cần đụng tới dữ liệu trong Supabase.
 */

export const EMBLEM = "/brand/emblem.webp";
export const HERO_BANNER = "/brand/hero-banner.webp";
export const FEATURED_BG = "/bg/02-orange.webp";

/** Nền cho từng cụm theo thứ tự hiển thị; hết danh sách thì quay vòng. */
export const CLUSTER_BACKGROUNDS = [
  "/bg/12-red-plain.webp",
  "/bg/03-amber.webp",
  "/bg/07-sky.webp",
  "/bg/04-green.webp",
  "/bg/05-teal.webp",
  "/bg/06-blue.webp",
  "/bg/08-violet.webp",
  "/bg/09-purple.webp",
  "/bg/10-magenta.webp",
  "/bg/11-silver.webp",
  "/bg/01-red.webp",
];

export function clusterBackground(index: number): string {
  return CLUSTER_BACKGROUNDS[index % CLUSTER_BACKGROUNDS.length];
}
