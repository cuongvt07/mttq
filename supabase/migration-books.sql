-- ============================================================================
-- Module Flip-book Builder: tự thiết kế sách lật ngay trong /admin
-- Chạy trong Supabase > SQL Editor. Chạy lại nhiều lần vẫn an toàn.
-- ============================================================================

create table if not exists public.books (
  id           uuid primary key default gen_random_uuid(),
  title        text not null default 'Sách mới',
  slug         text not null unique,
  /** tỉ lệ trang, áp dụng cho toàn bộ sách: '3:4' | '4:3' | 'a4' | '1:1' | '16:9' */
  page_ratio   text not null default '3:4',
  cover_url    text,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.book_pages (
  id          uuid primary key default gen_random_uuid(),
  book_id     uuid not null references public.books(id) on delete cascade,
  sort_order  int  not null default 0,
  background  text not null default '#ffffff',
  background_image text,
  /** mảng element: text | image, toạ độ theo hệ 800 x (800/ratio) */
  elements    jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists book_pages_book_idx on public.book_pages (book_id, sort_order);

-- --------------------------------------------------------------------- RLS --
alter table public.books      enable row level security;
alter table public.book_pages enable row level security;

drop policy if exists "public read books" on public.books;
create policy "public read books" on public.books
  for select to anon, authenticated using (true);

drop policy if exists "public read book_pages" on public.book_pages;
create policy "public read book_pages" on public.book_pages
  for select to anon, authenticated using (true);

drop policy if exists "authenticated write books" on public.books;
create policy "authenticated write books" on public.books
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated write book_pages" on public.book_pages;
create policy "authenticated write book_pages" on public.book_pages
  for all to authenticated using (true) with check (true);

-- Cập nhật updated_at khi sửa sách
create or replace function public.touch_book_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists books_touch_updated_at on public.books;
create trigger books_touch_updated_at before update on public.books
  for each row execute function public.touch_book_updated_at();
