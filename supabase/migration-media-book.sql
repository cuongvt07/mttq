-- ============================================================================
-- Mục trong khối "Hoạt động chung" có thể trỏ thẳng tới một cuốn sách lật.
-- Khi đã chọn sách thì ảnh và tiêu đề lấy tự động từ sách, không phải nhập.
-- Chạy lại nhiều lần vẫn an toàn.
-- ============================================================================

alter table public.media_items
  add column if not exists book_id uuid references public.books(id) on delete set null;

comment on column public.media_items.book_id is
  'Trỏ tới sách lật — ảnh bìa và tên sách hiển thị tự động, bấm vào mở /sach/<slug>';
