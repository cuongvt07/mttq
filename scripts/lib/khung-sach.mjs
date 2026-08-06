/**
 * Khung dựng sách dùng chung cho các ấn phẩm của phường (bản tin, báo cáo…).
 *
 * Ở đây gom: cỡ trang A4, các loại khối (chữ / ảnh / cụm ảnh–chữ), phép đo
 * chiều cao thật bằng Chrome, phép cắt đoạn theo cuối câu và bộ xếp trang.
 * Mỗi ấn phẩm chỉ còn việc mô tả nội dung rồi gọi paginate().
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

export const W = 800;
export const PH = 1131;                  // khổ A4 (210×297mm) quy về bề rộng 800
export const M = 60;
export const TOP = 96;
export const CHAN_SEN = 142;              // dải hoa sen trang trí chân trang
export const BOTTOM = PH - 52 - CHAN_SEN; // chữ phải nằm phía trên dải hoa sen
export const CW = W - M * 2;
export const GUT = 24;                    // rãnh giữa hai cột
export const HALF = (CW - GUT) / 2;       // bề rộng một cột
export const COL_L = M;
export const COL_R = M + HALF + GUT;

export const SERIF = '"Times New Roman", Times, serif';
export const SANS = '"Segoe UI", system-ui, sans-serif';

export const RED = "#a20f1a";
export const NAVY = "#0b3f8f";
export const GOLD = "#c8a227";
export const INK = "#22303f";
export const MUTED = "#6b7280";
export const WHITE = "#ffffff";
export const CREAM = "#ffd76a";

const BG_COVER = "/tin/bg-bia.webp";
const BG_PAGE = "/tin/bg-trang.webp";
const BG_BACK = "/tin/bg-bia-sau.webp";
const EMBLEM = "/brand/emblem.webp";
const GIAY_KHEN = "/tin/giay-khen.webp";
const TRAO_QD_1 = "/tin/trao-quyet-dinh-1.webp";
const TRAO_QD_2 = "/tin/trao-quyet-dinh-2.webp";

/* ------------------------------------------------------------------ khối -- */

let seq = 0;
export const uid = (p) => `${p}${++seq}`;

export const text = (content, o = {}) => ({
  kind: "text",
  content,
  fontSize: o.size ?? 23,
  fontFamily: o.font ?? SERIF,
  color: o.color ?? INK,
  bold: o.bold ?? false,
  italic: o.italic ?? false,
  align: o.align ?? "left",
  lineHeight: o.lh ?? 1.62,
  href: o.href,
  gap: o.gap ?? 14,
  w: o.w ?? CW,
  x: o.x,
  y: o.y,
  /** ghi chú tuỳ ý của script gọi (ví dụ: ô này thuộc bảng nào) */
  o: o.o,
});

export const image = (src, h, o = {}) => ({
  kind: "image",
  src,
  h,
  w: o.w ?? CW,
  x: o.x,
  y: o.y,
  radius: o.radius ?? 8,
  borderWidth: o.border ?? 0,
  borderColor: o.borderColor ?? GOLD,
  fit: o.fit ?? "cover",
  gap: o.gap ?? 12,
});

/** Nhóm khối phải nằm cùng một trang (tiêu đề + byline, ảnh + chú thích…). */
export const atom = (...blocks) => ({ type: 'atom', blocks });

/** Hàng hai cột kiểu báo: ảnh một bên, chữ chạy bên cạnh. */
export const row = (left, right, xs) => ({ type: 'row', cols: [left, right], xs });

/** Nhiều mục dính liền: mở bài (tiêu đề + ảnh + sapo) không được tách trang. */
export const group = (...items) => ({ type: 'group', items });

/** tỉ lệ cao/rộng thật của ảnh — khung phải ôm trọn ảnh, không được cắt xén */
export const tyLeAnh = (img) => (img.w && img.h ? img.h / img.w : 0.7);

/**
 * Cụm ảnh + chú thích. Chỉ cho bề rộng ảnh, chiều cao suy ra từ tỉ lệ thật nên
 * ảnh luôn vào trọn khung. Chú thích chạy hết bề ngang cột, ảnh căn giữa cột.
 */
export const anhCum = (img, wAnh, nguon = "Báo Hànộimới", wCot = CW, xCot = M) => [
  image(img.path, Math.round(wAnh * tyLeAnh(img)), {
    w: wAnh,
    x: Math.round(xCot + (wCot - wAnh) / 2),
    border: 3,
    gap: 8,
    fit: "contain",
  }),
  text(img.caption || `Ảnh: ${nguon}.`, {
    size: 17, font: SANS, color: MUTED, italic: true, lh: 1.4, w: wCot, x: xCot, gap: 14,
  }),
];

