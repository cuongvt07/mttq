-- ============================================================================
-- PHUONG XANH — Dữ liệu mẫu (trích từ bản index.html tĩnh)
-- Chạy SAU schema.sql. Chạy lại nhiều lần vẫn an toàn (xoá & nạp lại clusters).
-- ============================================================================

-- ---------------------------------------------------------------- SETTINGS --
insert into public.site_settings (id) values (1)
on conflict (id) do nothing;

update public.site_settings set
  site_title    = 'Phong trào Toàn dân chung tay bảo vệ môi trường - Vì Thủ đô xanh - sạch - đẹp',
  brand_name    = 'THÀNH PHỐ HÀ NỘI',
  hero_title    = 'PHONG TRÀO "TOÀN DÂN CHUNG TAY BẢO VỆ MÔI TRƯỜNG, VÌ THỦ ĐÔ XANH – SẠCH – ĐẸP"',
  hero_subtitle = 'HÀ NỘI CHUNG TAY HÀNH ĐỘNG VÌ KHÔNG KHÍ SẠCH VÀ GIAO THÔNG XANH',
  footer_title  = 'PHONG TRÀO TOÀN DÂN CHUNG TAY BẢO VỆ MÔI TRƯỜNG, VÌ THỦ ĐÔ XANH – SẠCH – ĐẸP',
  footer_note   = '© 2026 — Trang thông tin phong trào.'
where id = 1;

-- ------------------------------------------------------------------- STATS --
delete from public.stats;
insert into public.stats (value, label, variant, sort_order) values
  ('126',       'Xã, phường tham gia phong trào',                        'default', 1),
  ('1.075.590', 'Người dân Thủ đô tham gia hưởng ứng ngày 04/6/2026',    'big',     2),
  ('5.370',     'Khu dân cư, tổ dân phố tham gia phong trào',            'default', 3);

-- ------------------------------------------------------------- MEDIA ITEMS --
delete from public.media_items;
insert into public.media_items (caption, orientation, sort_order) values
  ('Phát động toàn dân chung tay tham gia bảo vệ môi trường, giữ gìn Thủ đô xanh.', 'landscape', 1),
  ('Kế hoạch chung tay vì môi trường xanh và giao thông xanh của Thủ đô.',          'landscape', 2),
  ('Hà Nội chung tay hành động vì không khí sạch.',                                 'portrait',  3),
  ('Sản phẩm truyền thông của phong trào.',                                         'landscape', 4);

-- ---------------------------------------------------------------- CLUSTERS --
delete from public.clusters;  -- units bị xoá theo (on delete cascade)

insert into public.clusters (name, slug, nav_label, color_from, color_to, sort_order) values
  ('Các đơn vị Cụm 1',  'cum-1',  'Cụm 1',  '#e23b3b', '#b81f1f',  1),
  ('Các đơn vị Cụm 2',  'cum-2',  'Cụm 2',  '#f39325', '#d9741a',  2),
  ('Các đơn vị Cụm 3',  'cum-3',  'Cụm 3',  '#f2b418', '#e09b10',  3),
  ('Các đơn vị Cụm 4',  'cum-4',  'Cụm 4',  '#3ea55b', '#218a3f',  4),
  ('Các đơn vị Cụm 5',  'cum-5',  'Cụm 5',  '#28b0a6', '#158e86',  5),
  ('Các đơn vị Cụm 6',  'cum-6',  'Cụm 6',  '#4aa6e6', '#1f7fca',  6),
  ('Các đơn vị Cụm 7',  'cum-7',  'Cụm 7',  '#3f6fd6', '#2450b3',  7),
  ('Các đơn vị Cụm 8',  'cum-8',  'Cụm 8',  '#6a53c9', '#4a34a8',  8),
  ('Các đơn vị Cụm 9',  'cum-9',  'Cụm 9',  '#9a45c8', '#7a2fa8',  9),
  ('Các đơn vị Cụm 10', 'cum-10', 'Cụm 10', '#d64a9e', '#b21f7c', 10),
  ('Các đơn vị Cụm 11', 'cum-11', 'Cụm 11', '#8a97a5', '#5f6b78', 11);

