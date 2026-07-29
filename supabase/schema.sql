-- ============================================================================
-- PHUONG XANH — Schema Supabase
-- Chạy toàn bộ file này trong Supabase Dashboard > SQL Editor
-- ============================================================================

-- ---------------------------------------------------------------- SETTINGS --
-- Bảng 1 dòng duy nhất (id = 1) chứa cấu hình chung của site.
create table if not exists public.site_settings (
  id                 int primary key default 1,
  site_title         text not null default 'Phong trào Toàn dân chung tay bảo vệ môi trường',
  brand_name         text not null default 'THÀNH PHỐ HÀ NỘI',
  brand_logo_url     text,
  hero_title         text not null default 'PHONG TRÀO "TOÀN DÂN CHUNG TAY BẢO VỆ MÔI TRƯỜNG, VÌ THỦ ĐÔ XANH – SẠCH – ĐẸP"',
  hero_subtitle      text not null default 'HÀ NỘI CHUNG TAY HÀNH ĐỘNG VÌ KHÔNG KHÍ SẠCH VÀ GIAO THÔNG XANH',
  hero_image_url     text,          -- để trống => dùng hình minh hoạ SVG mặc định
  featured_title     text not null default 'Mặt trận Tổ quốc Việt Nam TP. Hà Nội',
  featured_color_from text not null default '#ffb638',
  featured_color_to   text not null default '#ff8f1f',
  footer_title       text not null default 'PHONG TRÀO TOÀN DÂN CHUNG TAY BẢO VỆ MÔI TRƯỜNG, VÌ THỦ ĐÔ XANH – SẠCH – ĐẸP',
  footer_note        text not null default '© 2026 — Trang thông tin phong trào.',
  updated_at         timestamptz not null default now(),
  constraint site_settings_singleton check (id = 1)
);

-- ------------------------------------------------------------------- STATS --
-- Các ô số liệu nổi trên hero.
create table if not exists public.stats (
  id          uuid primary key default gen_random_uuid(),
  value       text not null,
  label       text not null,
  variant     text not null default 'default',   -- 'default' | 'big' (ô cam lớn)
  sort_order  int  not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  constraint stats_variant_check check (variant in ('default', 'big'))
);

-- ---------------------------------------------------------------- CLUSTERS --
-- Mỗi "Cụm" là một section màu riêng.
create table if not exists public.clusters (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,             -- dùng cho anchor #slug
  nav_label    text,                             -- nhãn hiển thị trên menu, vd "Cụm 1"
  color_from   text not null default '#4aa6e6',
  color_to     text not null default '#1f7fca',
  sort_order   int  not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------------- UNITS --
-- Đơn vị (phường/xã) bên trong một cụm.
create table if not exists public.units (
  id          uuid primary key default gen_random_uuid(),
  cluster_id  uuid not null references public.clusters(id) on delete cascade,
  label       text not null,
  image_url   text,
  link_url    text,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists units_cluster_id_idx on public.units (cluster_id, sort_order);

-- ------------------------------------------------------------- MEDIA ITEMS --
-- Khối "Mặt trận Tổ quốc" (ảnh/video nổi bật) ngay dưới hero.
create table if not exists public.media_items (
  id          uuid primary key default gen_random_uuid(),
  caption     text not null default '',
  image_url   text,
  link_url    text,
  orientation text not null default 'landscape',  -- 'landscape' | 'portrait'
  sort_order  int  not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  constraint media_orientation_check check (orientation in ('landscape', 'portrait'))
);

-- --------------------------------------------------------------------- RLS --
alter table public.site_settings enable row level security;
alter table public.stats         enable row level security;
alter table public.clusters      enable row level security;
alter table public.units         enable row level security;
alter table public.media_items   enable row level security;

-- Ai cũng đọc được (site công khai)
drop policy if exists "public read site_settings" on public.site_settings;
create policy "public read site_settings" on public.site_settings for select to anon, authenticated using (true);

drop policy if exists "public read stats" on public.stats;
create policy "public read stats" on public.stats for select to anon, authenticated using (true);

drop policy if exists "public read clusters" on public.clusters;
create policy "public read clusters" on public.clusters for select to anon, authenticated using (true);

drop policy if exists "public read units" on public.units;
create policy "public read units" on public.units for select to anon, authenticated using (true);

drop policy if exists "public read media_items" on public.media_items;
create policy "public read media_items" on public.media_items for select to anon, authenticated using (true);

-- Chỉ tài khoản đã đăng nhập mới được ghi (dùng cho trang /admin)
drop policy if exists "authenticated write site_settings" on public.site_settings;
create policy "authenticated write site_settings" on public.site_settings for all to authenticated using (true) with check (true);

drop policy if exists "authenticated write stats" on public.stats;
create policy "authenticated write stats" on public.stats for all to authenticated using (true) with check (true);

drop policy if exists "authenticated write clusters" on public.clusters;
create policy "authenticated write clusters" on public.clusters for all to authenticated using (true) with check (true);

drop policy if exists "authenticated write units" on public.units;
create policy "authenticated write units" on public.units for all to authenticated using (true) with check (true);

drop policy if exists "authenticated write media_items" on public.media_items;
create policy "authenticated write media_items" on public.media_items for all to authenticated using (true) with check (true);

-- ----------------------------------------------------------------- STORAGE --
-- Bucket công khai chứa ảnh đơn vị / ảnh nổi bật.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "public read media bucket" on storage.objects;
create policy "public read media bucket" on storage.objects
  for select to anon, authenticated using (bucket_id = 'media');

drop policy if exists "authenticated write media bucket" on storage.objects;
create policy "authenticated write media bucket" on storage.objects
  for all to authenticated using (bucket_id = 'media') with check (bucket_id = 'media');