/**
 * Mô tả khả năng co giãn của một cụm ảnh: co chiều cao thì bề ngang co theo
 * đúng tỉ lệ, nên ảnh không bao giờ bị méo hay cắt mất phần nào.
 */
export const khungCo = (img, blocks, min, max) => ({
  anh: blocks[0],
  ty: tyLeAnh(img),
  min,
  max: Math.min(max, Math.round(CW * tyLeAnh(img))),
});

/* --------------------------------------------------- đo chiều cao thật -- */

let browser = null;
let page = null;

/** Mở Chrome để đo chữ — gọi một lần ở đầu script sinh sách. */
export async function moTrinhDuyet() {
  browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
  page = await browser.newPage();
  await page.setContent("<body style='margin:0'></body>");
}

export async function dongTrinhDuyet() {
  await browser?.close();
  browser = null;
}

const measure = async (b) =>
  b.kind === "image"
    ? b.h
    : page.evaluate((x) => {
        const d = document.createElement("div");
        Object.assign(d.style, {
          position: "absolute",
          left: "-9999px",
          width: x.w + "px",
          fontSize: x.fontSize + "px",
          fontFamily: x.fontFamily,
          fontWeight: x.bold ? "700" : "400",
          fontStyle: x.italic ? "italic" : "normal",
          lineHeight: String(x.lineHeight),
          textAlign: x.align,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        });
        d.textContent = x.content;
        document.body.appendChild(d);
        const h = d.offsetHeight;
        d.remove();
        return h;
      }, b);

export const H = new Map();
export async function heightOf(b) {
  if (!H.has(b)) H.set(b, await measure(b));
  return H.get(b);
}

/** Đo nhanh một đoạn chữ bất kỳ theo bề rộng cho trước. */
export const measureText = (content, w) =>
  measure(text(content, { w }));

/**
 * Cắt đoạn văn thành phần vừa đúng chiều cao cho trước (chạy cạnh ảnh)
 * và phần còn lại (chạy full chiều ngang bên dưới ảnh).
 */
export async function splitToFit(content, w, maxH, chotCau = true) {
  if ((await measureText(content, w)) <= maxH) return [content, ""];

  let lo = 0;
  let hi = content.length;
  let best = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const h = await measureText(content.slice(0, mid), w);
    if (h <= maxH) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  /** điểm kết thúc câu gần nhất trước vị trí `i` (tính cả dấu chấm) */
  const cuoiCau = (i) => {
    let cat = -1;
    for (const dau of [". ", "; ", ".\n", "\n"]) {
      const k = content.lastIndexOf(dau, i);
      if (k > cat) cat = k + (dau === "\n" ? 0 : 1);
    }
    return cat;
  };

  // Chỉ cắt ở hết câu — tránh phần dưới chỉ còn lơ lửng vài chữ.
  let cat = cuoiCau(best);

  // Phần chảy xuống dưới quá ngắn thì lùi thêm một câu nữa cho cân.
  const DU_DAI = 90;
  if (cat > 0 && content.length - cat < DU_DAI) cat = cuoiCau(cat - 2);

  // Không có ranh giới câu nào hợp lý.
  //  · cạnh ảnh (chotCau): đẩy cả đoạn xuống dưới, để trống còn hơn cắt giữa câu.
  //  · vắt sang trang: cắt ở hết một từ — chỗ cắt trùng cuối dòng nên đọc liền
  //    mạch như sách, còn hơn bỏ trống gần nửa trang.
  if (cat < 60) {
    if (chotCau) return ["", content];
    const cuoiTu = content.lastIndexOf(" ", best);
    if (cuoiTu < 60 || content.length - cuoiTu < 40) return ["", content];
    return [content.slice(0, cuoiTu).trim(), content.slice(cuoiTu).trim()];
  }

  return [content.slice(0, cat).trim(), content.slice(cat).trim()];
}

/** Khoảng hở giữa đáy ảnh và phần chữ chạy full ngang bên dưới. */
export const WRAP_GAP = 20;

/**
 * Mục "chữ chảy quanh ảnh": ảnh nửa trang một bên, chữ chạy bên cạnh,
 * hết ảnh thì chữ tràn ra full chiều ngang.
 */
/** Khoảng cách giữa hai đoạn nằm trong cùng một khối chữ. */
export const HO_DOAN = 16;

/**
 * Tách chuỗi nhiều đoạn thành từng khối chữ riêng, cách nhau HO_DOAN.
 * Trước đây để nguyên "\n\n" nên giữa hai đoạn hở hẳn một dòng trống.
 */