-- ------------------------------------------------------------------- UNITS --
insert into public.units (cluster_id, label, sort_order)
select c.id, u.label, u.ord
from public.clusters c
join (values
  ('cum-1',  'Phường Cửa Nam',        1),
  ('cum-1',  'Phường Hàng Đào',       2),
  ('cum-1',  'Phường Hoàn Kiếm',      3),
  ('cum-1',  'Phường Ngọc Hà',        4),
  ('cum-1',  'Phường Ba Đình',        5),
  ('cum-1',  'Phường Kim Mã',         6),
  ('cum-1',  'Phường Giảng Võ',       7),
  ('cum-1',  'Phường Ô Chợ Dừa',      8),
  ('cum-1',  'Phường Láng',           9),
  ('cum-1',  'Phường Đống Đa',       10),

  ('cum-2',  'Phường Văn Miếu',       1),
  ('cum-2',  'Phường Khâm Thiên',     2),
  ('cum-2',  'Phường Trung Liệt',     3),
  ('cum-2',  'Phường Thịnh Quang',    4),
  ('cum-2',  'Phường Cát Linh',       5),
  ('cum-2',  'Phường Quốc Tử Giám',   6),
  ('cum-2',  'Phường Phương Liên',    7),
  ('cum-2',  'Phường Nam Đồng',       8),

  ('cum-3',  'Phường Ngọc Hà',        1),
  ('cum-3',  'Phường Cầu Giấy',       2),
  ('cum-3',  'Phường Dịch Vọng',      3),
  ('cum-3',  'Phường Yên Hòa',        4),
  ('cum-3',  'Phường Nghĩa Đô',       5),
  ('cum-3',  'Phường Quan Hoa',       6),
  ('cum-3',  'Phường Mai Dịch',       7),
  ('cum-3',  'Phường Trung Hòa',      8),

  ('cum-4',  'Phường Hà Đông',        1),
  ('cum-4',  'Phường Thanh Xuân',     2),
  ('cum-4',  'Phường Khương Đình',    3),
  ('cum-4',  'Phường Kiến Hưng',      4),
  ('cum-4',  'Phường Phương Liệt',    5),
  ('cum-4',  'Phường Yên Nghĩa',      6),
  ('cum-4',  'Phường Mỗ Lao',         7),
  ('cum-4',  'Phường Đại Mỗ',         8),

  ('cum-5',  'Xã Gia Lâm',            1),
  ('cum-5',  'Phường Việt Hưng',      2),
  ('cum-5',  'Phường Bồ Đề',          3),
  ('cum-5',  'Xã Bát Tràng',          4),
  ('cum-5',  'Xã Kim Thanh',          5),
  ('cum-5',  'Xã Yên Viên',           6),
  ('cum-5',  'Xã Thuận An',           7),

  ('cum-6',  'Xã Phúc Thọ',           1),
  ('cum-6',  'Xã Đông Anh',           2),
  ('cum-6',  'Xã Tiên Dương',         3),
  ('cum-6',  'Xã Kim Chung',          4),
  ('cum-6',  'Xã Hải Bối',            5),
  ('cum-6',  'Xã Vân Hà',             6),
  ('cum-6',  'Xã Vân Nội',            7),

  ('cum-7',  'Xã Sóc Sơn',            1),
  ('cum-7',  'Xã Trung Giã',          2),
  ('cum-7',  'Xã Thanh Trì',          3),
  ('cum-7',  'Xã Tân Minh',           4),
  ('cum-7',  'Xã Đông Xuân',          5),
  ('cum-7',  'Xã Đại Nghĩa',          6),
  ('cum-7',  'Xã Thượng Phúc',        7),

  ('cum-8',  'Phường Chương Mỹ',      1),
  ('cum-8',  'Xã Quốc Oai',           2),
  ('cum-8',  'Xã Phú Nghĩa',          3),
  ('cum-8',  'Xã Xuân Mai',           4),
  ('cum-8',  'Xã Đông Phú',           5),
  ('cum-8',  'Xã Hoàng Văn',          6),
  ('cum-8',  'Xã Phú Cát',            7),

  ('cum-9',  'Xã Ứng Hòa',            1),
  ('cum-9',  'Xã Vân Đình',           2),
  ('cum-9',  'Xã Trầm Lộng',          3),
  ('cum-9',  'Xã Sơn Công',           4),
  ('cum-9',  'Xã Hòa Xá',             5),
  ('cum-9',  'Xã Phù Lưu',            6),

  ('cum-10', 'Xã Phúc Thọ',           1),
  ('cum-10', 'Xã Hoài Đức',           2),
  ('cum-10', 'Xã An Khánh',           3),
  ('cum-10', 'Xã Thạch Thất',         4),
  ('cum-10', 'Xã Hạ Bằng',            5),
  ('cum-10', 'Xã Yên Bài',            6),
  ('cum-10', 'Xã Tản Lĩnh',           7),
  ('cum-10', 'Xã Cẩm Lĩnh',           8),

  ('cum-11', 'Phường Sơn Tây',        1),
  ('cum-11', 'Xã Đường Lâm',          2),
  ('cum-11', 'Xã Cổ Đông',            3),
  ('cum-11', 'Xã Xuân Sơn',           4),
  ('cum-11', 'Xã Ba Vì',              5),
  ('cum-11', 'Xã Minh Châu',          6)
) as u(slug, label, ord) on u.slug = c.slug;
