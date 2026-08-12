-- ============================================================================
-- Thêm quản trị viên: phamthily@gmail.com
--
-- Chạy trong Supabase Dashboard > SQL Editor. Chạy lại nhiều lần vẫn an toàn.
--
-- Gồm 2 việc, vì đăng nhập được cần CẢ HAI:
--   1. Có tài khoản trong auth.users  (email + mật khẩu)
--   2. Email nằm trong public.admin_emails  (mới qua được cổng quyền quản trị)
-- ============================================================================

-- cần cho crypt()/gen_salt(); Supabase thường bật sẵn
create extension if not exists pgcrypto;

-- ------------------------------------------------------------ 1. tài khoản --
-- Nếu đã tạo bằng Dashboard > Authentication > Add user thì khối này tự bỏ qua.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'phamthily@gmail.com',
  crypt('12345678', gen_salt('bf')),
  now(),                                   -- xác nhận email luôn, khỏi phải bấm link
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb
where not exists (
  select 1 from auth.users where lower(email) = 'phamthily@gmail.com'
);

-- Supabase cần thêm dòng identity tương ứng thì đăng nhập bằng mật khẩu mới chạy.
insert into auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select
  u.id::text,
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email',
  now(), now(), now()
from auth.users u
where lower(u.email) = 'phamthily@gmail.com'
  and not exists (
    select 1 from auth.identities i
    where i.user_id = u.id and i.provider = 'email'
  );

-- ------------------------------------------------------------ 2. cấp quyền --
insert into public.admin_emails (email, note)
values ('phamthily@gmail.com', 'Phạm Thị Ly')
on conflict (email) do nothing;

-- --------------------------------------------------------------- kiểm tra --
select
  u.email,
  u.email_confirmed_at is not null            as da_xac_nhan_email,
  exists (select 1 from auth.identities i
          where i.user_id = u.id and i.provider = 'email') as co_identity,
  exists (select 1 from public.admin_emails a
          where lower(a.email) = lower(u.email))           as co_quyen_quan_tri
from auth.users u
where lower(u.email) = 'phamthily@gmail.com';
