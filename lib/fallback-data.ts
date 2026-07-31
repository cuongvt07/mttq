import type { MediaItem, SiteData, SiteSettings, Stat } from "./types";

/**
 * Dữ liệu dự phòng: dùng khi chưa chạy schema.sql / chưa có kết nối Supabase,
 * để trang vẫn hiển thị đầy đủ như bản HTML tĩnh ban đầu.
 */

export const FALLBACK_SETTINGS: SiteSettings = {
  id: 1,
  site_title:
    "Phong trào Toàn dân chung tay bảo vệ môi trường - Vì Thủ đô xanh - sạch - đẹp",
  brand_name: "THÀNH PHỐ HÀ NỘI",
  brand_logo_url: null,
  hero_title:
    'PHONG TRÀO "TOÀN DÂN CHUNG TAY BẢO VỆ MÔI TRƯỜNG, VÌ THỦ ĐÔ XANH – SẠCH – ĐẸP"',
  hero_subtitle: "HÀ NỘI CHUNG TAY HÀNH ĐỘNG VÌ KHÔNG KHÍ SẠCH VÀ GIAO THÔNG XANH",
  hero_image_url: null,
  featured_title: "Mặt trận Tổ quốc Việt Nam TP. Hà Nội",
  featured_color_from: "#ffb638",
  featured_color_to: "#ff8f1f",
  footer_title:
    "PHONG TRÀO TOÀN DÂN CHUNG TAY BẢO VỆ MÔI TRƯỜNG, VÌ THỦ ĐÔ XANH – SẠCH – ĐẸP",
  footer_note: "© 2026 — Trang thông tin phong trào.",
};

export const FALLBACK_STATS: Stat[] = [
  { id: "s1", value: "126", label: "Xã, phường tham gia phong trào", variant: "default", sort_order: 1, is_visible: true },
  { id: "s2", value: "1.075.590", label: "Người dân Thủ đô tham gia hưởng ứng ngày 04/6/2026", variant: "big", sort_order: 2, is_visible: true },
  { id: "s3", value: "5.370", label: "Khu dân cư, tổ dân phố tham gia phong trào", variant: "default", sort_order: 3, is_visible: true },
];

export const FALLBACK_MEDIA: MediaItem[] = [
  { id: "m1", caption: "Phát động toàn dân chung tay tham gia bảo vệ môi trường, giữ gìn Thủ đô xanh.", image_url: null, link_url: null, flipbook_url: null, orientation: "landscape", sort_order: 1, is_visible: true },
  { id: "m2", caption: "Kế hoạch chung tay vì môi trường xanh và giao thông xanh của Thủ đô.", image_url: null, link_url: null, flipbook_url: null, orientation: "landscape", sort_order: 2, is_visible: true },
  { id: "m3", caption: "Hà Nội chung tay hành động vì không khí sạch.", image_url: null, link_url: null, flipbook_url: null, orientation: "portrait", sort_order: 3, is_visible: true },
  { id: "m4", caption: "Sản phẩm truyền thông của phong trào.", image_url: null, link_url: null, flipbook_url: null, orientation: "landscape", sort_order: 4, is_visible: true },
];

