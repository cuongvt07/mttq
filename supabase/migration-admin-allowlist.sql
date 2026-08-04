-- ============================================================================
-- Danh sách email được quyền quản trị (dùng cho đăng nhập Google).
-- Khi bật Google OAuth, bất kỳ ai có tài khoản Google đều tạo được user trong
-- Supabase — nên quyền ghi phải dựa trên danh sách này, không phải chỉ cần
-- "đã đăng nhập".
-- Chạy trong Supabase > SQL Editor. Chạy lại nhiều lần vẫn an toàn.
-- ============================================================================

create table if not exists public.admin_emails (
  email      text primary key,
  note       text,
  created_at timestamptz not null default now()
);

alter table public.admin_emails enable row level security;

-- Người đang đăng nhập chỉ đọc được đúng dòng của mình (để biết mình có quyền
-- hay không). Thêm/xoá admin làm bằng SQL Editor hoặc service role.
drop policy if exists "self read admin_emails" on public.admin_emails;
create policy "self read admin_emails" on public.admin_emails
  for select to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

/** true nếu email trong JWT nằm trong danh sách quản trị. */
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_emails a
    where lower(a.email) = lower(nullif(auth.jwt() ->> 'email', ''))
  );
$$;

-- Không khoá cửa với các tài khoản email/mật khẩu đã tạo trước đó.
insert into public.admin_emails (email, note)
select distinct lower(u.email), 'tự thêm khi chạy migration'
from auth.users u
where u.email is not null
on conflict (email) do nothing;

-- ------------------------------------------------------------------ POLICIES --
-- Thay "chỉ cần authenticated" bằng "phải là admin" trên mọi bảng ghi được.

drop policy if exists "authenticated write site_settings" on public.site_settings;
create policy "admin write site_settings" on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "authenticated write stats" on public.stats;
create policy "admin write stats" on public.stats
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "authenticated write clusters" on public.clusters;
create policy "admin write clusters" on public.clusters
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "authenticated write units" on public.units;
create policy "admin write units" on public.units
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "authenticated write media_items" on public.media_items;
create policy "admin write media_items" on public.media_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "authenticated write books" on public.books;
create policy "admin write books" on public.books
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "authenticated write book_pages" on public.book_pages;
create policy "admin write book_pages" on public.book_pages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "authenticated write media bucket" on storage.objects;
create policy "admin write media bucket" on storage.objects
  for all to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

-- ---------------------------------------------------------------------------
-- Thêm một quản trị viên mới:
--   insert into public.admin_emails (email, note) values ('ai-do@gmail.com', 'Tên')
--   on conflict (email) do nothing;
-- Gỡ quyền:
--   delete from public.admin_emails where email = 'ai-do@gmail.com';
-- ---------------------------------------------------------------------------