export const doanKhoi = (noiDung, o = {}) => {
  const doan = noiDung.split(/\n{2,}/).map((t) => t.trim()).filter(Boolean);
  return doan.map((t, i) =>
    text(t, { align: "justify", ...o, gap: i === doan.length - 1 ? (o.gapCuoi ?? 0) : HO_DOAN }),
  );
};

/** chiều cao cột ảnh (ảnh + chú thích), không tính khoảng cách cuối */
export async function caoCot(cot) {
  let h = 0;
  for (const b of cot) h += (await heightOf(b)) + b.gap;
  return h - cot.at(-1).gap;
}

export async function wrapItem(img, side, content, wAnh = HALF, nguon) {
  const ty = tyLeAnh(img);
  const dung = (w) => anhCum(img, Math.min(HALF, Math.max(150, Math.round(w))), nguon, HALF);

  let cot = dung(wAnh);
  let colH = await caoCot(cot);
  let [ben, duoi] = await splitToFit(content, HALF, colH);

  // Chữ bên cạnh chỉ cắt được ở cuối câu nên thường ngắn hơn cột ảnh, để hở một
  // mảng trắng cạnh ảnh. Thu ảnh lại cho hai cột cao xấp xỉ nhau — cân đối hơn.
  for (let lan = 0; lan < 3; lan++) {
    if (!ben) break;
    const hBen = await measureText(ben, HALF);
    if (colH - hBen <= 40) break;

    const hChuThich = colH - cot[0].h - cot[0].gap;
    const wMoi = (hBen - hChuThich - cot[0].gap) / ty;
    if (wMoi >= cot[0].w || wMoi < 150) break;

    cot = dung(wMoi);
    colH = await caoCot(cot);
    [ben, duoi] = await splitToFit(content, HALF, colH);
  }

  return {
    type: "wrap",
    side,
    // giữ nguyên liệu để lúc xếp trang dựng lại cụm với ảnh nhỏ hơn khi cần
    goc: { img, content, nguon },
    cot,
    colH,
    ben: ben ? doanKhoi(ben, { w: HALF, gapCuoi: 0 }) : null,
    duoi: duoi ? doanKhoi(duoi, { gapCuoi: 14 }) : null,
  };
}

/* ------------------------------------------------------- xếp & ngắt trang -- */

