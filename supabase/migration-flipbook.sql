-- ============================================================================
-- Thêm flip-book cho tin/hoạt động.
-- Mỗi thẻ tin = ảnh chính + tên tin + flip-book (Heyzine…) mở khi bấm vào.
-- Chạy trong Supabase > SQL Editor. Chạy lại nhiều lần vẫn an toàn.
-- ============================================================================

alter table public.units       add column if not exists flipbook_url text;
alter table public.media_items add column if not exists flipbook_url text;

comment on column public.units.flipbook_url is
  'Link flip-book (vd https://heyzine.com/flip-book/xxxx.html) — bấm vào thẻ sẽ mở ngay trong trang';
comment on column public.media_items.flipbook_url is
  'Link flip-book (vd https://heyzine.com/flip-book/xxxx.html) — bấm vào thẻ sẽ mở ngay trong trang';
