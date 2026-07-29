-- ============================================================================
-- Dữ liệu: Uỷ ban MTTQ Việt Nam phường Yên Nghĩa
-- 15 Ban Công tác Mặt trận Tổ dân phố (Quyết định 15/QĐ-MTTQ-BTT ngày 30/6/2026),
-- mỗi ban 6 hoạt động. Ảnh và tên hoạt động là DEMO — sửa lại trong /admin.
--
-- Chạy sau schema.sql. Chạy lại nhiều lần vẫn an toàn.
-- ============================================================================

-- ---------------------------------------------------------------- SETTINGS --
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

update public.site_settings set
  site_title      = 'Các hoạt động của Uỷ ban MTTQ Việt Nam phường Yên Nghĩa',
  brand_name      = 'UỶ BAN MTTQ VIỆT NAM PHƯỜNG YÊN NGHĨA',
  hero_title      = 'CÁC HOẠT ĐỘNG CỦA UỶ BAN MTTQ VIỆT NAM
PHƯỜNG YÊN NGHĨA',
  hero_subtitle   = '15 BAN CÔNG TÁC MẶT TRẬN TẠI 15 TỔ DÂN PHỐ TRỰC THUỘC',
  featured_title  = 'Hoạt động chung của Uỷ ban MTTQ Việt Nam phường Yên Nghĩa',
  footer_title    = 'CÁC HOẠT ĐỘNG CỦA UỶ BAN MTTQ VIỆT NAM PHƯỜNG YÊN NGHĨA',
  footer_note     = '© 2026 — 15 Ban Công tác Mặt trận tại 15 Tổ dân phố trực thuộc.'
where id = 1;

-- ------------------------------------------------------------------- STATS --
delete from public.stats;
insert into public.stats (value, label, variant, sort_order) values
  ('15',        'Ban Công tác Mặt trận Tổ dân phố',        'default', 1),
  ('2025–2028', 'Nhiệm kỳ hoạt động',                      'big',     2),
  ('15',        'Tổ dân phố trực thuộc phường Yên Nghĩa',  'default', 3);

-- ------------------------------------------------------------- MEDIA ITEMS --
delete from public.media_items;
insert into public.media_items (caption, image_url, orientation, sort_order) values
  ('Tổ chức các hoạt động tuyên truyền, vận động và tập hợp khối đại đoàn kết toàn dân.', '/demo/hoat-dong-1.webp', 'landscape', 1),
  ('Triển khai phong trào thi đua, bảo vệ môi trường và xây dựng khu dân cư văn minh.',   '/demo/hoat-dong-2.webp', 'landscape', 2),
  ('Chăm lo an sinh xã hội và hỗ trợ các gia đình có hoàn cảnh khó khăn.',                '/demo/hoat-dong-3.webp', 'landscape', 3),
  ('Biểu dương tập thể, cá nhân và các mô hình tiêu biểu tại địa phương.',                '/demo/hoat-dong-4.webp', 'landscape', 4);

-- ------------------------------------------------------- BAN CÔNG TÁC MẶT TRẬN --
delete from public.clusters;  -- units xoá theo (on delete cascade)

