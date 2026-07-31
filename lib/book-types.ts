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
  align: "left" | "center" | "right";
  lineHeight: number;
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

export type BookElement = TextElement | ImageElement;

export type BookPage = {
  id: string;
  background: string;
  background_image: string | null;
  elements: BookElement[];
};

export type Book = {
  id: string;
  title: string;
  slug: string;
  page_ratio: string;
  cover_url: string | null;
  is_published: boolean;
  updated_at: string;
};

export type BookWithPages = Book & { pages: BookPage[] };

export const FONT_FAMILIES = [
  { label: "Mặc định (Segoe UI)", value: '"Segoe UI", system-ui, sans-serif' },
  { label: "Times / có chân", value: 'Georgia, "Times New Roman", serif' },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Tahoma", value: "Tahoma, Verdana, sans-serif" },
  { label: "Máy chữ", value: '"Courier New", monospace' },
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
