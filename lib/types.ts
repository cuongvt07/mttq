export type SiteSettings = {
  id: number;
  site_title: string;
  brand_name: string;
  brand_logo_url: string | null;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string | null;
  featured_title: string;
  featured_color_from: string;
  featured_color_to: string;
  footer_title: string;
  footer_note: string;
};

export type Stat = {
  id: string;
  value: string;
  label: string;
  variant: "default" | "big";
  sort_order: number;
  is_visible: boolean;
};

export type Unit = {
  id: string;
  cluster_id: string;
  label: string;
  image_url: string | null;
  link_url: string | null;
  sort_order: number;
};

export type Cluster = {
  id: string;
  name: string;
  slug: string;
  nav_label: string | null;
  color_from: string;
  color_to: string;
  sort_order: number;
  is_published: boolean;
};

export type ClusterWithUnits = Cluster & { units: Unit[] };

export type MediaItem = {
  id: string;
  caption: string;
  image_url: string | null;
  link_url: string | null;
  orientation: "landscape" | "portrait";
  sort_order: number;
  is_visible: boolean;
};

export type SiteData = {
  settings: SiteSettings;
  stats: Stat[];
  clusters: ClusterWithUnits[];
  media: MediaItem[];
  /** true khi chưa kết nối được Supabase — trang đang dùng dữ liệu mẫu. */
  usingFallback: boolean;
};
