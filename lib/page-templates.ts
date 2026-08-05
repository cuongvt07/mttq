/**
 * Nền trang mẫu — người dùng bấm chọn thay vì tự chỉnh màu và đường dẫn ảnh.
 * Ảnh sinh bởi scripts/make-page-templates.mjs.
 */
export type PageTemplate = {
  id: string;
  ten: string;
  /** màu nền dự phòng khi ảnh chưa tải */
  background: string;
  /** null = không dùng ảnh, chỉ màu trơn */
  image: string | null;
};

export const PAGE_TEMPLATES: PageTemplate[] = [
  { id: "trang", ten: "Trắng trơn", background: "#ffffff", image: null },
  {
    id: "bang-do",
    ten: "Ruột — băng đỏ",
    background: "#fffdf6",
    image: "/tin/mau/bang-do.webp",
  },
  {
    id: "nga",
    ten: "Ruột — viền vàng",
    background: "#fffdf6",
    image: "/tin/mau/nga-vien-vang.webp",
  },
  {
    id: "vang-nhat",
    ten: "Ruột — vàng nhạt",
    background: "#fffdf6",
    image: "/tin/mau/vang-nhat.webp",
  },
  {
    id: "xanh-nhat",
    ten: "Ruột — xanh nhạt",
    background: "#f4f9ff",
    image: "/tin/mau/xanh-nhat.webp",
  },
  { id: "bia-do", ten: "Bìa đỏ", background: "#a20f1a", image: "/tin/mau/bia-do.webp" },
  {
    id: "bt-bia",
    ten: "Bản tin — bìa",
    background: "#a20f1a",
    image: "/tin/bg-bia.webp",
  },
  {
    id: "bt-ruot",
    ten: "Bản tin — ruột",
    background: "#fffdf6",
    image: "/tin/bg-trang.webp",
  },
  {
    id: "bt-bia-sau",
    ten: "Bản tin — bìa sau",
    background: "#0b3f8f",
    image: "/tin/bg-bia-sau.webp",
  },
  { id: "bia-xanh", ten: "Bìa xanh", background: "#0b3f8f", image: "/tin/mau/bia-xanh.webp" },
];