insert into public.clusters (name, slug, nav_label, color_from, color_to, sort_order) values
  ('Ban Công tác Mặt trận Tổ dân phố Do Lộ', 'tdp-do-lo', 'Do Lộ', '#e23b3b', '#b81f1f', 1),
  ('Ban Công tác Mặt trận Tổ dân phố An Định', 'tdp-an-dinh', 'An Định', '#f39325', '#d9741a', 2),
  ('Ban Công tác Mặt trận Tổ dân phố Quyết Thắng', 'tdp-quyet-thang', 'Quyết Thắng', '#f2b418', '#e09b10', 3),
  ('Ban Công tác Mặt trận Tổ dân phố Trung Hưng', 'tdp-trung-hung', 'Trung Hưng', '#3ea55b', '#218a3f', 4),
  ('Ban Công tác Mặt trận Tổ dân phố Quốc An', 'tdp-quoc-an', 'Quốc An', '#28b0a6', '#158e86', 5),
  ('Ban Công tác Mặt trận Tổ dân phố Yên Phúc', 'tdp-yen-phuc', 'Yên Phúc', '#4aa6e6', '#1f7fca', 6),
  ('Ban Công tác Mặt trận Tổ dân phố An Lạc', 'tdp-an-lac', 'An Lạc', '#3f6fd6', '#2450b3', 7),
  ('Ban Công tác Mặt trận Tổ dân phố Yên Bình', 'tdp-yen-binh', 'Yên Bình', '#6a53c9', '#4a34a8', 8),
  ('Ban Công tác Mặt trận Tổ dân phố Hòa Bình', 'tdp-hoa-binh', 'Hòa Bình', '#9a45c8', '#7a2fa8', 9),
  ('Ban Công tác Mặt trận Tổ dân phố Yên Hòa', 'tdp-yen-hoa', 'Yên Hòa', '#d64a9e', '#b21f7c', 10),
  ('Ban Công tác Mặt trận Tổ dân phố Cổ Bản', 'tdp-co-ban', 'Cổ Bản', '#8a97a5', '#5f6b78', 11),
  ('Ban Công tác Mặt trận Tổ dân phố Đồng Hoàng', 'tdp-dong-hoang', 'Đồng Hoàng', '#d9573f', '#a93628', 12),
  ('Ban Công tác Mặt trận Tổ dân phố Đồng Dương', 'tdp-dong-duong', 'Đồng Dương', '#1199a8', '#087580', 13),
  ('Ban Công tác Mặt trận Tổ dân phố Nhân Huệ', 'tdp-nhan-hue', 'Nhân Huệ', '#7f58bc', '#593497', 14),
  ('Ban Công tác Mặt trận Tổ dân phố Nhân Sơn', 'tdp-nhan-son', 'Nhân Sơn', '#2567a8', '#154774', 15);

