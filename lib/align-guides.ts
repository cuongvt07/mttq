/**
 * Đường gióng thông minh kiểu PowerPoint cho trình thiết kế sách.
 *
 * Tách riêng khỏi BookEditor vì đây là toán thuần — không đụng React, không đụng
 * DOM — nên kiểm chứng được độc lập.
 */

/** Ngưỡng hít vào đường gióng, tính theo toạ độ trang 800px. */
export const HIT = 6;

export type Giong = { doc: number[]; ngang: number[] };

export type Hop = { x: number; y: number; w: number; h: number };

/**
 * So ba mốc của khối đang kéo (mép trái / tâm / mép phải, và trên / giữa / dưới)
 * với ba mốc tương ứng của từng khối khác, cộng thêm mép và tâm trang. Mốc nào
 * lệch dưới ngưỡng thì hít vào, kèm toạ độ đường để vẽ vạch cho người dùng thấy
 * mình đang thẳng hàng với cái gì.
 *
 * Mỗi trục chỉ lấy MỘT đường — đường gần nhất — nên khối không giật qua lại
 * giữa hai mốc gần bằng nhau.
 */
export function hitGiong(
  nx: number,
  ny: number,
  w: number,
  h: number,
  khac: Hop[],
  pageW: number,
  pageH: number,
  nguong: number = HIT,
): { x: number; y: number; giong: Giong } {
  const mocDoc = [0, pageW / 2, pageW];
  const mocNgang = [0, pageH / 2, pageH];
  for (const o of khac) {
    mocDoc.push(o.x, o.x + o.w / 2, o.x + o.w);
    mocNgang.push(o.y, o.y + o.h / 2, o.y + o.h);
  }

  // lệch = mốc - vị trí hiện tại của cạnh đó; chọn lệch nhỏ nhất
  const chon = (canh: number[], moc: number[]) => {
    let best: { d: number; line: number } | null = null;
    for (const c of canh) {
      for (const m of moc) {
        const d = m - c;
        if (Math.abs(d) <= nguong && (!best || Math.abs(d) < Math.abs(best.d))) {
          best = { d, line: m };
        }
      }
    }
    return best;
  };

  const bx = chon([nx, nx + w / 2, nx + w], mocDoc);
  const by = chon([ny, ny + h / 2, ny + h], mocNgang);

  return {
    x: bx ? nx + bx.d : nx,
    y: by ? ny + by.d : ny,
    giong: { doc: bx ? [bx.line] : [], ngang: by ? [by.line] : [] },
  };
}
