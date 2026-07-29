/** Dấu thanh/dấu phụ tổ hợp sau khi normalize("NFD"). */
const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");

/** Chuyển tên tiếng Việt thành slug dùng cho anchor (#cum-1). */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