const RAW_CLUSTERS: Array<{
  name: string;
  colors: [string, string];
  units: string[];
}> = [
  { name: "Các đơn vị Cụm 1", colors: ["#e23b3b", "#b81f1f"], units: ["Phường Cửa Nam", "Phường Hàng Đào", "Phường Hoàn Kiếm", "Phường Ngọc Hà", "Phường Ba Đình", "Phường Kim Mã", "Phường Giảng Võ", "Phường Ô Chợ Dừa", "Phường Láng", "Phường Đống Đa"] },
  { name: "Các đơn vị Cụm 2", colors: ["#f39325", "#d9741a"], units: ["Phường Văn Miếu", "Phường Khâm Thiên", "Phường Trung Liệt", "Phường Thịnh Quang", "Phường Cát Linh", "Phường Quốc Tử Giám", "Phường Phương Liên", "Phường Nam Đồng"] },
  { name: "Các đơn vị Cụm 3", colors: ["#f2b418", "#e09b10"], units: ["Phường Ngọc Hà", "Phường Cầu Giấy", "Phường Dịch Vọng", "Phường Yên Hòa", "Phường Nghĩa Đô", "Phường Quan Hoa", "Phường Mai Dịch", "Phường Trung Hòa"] },
  { name: "Các đơn vị Cụm 4", colors: ["#3ea55b", "#218a3f"], units: ["Phường Hà Đông", "Phường Thanh Xuân", "Phường Khương Đình", "Phường Kiến Hưng", "Phường Phương Liệt", "Phường Yên Nghĩa", "Phường Mỗ Lao", "Phường Đại Mỗ"] },
  { name: "Các đơn vị Cụm 5", colors: ["#28b0a6", "#158e86"], units: ["Xã Gia Lâm", "Phường Việt Hưng", "Phường Bồ Đề", "Xã Bát Tràng", "Xã Kim Thanh", "Xã Yên Viên", "Xã Thuận An"] },
  { name: "Các đơn vị Cụm 6", colors: ["#4aa6e6", "#1f7fca"], units: ["Xã Phúc Thọ", "Xã Đông Anh", "Xã Tiên Dương", "Xã Kim Chung", "Xã Hải Bối", "Xã Vân Hà", "Xã Vân Nội"] },
  { name: "Các đơn vị Cụm 7", colors: ["#3f6fd6", "#2450b3"], units: ["Xã Sóc Sơn", "Xã Trung Giã", "Xã Thanh Trì", "Xã Tân Minh", "Xã Đông Xuân", "Xã Đại Nghĩa", "Xã Thượng Phúc"] },
  { name: "Các đơn vị Cụm 8", colors: ["#6a53c9", "#4a34a8"], units: ["Phường Chương Mỹ", "Xã Quốc Oai", "Xã Phú Nghĩa", "Xã Xuân Mai", "Xã Đông Phú", "Xã Hoàng Văn", "Xã Phú Cát"] },
  { name: "Các đơn vị Cụm 9", colors: ["#9a45c8", "#7a2fa8"], units: ["Xã Ứng Hòa", "Xã Vân Đình", "Xã Trầm Lộng", "Xã Sơn Công", "Xã Hòa Xá", "Xã Phù Lưu"] },
  { name: "Các đơn vị Cụm 10", colors: ["#d64a9e", "#b21f7c"], units: ["Xã Phúc Thọ", "Xã Hoài Đức", "Xã An Khánh", "Xã Thạch Thất", "Xã Hạ Bằng", "Xã Yên Bài", "Xã Tản Lĩnh", "Xã Cẩm Lĩnh"] },
  { name: "Các đơn vị Cụm 11", colors: ["#8a97a5", "#5f6b78"], units: ["Phường Sơn Tây", "Xã Đường Lâm", "Xã Cổ Đông", "Xã Xuân Sơn", "Xã Ba Vì", "Xã Minh Châu"] },
];

export const FALLBACK_CLUSTERS: SiteData["clusters"] = RAW_CLUSTERS.map((c, i) => ({
  id: `c${i + 1}`,
  name: c.name,
  slug: `cum-${i + 1}`,
  nav_label: `Cụm ${i + 1}`,
  color_from: c.colors[0],
  color_to: c.colors[1],
  sort_order: i + 1,
  is_published: true,
  units: c.units.map((label, j) => ({
    id: `c${i + 1}-u${j + 1}`,
    cluster_id: `c${i + 1}`,
    label,
    image_url: null,
    link_url: null,
    flipbook_url: null,
    sort_order: j + 1,
  })),
}));

export const FALLBACK_SITE_DATA: SiteData = {
  settings: FALLBACK_SETTINGS,
  stats: FALLBACK_STATS,
  clusters: FALLBACK_CLUSTERS,
  media: FALLBACK_MEDIA,
  usingFallback: true,
};