insert into public.units (cluster_id, label, image_url, sort_order)
select c.id, u.label, u.image_url, u.ord
from public.clusters c
join (values
  ('tdp-do-lo', 'Hội nghị triển khai nhiệm vụ công tác Mặt trận', '/demo/hoat-dong-1.webp', 1),
  ('tdp-do-lo', 'Ra quân vệ sinh môi trường tại khu dân cư', '/demo/hoat-dong-2.webp', 2),
  ('tdp-do-lo', 'Tuyên truyền xây dựng nếp sống văn minh', '/demo/hoat-dong-3.webp', 3),
  ('tdp-do-lo', 'Chăm lo, thăm hỏi gia đình có hoàn cảnh khó khăn', '/demo/hoat-dong-4.webp', 4),
  ('tdp-do-lo', 'Ngày hội Đại đoàn kết toàn dân tộc', '/demo/hoat-dong-5.webp', 5),
  ('tdp-do-lo', 'Biểu dương mô hình và cá nhân tiêu biểu', '/demo/hoat-dong-1.webp', 6),
  ('tdp-an-dinh', 'Ra quân vệ sinh môi trường tại khu dân cư', '/demo/hoat-dong-3.webp', 1),
  ('tdp-an-dinh', 'Tuyên truyền xây dựng nếp sống văn minh', '/demo/hoat-dong-4.webp', 2),
  ('tdp-an-dinh', 'Chăm lo, thăm hỏi gia đình có hoàn cảnh khó khăn', '/demo/hoat-dong-5.webp', 3),
  ('tdp-an-dinh', 'Ngày hội Đại đoàn kết toàn dân tộc', '/demo/hoat-dong-1.webp', 4),
  ('tdp-an-dinh', 'Biểu dương mô hình và cá nhân tiêu biểu', '/demo/hoat-dong-2.webp', 5),
  ('tdp-an-dinh', 'Vận động nhân dân tham gia phong trào thi đua', '/demo/hoat-dong-3.webp', 6),
  ('tdp-quyet-thang', 'Tuyên truyền xây dựng nếp sống văn minh', '/demo/hoat-dong-5.webp', 1),
  ('tdp-quyet-thang', 'Chăm lo, thăm hỏi gia đình có hoàn cảnh khó khăn', '/demo/hoat-dong-1.webp', 2),
  ('tdp-quyet-thang', 'Ngày hội Đại đoàn kết toàn dân tộc', '/demo/hoat-dong-2.webp', 3),
  ('tdp-quyet-thang', 'Biểu dương mô hình và cá nhân tiêu biểu', '/demo/hoat-dong-3.webp', 4),
  ('tdp-quyet-thang', 'Vận động nhân dân tham gia phong trào thi đua', '/demo/hoat-dong-4.webp', 5),
  ('tdp-quyet-thang', 'Sinh hoạt cộng đồng tại tổ dân phố', '/demo/hoat-dong-5.webp', 6),
  ('tdp-trung-hung', 'Chăm lo, thăm hỏi gia đình có hoàn cảnh khó khăn', '/demo/hoat-dong-2.webp', 1),
  ('tdp-trung-hung', 'Ngày hội Đại đoàn kết toàn dân tộc', '/demo/hoat-dong-3.webp', 2),
  ('tdp-trung-hung', 'Biểu dương mô hình và cá nhân tiêu biểu', '/demo/hoat-dong-4.webp', 3),
  ('tdp-trung-hung', 'Vận động nhân dân tham gia phong trào thi đua', '/demo/hoat-dong-5.webp', 4),
  ('tdp-trung-hung', 'Sinh hoạt cộng đồng tại tổ dân phố', '/demo/hoat-dong-1.webp', 5),
  ('tdp-trung-hung', 'Hội nghị triển khai nhiệm vụ công tác Mặt trận', '/demo/hoat-dong-2.webp', 6),
  ('tdp-quoc-an', 'Ngày hội Đại đoàn kết toàn dân tộc', '/demo/hoat-dong-4.webp', 1),
  ('tdp-quoc-an', 'Biểu dương mô hình và cá nhân tiêu biểu', '/demo/hoat-dong-5.webp', 2),
  ('tdp-quoc-an', 'Vận động nhân dân tham gia phong trào thi đua', '/demo/hoat-dong-1.webp', 3),
  ('tdp-quoc-an', 'Sinh hoạt cộng đồng tại tổ dân phố', '/demo/hoat-dong-2.webp', 4),
  ('tdp-quoc-an', 'Hội nghị triển khai nhiệm vụ công tác Mặt trận', '/demo/hoat-dong-3.webp', 5),
  ('tdp-quoc-an', 'Ra quân vệ sinh môi trường tại khu dân cư', '/demo/hoat-dong-4.webp', 6),
  ('tdp-yen-phuc', 'Biểu dương mô hình và cá nhân tiêu biểu', '/demo/hoat-dong-1.webp', 1),
  ('tdp-yen-phuc', 'Vận động nhân dân tham gia phong trào thi đua', '/demo/hoat-dong-2.webp', 2),
  ('tdp-yen-phuc', 'Sinh hoạt cộng đồng tại tổ dân phố', '/demo/hoat-dong-3.webp', 3),
  ('tdp-yen-phuc', 'Hội nghị triển khai nhiệm vụ công tác Mặt trận', '/demo/hoat-dong-4.webp', 4),
  ('tdp-yen-phuc', 'Ra quân vệ sinh môi trường tại khu dân cư', '/demo/hoat-dong-5.webp', 5),
  ('tdp-yen-phuc', 'Tuyên truyền xây dựng nếp sống văn minh', '/demo/hoat-dong-1.webp', 6),
  ('tdp-an-lac', 'Vận động nhân dân tham gia phong trào thi đua', '/demo/hoat-dong-3.webp', 1),
  ('tdp-an-lac', 'Sinh hoạt cộng đồng tại tổ dân phố', '/demo/hoat-dong-4.webp', 2),
  ('tdp-an-lac', 'Hội nghị triển khai nhiệm vụ công tác Mặt trận', '/demo/hoat-dong-5.webp', 3),
  ('tdp-an-lac', 'Ra quân vệ sinh môi trường tại khu dân cư', '/demo/hoat-dong-1.webp', 4),
  ('tdp-an-lac', 'Tuyên truyền xây dựng nếp sống văn minh', '/demo/hoat-dong-2.webp', 5),
  ('tdp-an-lac', 'Chăm lo, thăm hỏi gia đình có hoàn cảnh khó khăn', '/demo/hoat-dong-3.webp', 6),
  ('tdp-yen-binh', 'Sinh hoạt cộng đồng tại tổ dân phố', '/demo/hoat-dong-5.webp', 1),
  ('tdp-yen-binh', 'Hội nghị triển khai nhiệm vụ công tác Mặt trận', '/demo/hoat-dong-1.webp', 2),
  ('tdp-yen-binh', 'Ra quân vệ sinh môi trường tại khu dân cư', '/demo/hoat-dong-2.webp', 3),
  ('tdp-yen-binh', 'Tuyên truyền xây dựng nếp sống văn minh', '/demo/hoat-dong-3.webp', 4),
  ('tdp-yen-binh', 'Chăm lo, thăm hỏi gia đình có hoàn cảnh khó khăn', '/demo/hoat-dong-4.webp', 5),
  ('tdp-yen-binh', 'Ngày hội Đại đoàn kết toàn dân tộc', '/demo/hoat-dong-5.webp', 6),
  ('tdp-hoa-binh', 'Hội nghị triển khai nhiệm vụ công tác Mặt trận', '/demo/hoat-dong-2.webp', 1),
  ('tdp-hoa-binh', 'Ra quân vệ sinh môi trường tại khu dân cư', '/demo/hoat-dong-3.webp', 2),
  ('tdp-hoa-binh', 'Tuyên truyền xây dựng nếp sống văn minh', '/demo/hoat-dong-4.webp', 3),
  ('tdp-hoa-binh', 'Chăm lo, thăm hỏi gia đình có hoàn cảnh khó khăn', '/demo/hoat-dong-5.webp', 4),
  ('tdp-hoa-binh', 'Ngày hội Đại đoàn kết toàn dân tộc', '/demo/hoat-dong-1.webp', 5),
  ('tdp-hoa-binh', 'Biểu dương mô hình và cá nhân tiêu biểu', '/demo/hoat-dong-2.webp', 6),
  ('tdp-yen-hoa', 'Ra quân vệ sinh môi trường tại khu dân cư', '/demo/hoat-dong-4.webp', 1),
  ('tdp-yen-hoa', 'Tuyên truyền xây dựng nếp sống văn minh', '/demo/hoat-dong-5.webp', 2),
  ('tdp-yen-hoa', 'Chăm lo, thăm hỏi gia đình có hoàn cảnh khó khăn', '/demo/hoat-dong-1.webp', 3),
  ('tdp-yen-hoa', 'Ngày hội Đại đoàn kết toàn dân tộc', '/demo/hoat-dong-2.webp', 4),
  ('tdp-yen-hoa', 'Biểu dương mô hình và cá nhân tiêu biểu', '/demo/hoat-dong-3.webp', 5),
  ('tdp-yen-hoa', 'Vận động nhân dân tham gia phong trào thi đua', '/demo/hoat-dong-4.webp', 6),
  ('tdp-co-ban', 'Tuyên truyền xây dựng nếp sống văn minh', '/demo/hoat-dong-1.webp', 1),
  ('tdp-co-ban', 'Chăm lo, thăm hỏi gia đình có hoàn cảnh khó khăn', '/demo/hoat-dong-2.webp', 2),
  ('tdp-co-ban', 'Ngày hội Đại đoàn kết toàn dân tộc', '/demo/hoat-dong-3.webp', 3),
  ('tdp-co-ban', 'Biểu dương mô hình và cá nhân tiêu biểu', '/demo/hoat-dong-4.webp', 4),
  ('tdp-co-ban', 'Vận động nhân dân tham gia phong trào thi đua', '/demo/hoat-dong-5.webp', 5),
  ('tdp-co-ban', 'Sinh hoạt cộng đồng tại tổ dân phố', '/demo/hoat-dong-1.webp', 6),
  ('tdp-dong-hoang', 'Chăm lo, thăm hỏi gia đình có hoàn cảnh khó khăn', '/demo/hoat-dong-3.webp', 1),
  ('tdp-dong-hoang', 'Ngày hội Đại đoàn kết toàn dân tộc', '/demo/hoat-dong-4.webp', 2),
  ('tdp-dong-hoang', 'Biểu dương mô hình và cá nhân tiêu biểu', '/demo/hoat-dong-5.webp', 3),
  ('tdp-dong-hoang', 'Vận động nhân dân tham gia phong trào thi đua', '/demo/hoat-dong-1.webp', 4),
  ('tdp-dong-hoang', 'Sinh hoạt cộng đồng tại tổ dân phố', '/demo/hoat-dong-2.webp', 5),
  ('tdp-dong-hoang', 'Hội nghị triển khai nhiệm vụ công tác Mặt trận', '/demo/hoat-dong-3.webp', 6),
  ('tdp-dong-duong', 'Ngày hội Đại đoàn kết toàn dân tộc', '/demo/hoat-dong-5.webp', 1),
  ('tdp-dong-duong', 'Biểu dương mô hình và cá nhân tiêu biểu', '/demo/hoat-dong-1.webp', 2),
  ('tdp-dong-duong', 'Vận động nhân dân tham gia phong trào thi đua', '/demo/hoat-dong-2.webp', 3),
  ('tdp-dong-duong', 'Sinh hoạt cộng đồng tại tổ dân phố', '/demo/hoat-dong-3.webp', 4),
  ('tdp-dong-duong', 'Hội nghị triển khai nhiệm vụ công tác Mặt trận', '/demo/hoat-dong-4.webp', 5),
  ('tdp-dong-duong', 'Ra quân vệ sinh môi trường tại khu dân cư', '/demo/hoat-dong-5.webp', 6),
  ('tdp-nhan-hue', 'Biểu dương mô hình và cá nhân tiêu biểu', '/demo/hoat-dong-2.webp', 1),
  ('tdp-nhan-hue', 'Vận động nhân dân tham gia phong trào thi đua', '/demo/hoat-dong-3.webp', 2),
  ('tdp-nhan-hue', 'Sinh hoạt cộng đồng tại tổ dân phố', '/demo/hoat-dong-4.webp', 3),
  ('tdp-nhan-hue', 'Hội nghị triển khai nhiệm vụ công tác Mặt trận', '/demo/hoat-dong-5.webp', 4),
  ('tdp-nhan-hue', 'Ra quân vệ sinh môi trường tại khu dân cư', '/demo/hoat-dong-1.webp', 5),
  ('tdp-nhan-hue', 'Tuyên truyền xây dựng nếp sống văn minh', '/demo/hoat-dong-2.webp', 6),
  ('tdp-nhan-son', 'Vận động nhân dân tham gia phong trào thi đua', '/demo/hoat-dong-4.webp', 1),
  ('tdp-nhan-son', 'Sinh hoạt cộng đồng tại tổ dân phố', '/demo/hoat-dong-5.webp', 2),
  ('tdp-nhan-son', 'Hội nghị triển khai nhiệm vụ công tác Mặt trận', '/demo/hoat-dong-1.webp', 3),
  ('tdp-nhan-son', 'Ra quân vệ sinh môi trường tại khu dân cư', '/demo/hoat-dong-2.webp', 4),
  ('tdp-nhan-son', 'Tuyên truyền xây dựng nếp sống văn minh', '/demo/hoat-dong-3.webp', 5),
  ('tdp-nhan-son', 'Chăm lo, thăm hỏi gia đình có hoàn cảnh khó khăn', '/demo/hoat-dong-4.webp', 6)
) as u(slug, label, image_url, ord) on u.slug = c.slug;