/** Xếp các atom vào nhiều trang, atom nào không đủ chỗ thì đẩy sang trang sau. */
export async function paginate(items, { continuedLabel } = {}) {
  const pages = [];
  let cur = [];
  let y = TOP;

  /** khoá các bài có mặt trên trang đang xếp, để mục lục biết bài bắt đầu ở đâu */
  let baiTrenTrang = new Set();

  function ngatTrang() {
    pages.push({ els: cur, bai: baiTrenTrang });
    cur = [];
    baiTrenTrang = new Set();
    y = TOP;
  }

  /** mọi khối ảnh nằm trong một mục, kể cả trong nhóm hay cụm ảnh–chữ */
  function anhTrongMuc(it) {
    if (!it) return [];
    if (it.type === "group") return it.items.flatMap(anhTrongMuc);
    if (it.type === "wrap") return (it.cot ?? []).filter((b) => b.kind === "image");
    if (it.type === "row") return it.cols.flat().filter((b) => b.kind === "image");
    return (it.blocks ?? []).filter((b) => b.kind === "image");
  }

  /** ảnh đã đặt trên trang hiện tại — một trang chỉ chấp nhận ảnh cùng một cỡ */
  const anhTrenTrang = () => cur.filter((e) => e.b.kind === "image").map((e) => e.b);

  /** chiều cao của một mục: atom xếp dọc, row lấy cột cao nhất */
  async function heightOfItem(it) {
    if (it.type === "wrap") {
      let hDuoi = 0;
      for (const b of it.duoi ?? []) hDuoi += (await heightOf(b)) + b.gap;
      return it.colH + (it.duoi ? WRAP_GAP + hDuoi : 14);
    }
    if (it.type === "group") {
      let h = 0;
      for (const sub of it.items) h += await heightOfItem(sub);
      return h;
    }
    if (it.type === "row") {
      let max = 0;
      for (const col of it.cols) {
        let h = 0;
        for (const b of col) h += (await heightOf(b)) + b.gap;
        max = Math.max(max, h);
      }
      return max;
    }
    let h = 0;
    for (const b of it.blocks) h += (await heightOf(b)) + b.gap;
    return h;
  }

  /** đặt mục vào trang hiện tại tại vị trí y */
  async function place(it) {
    if (it.type === "wrap") {
      const xImg = it.side === "left" ? COL_L : COL_R;
      const xTxt = it.side === "left" ? COL_R : COL_L;

      let cy = y;
      for (const b of it.cot) {
        cur.push({ b, x: xImg, y: cy });
        cy += (await heightOf(b)) + b.gap;
      }
      let ty = y;
      for (const b of it.ben ?? []) {
        cur.push({ b, x: xTxt, y: ty });
        ty += (await heightOf(b)) + b.gap;
      }

      y += it.colH + WRAP_GAP;
      for (const b of it.duoi ?? []) {
        cur.push({ b, x: M, y });
        y += (await heightOf(b)) + b.gap;
      }
      return;
    }
    if (it.type === "group") {
      for (const sub of it.items) await place(sub);
      return;
    }
    if (it.type === "row") {
      const xs = it.xs ?? [COL_L, COL_R];
      let max = 0;
      for (const [i, col] of it.cols.entries()) {
        let cy = y;
        for (const b of col) {
          cur.push({ b, x: xs[i], y: cy });
          cy += (await heightOf(b)) + b.gap;
        }
        max = Math.max(max, cy - y);
      }
      y += max;
      return;
    }
    for (const b of it.blocks) {
      cur.push({ b, x: b.x ?? M, y });
      y += (await heightOf(b)) + b.gap;
    }
  }

  /**
   * Ảnh co giãn: nén/kéo chiều cao ảnh cho vừa chỗ trống còn lại của trang,
   * để cuối bài không hở một mảng trắng lớn. Trả về chiều cao mục sau khi chỉnh.
   */
  async function coAnh(it, h) {
    const { anh, ty, min, max } = it.co;
    const phuTro = h - anh.h; // chú thích + các khoảng cách, không co theo

    anh.h = Math.max(min, Math.min(max, Math.round(BOTTOM - y - phuTro)));
    anh.w = Math.round(anh.h / ty); // giữ đúng tỉ lệ → ảnh vào trọn khung
    anh.x = Math.round(M + (CW - anh.w) / 2);
    H.set(anh, anh.h);
    return anh.h + phuTro;
  }

  /**
   * Một đoạn chữ dài không vừa phần trang còn lại thì cắt ở cuối câu: phần đầu
   * lấp nốt trang này, phần sau chạy tiếp trang sau — thay vì đẩy cả đoạn xuống
   * và bỏ trống nửa trang.
   */
  async function chiaDoan(it, troi) {
    if (it.type !== "atom" || it.blocks.length !== 1) return null;
    const b = it.blocks[0];
    if (b.kind !== "text" || troi < 110) return null;

    const [tren, duoi] = await splitToFit(b.content, b.w, troi - b.gap, false);
    if (!tren || !duoi) return null;

    const khoi = (content, gap) => ({ type: "atom", blocks: [{ ...b, content, gap }], bai: it.bai });
    return { tren: khoi(tren, 0), duoi: khoi(duoi, b.gap) };
  }

  const hangDoi = [...items];
  while (hangDoi.length) {
    const it = hangDoi.shift();

    // Tin mới không được nằm chung trang với nội dung tin trước — sang trang luôn.
    if (it.moDauBai && cur.length) ngatTrang();

    let h = await heightOfItem(it);
    // căn theo chỗ trống của trang hiện tại; nếu vẫn không vừa thì sang trang
    // mới rồi căn lại theo cả trang
    if (it.co) h = await coAnh(it, h);

    // Một trang không được chứa hai ảnh khác cỡ. Xử lý y như trường hợp không
    // đủ chỗ: ưu tiên cho chữ lên trước, ảnh lùi lại, rồi mới ngắt trang.
    const daCo = anhTrenTrang();
    const lechCo =
      daCo.length > 0 && anhTrongMuc(it).some((a) => a.w !== daCo[0].w || a.h !== daCo[0].h);

    if (cur.length && (y + h > BOTTOM || lechCo)) {
      const chia = await chiaDoan(it, BOTTOM - y);
      if (chia) {
        if (it.bai) baiTrenTrang.add(it.bai);
        await place(chia.tren);
        hangDoi.unshift(chia.duoi);
        ngatTrang();
        continue;
      }

      // Cụm ảnh–chữ quá cao: thu nhỏ ảnh cho lõi cụm (ảnh + chữ bên cạnh) lọt
      // vào phần trang còn lại, phần chữ chảy xuống dưới thì tách ra chạy tiếp
      // — thay vì đẩy cả cụm sang trang sau và bỏ trống nửa trang.
      if (it.type === "wrap" && it.goc && !lechCo) {
        let lot = null;
        for (const wAnh of [HALF, HALF * 0.86, HALF * 0.74, HALF * 0.62, 150]) {
          const thu =
            wAnh === HALF ? it : await wrapItem(it.goc.img, it.side, it.goc.content, wAnh, it.goc.nguon);
          if (y + thu.colH + 14 <= BOTTOM) { lot = thu; break; }
        }
        if (lot) {
          if (it.bai) baiTrenTrang.add(it.bai);
          await place({ ...lot, duoi: null });
          if (lot.duoi?.length)
            hangDoi.unshift(...lot.duoi.map((b) => ({ type: "atom", blocks: [b], bai: it.bai })));
          continue;
        }

        // Chỗ trống quá hẹp cho cả ảnh: cho phần đầu đoạn chữ chạy hết chiều
        // ngang lấp nốt trang, ảnh và phần chữ còn lại sang trang sau.
        const [tren, duoi] = await splitToFit(it.goc.content, CW, BOTTOM - y - 14, false);
        if (tren && duoi) {
          if (it.bai) baiTrenTrang.add(it.bai);
          await place(atom(text(tren, { align: "justify", gap: 14 })));
          hangDoi.unshift({
            ...(await wrapItem(it.goc.img, it.side, duoi, HALF, it.goc.nguon)),
            bai: it.bai,
          });
          ngatTrang();
          continue;
        }
      }

      // Ảnh không vừa chỗ trống: cho đoạn chữ kế tiếp của cùng bài lên trước,
      // ảnh lùi lại một nhịp. Thứ tự chữ giữ nguyên, chỉ ảnh xê dịch — nhờ vậy
      // không phải bỏ trống nửa trang giữa bài.
      const laAnh = (x) =>
        x.type === "atom" && x.blocks.length === 2 && x.blocks[0].kind === "image";
      const laChu = (x) =>
        x.type === "atom" && x.blocks.length === 1 && x.blocks[0].kind === "text";

      if (laAnh(it) && (lechCo || BOTTOM - y > 120)) {
        let j = -1;
        for (let k = 0; k < hangDoi.length; k++) {
          const x = hangDoi[k];
          if (x.bai !== it.bai) break;
          if (laChu(x)) { j = k; break; }
          if (!laAnh(x)) break; // wrap/group cũng mang chữ → không được vượt qua
        }
        if (j >= 0) {
          const doanKe = hangDoi.splice(j, 1)[0];
          hangDoi.unshift(doanKe, it); // chữ lên trước, ảnh xuống ngay sau
          continue;
        }
      }

      if (process.env.SOI)
        console.log(
          `    [soi] trang ${pages.length + 1}: hở ${Math.round(BOTTOM - y)}px vì mục "${it.type}"` +
            ` cao ${Math.round(h)}px${it.type === "atom" ? ` (${it.blocks.map((b) => b.kind).join("+")})` : ""}`,
        );

      ngatTrang();
      if (continuedLabel) {
        const label = text(continuedLabel, {
          size: 18, font: SANS, bold: true, color: GOLD, italic: true, gap: 14,
        });
        cur.push({ b: label, x: M, y });
        y += (await heightOf(label)) + label.gap;
      }
      if (it.co) h = await coAnh(it, h); // căn lại theo trang mới

      // Bảng vắt sang trang mới thì nhắc lại dòng tiêu đề cột cho dễ đọc
      if (it.tieuDeBang) {
        const hTieuDe = await heightOfItem(it.tieuDeBang);
        if (y + hTieuDe + h <= BOTTOM) await place(it.tieuDeBang);
      }
    }

    if (it.bai) baiTrenTrang.add(it.bai);
    await place(it);
  }

  if (cur.length) ngatTrang();
  return pages;
}

/* ------------------------------------------------------------ xuất trang -- */

export function toElement(b, x, y) {
  if (b.kind === "image") {
    return {
      id: uid("i"), type: "image",
      x: Math.round(x), y: Math.round(y), w: Math.round(b.w), h: Math.round(b.h),
      rotation: 0, src: b.src, radius: b.radius, opacity: 1, fit: b.fit,
      borderWidth: b.borderWidth, borderColor: b.borderColor,
    };
  }
  const el = {
    id: uid("t"), type: "text",
    x: Math.round(x), y: Math.round(y), w: Math.round(b.w), rotation: 0,
    content: b.content, fontSize: b.fontSize, fontFamily: b.fontFamily, color: b.color,
    bold: b.bold, italic: b.italic, align: b.align, lineHeight: b.lineHeight,
  };
  if (b.href) el.href = b.href;
  return el;
}
