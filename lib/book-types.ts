/** Hệ toạ độ trang: mọi element lưu theo khung rộng 800px, cao suy ra từ tỉ lệ. */
export const PAGE_WIDTH = 800;

export const PAGE_RATIOS = {
  "3:4": [3, 4],
  "4:3": [4, 3],
  a4: [210, 297],
  "1:1": [1, 1],
  "16:9": [16, 9],
} as const;

export type PageRatio = keyof typeof PAGE_RATIOS;

export function pageHeight(ratio: string): number {
  const [w, h] = PAGE_RATIOS[(ratio as PageRatio) in PAGE_RATIOS ? (ratio as PageRatio) : "3:4"];
  return Math.round((PAGE_WIDTH * h) / w);
}

export type TextElement = {
  id: string;
  type: "text";
  x: number;
  y: number;
  w: number;
  rotation: number;
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
  align: "left" | "center" | "right" | "justify";
  lineHeight: number;
  /** bấm vào chữ mở link (bài báo, tài liệu…) */
  href?: string;
  /**
   * Màu nền tô sau chữ. Để trống là trong suốt như trước.
   *
   * Có mặt để chữ đọc được khi đặt trên ảnh nền nhiều chi tiết — không có nó
   * thì chữ sáng nằm trên vùng ảnh sáng là mất hút. Trường tuỳ chọn nên mọi
   * khối chữ đã lưu từ trước giữ nguyên, không đụng gì tới dữ liệu cũ.
   */
  bg?: string;
};

export type ImageElement = {
  id: string;
  type: "image";
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  src: string;
  radius: number;
  opacity: number;
  fit: "cover" | "contain";
  borderWidth: number;
  borderColor: string;
};

/** Khung/đường kẻ — dùng để kẻ bảng, vạch ngăn, nền khối. */
export type ShapeElement = {
  id: string;
  type: "shape";
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  /** màu nền, để trống là trong suốt */
  fill?: string;
  borderWidth: number;
  borderColor: string;
  radius: number;
  opacity: number;
};

export type BookElement = TextElement | ImageElement | ShapeElement;

export type BookPage = {
  id: string;
  background: string;
  background_image: string | null;
  elements: BookElement[];
};

export type ChromeBand = {
  enabled: boolean;
  /** hỗ trợ {trang} và {tong} */
  text: string;
  align: "left" | "center" | "right" | "justify";
  fontSize: number;
  color: string;
  /** đường kẻ dải ngăn cách */
  rule: boolean;
  ruleColor: string;
  ruleWidth: number;
  pageNumber?: boolean;
  pageNumberAlign?: "left" | "center" | "right";
  /** lùi thêm vào trong so với lề, để chừa chỗ cho hoạ tiết ở mép trang */
  offset?: number;
};

export type PageChrome = {
  /** lề trong, tính từ mép trang */
  margin: number;
  /** bỏ qua trang đầu (thường là bìa) */
  skipFirstPage: boolean;
  /** bỏ qua trang cuối (bìa sau) */
  skipLastPage?: boolean;
  header: ChromeBand;
  footer: ChromeBand;
};

export const DEFAULT_CHROME: PageChrome = {
  margin: 48,
  skipFirstPage: true,
  skipLastPage: true,
  header: {
    enabled: false,
    text: "",
    align: "center",
    fontSize: 16,
    color: "#7a8797",
    rule: true,
    ruleColor: "#d8dee6",
    ruleWidth: 1,
  },
  footer: {
    enabled: true,
    text: "",
    align: "left",
    fontSize: 15,
    color: "#7a8797",
    rule: true,
    ruleColor: "#d8dee6",
    ruleWidth: 1,
    pageNumber: true,
    pageNumberAlign: "right",
  },
};

export type Book = {
  id: string;
  title: string;
  slug: string;
  page_ratio: string;
  cover_url: string | null;
  chrome: PageChrome;
  is_published: boolean;
  updated_at: string;
};

export type BookWithPages = Book & { pages: BookPage[] };

/**
 * `value` giữ nguyên chuỗi font cũ vì đó là thứ đã lưu trong CSDL — đổi đi thì
 * ô chọn font của sách cũ sẽ trống. Font thật lúc hiển thị do mapLegacyFont
 * trong components/book/PageRenderer.tsx quyết định; nhãn dưới đây ghi tên
 * webfont thực sự được dùng để người soạn không nhầm.
 */
export const FONT_FAMILIES = [
  { label: "Mặc định (Source Sans)", value: '"Segoe UI", system-ui, sans-serif' },
  { label: "Có chân (Tinos ~ Times New Roman)", value: '"Times New Roman", Times, serif' },
  { label: "Arimo (~ Arial)", value: "Arial, Helvetica, sans-serif" },
  { label: "Source Sans (~ Tahoma)", value: "Tahoma, Verdana, sans-serif" },
  { label: "Máy chữ (Cousine)", value: '"Courier New", monospace' },
];

export function newTextElement(overrides: Partial<TextElement> = {}): TextElement {
  return {
    id: crypto.randomUUID(),
    type: "text",
    x: 80,
    y: 80,
    w: 360,
    rotation: 0,
    content: "Nhập nội dung…",
    fontSize: 28,
    fontFamily: FONT_FAMILIES[0].value,
    color: "#14202e",
    bold: false,
    italic: false,
    align: "left",
    lineHeight: 1.35,
    ...overrides,
  };
}

export function newImageElement(src: string, overrides: Partial<ImageElement> = {}): ImageElement {
  return {
    id: crypto.randomUUID(),
    type: "image",
    x: 80,
    y: 200,
    w: 400,
    h: 300,
    rotation: 0,
    src,
    radius: 0,
    opacity: 1,
    fit: "cover",
    borderWidth: 0,
    borderColor: "#ffffff",
    ...overrides,
  };
}

export function emptyPage(): BookPage {
  return {
    id: crypto.randomUUID(),
    background: "#ffffff",
    background_image: null,
    elements: [],
  };
}
