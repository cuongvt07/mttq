/**
 * Sinh "Bản tin Mặt trận phường Yên Nghĩa — số 01".
 *
 * Nội dung lấy từ chính các bài báo trong file Word (đã tải sẵn về bằng
 * scripts/fetch-articles.mjs) — chữ và ảnh dựng thẳng vào trang, không phải link.
 *
 * Chiều cao mỗi khối chữ được đo bằng Chrome (đúng phông, đúng bề rộng) rồi mới
 * xếp trang, và tự ngắt sang trang mới khi hết chỗ — nên không bao giờ chồng chữ.
 *
 *   node scripts/fetch-articles.mjs && node scripts/make-bulletin.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

/**
 * Id cố định của cuốn bản tin. Script xoá rồi tạo lại sách mỗi lần chạy; nếu để
 * Postgres tự sinh id thì đường dẫn /admin/books/<id> đang mở sẽ thành 404.
 */
const BOOK_ID = "69045c01-c567-4097-b580-af7392760aff";

const W = 800;
const PH = 1131;                  // khổ A4 (210×297mm) quy về bề rộng 800
const M = 60;
const TOP = 96;
const CHAN_SEN = 142;              // dải hoa sen trang trí chân trang
const BOTTOM = PH - 52 - CHAN_SEN; // chữ phải nằm phía trên dải hoa sen
const CW = W - M * 2;
const GUT = 24;                    // rãnh giữa hai cột
const HALF = (CW - GUT) / 2;       // bề rộng một cột
const COL_L = M;
const COL_R = M + HALF + GUT;

const SERIF = '"Times New Roman", Times, serif';
const SANS = '"Segoe UI", system-ui, sans-serif';

const RED = "#a20f1a";
const NAVY = "#0b3f8f";
const GOLD = "#c8a227";
const INK = "#22303f";
const MUTED = "#6b7280";
const WHITE = "#ffffff";
const CREAM = "#ffd76a";

const BG_COVER = "/tin/bg-bia.webp";
const BG_PAGE = "/tin/bg-trang.webp";
const BG_BACK = "/tin/bg-bia-sau.webp";
const EMBLEM = "/brand/emblem.webp";
const GIAY_KHEN = "/tin/giay-khen.webp";
const TRAO_QD_1 = "/tin/trao-quyet-dinh-1.webp";
const TRAO_QD_2 = "/tin/trao-quyet-dinh-2.webp";

/* ------------------------------------------------------------------ khối -- */

let seq = 0;
const uid = (p) => `${p}${++seq}`;

const text = (content, o = {}) => ({
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
});

const image = (src, h, o = {}) => ({
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
const atom = (...blocks) => ({ type: 'atom', blocks });

/** Hàng hai cột kiểu báo: ảnh một bên, chữ chạy bên cạnh. */
const row = (left, right, xs) => ({ type: 'row', cols: [left, right], xs });

/** Nhiều mục dính liền: mở bài (tiêu đề + ảnh + sapo) không được tách trang. */
const group = (...items) => ({ type: 'group', items });

/* -------------------------------------------------------------- dữ liệu -- */

/**
 * Tiêu đề các tin chỉ đăng trên fanpage. Bài gốc viết hoa toàn bộ nên đặt lại
 * theo đúng nội dung bài, viết hoa danh từ riêng cho đúng chính tả.
 */
const TIEU_DE_FB = {
  "gpmb-tuyen-truyen":
    "Phường Yên Nghĩa đẩy nhanh tiến độ giải phóng mặt bằng dự án cải tạo, mở rộng Quốc lộ 6",
  "gpmb-tham-hoi":
    "Uỷ ban MTTQ Việt Nam phường Yên Nghĩa thăm hỏi, động viên lực lượng tuyên truyền giải phóng mặt bằng Quốc lộ 6",
  "phu-nu":
    "Hội Liên hiệp Phụ nữ phường ra quân tổng vệ sinh môi trường tại Nghĩa trang Liệt sĩ",
};

/** Tiêu đề dùng trong bản tin — cùng một nguồn cho cả bài lẫn mục lục. */
const tieuDe = (a) => TIEU_DE_FB[a.key] ?? a.title;

const articles = JSON.parse(await readFile(join(ROOT, "lib", "bulletin-articles.json"), "utf8"));
const ok = articles.filter((a) => a.ok);
const blocked = articles.filter((a) => !a.ok);

/** cụm ảnh + chú thích theo bề rộng cho trước */
const anhCum = (img, h, w, nguon = "Báo Hànộimới") => [
  image(img.path, h, { w, border: 3, gap: 8 }),
  text(img.caption || `Ảnh: ${nguon}.`, {
    size: 17, font: SANS, color: MUTED, italic: true, lh: 1.4, w, gap: 14,
  }),
];

/**
 * Bài báo → danh sách mục để xếp trang.
 * Ảnh xen kẽ nhiều kiểu cho đỡ đơn điệu: ảnh lớn ngang, ảnh nửa trái, nửa phải,
 * và cặp hai ảnh cạnh nhau.
 */
async function articleAtoms(a) {
  const out = [];

  const header = atom(
    text(a.muc.toUpperCase(), { size: 19, font: SANS, bold: true, color: GOLD, gap: 6 }),
    text(tieuDe(a), { size: 33, bold: true, color: RED, lh: 1.24, gap: 8 }),
    text([a.author, a.date, `Nguồn: ${a.source}`].filter(Boolean).join(" · "), {
      size: 18, font: SANS, color: MUTED, italic: true, lh: 1.4, gap: 14,
    }),
  );

  const paras = [...a.paragraphs];
  const imgs = [...a.images];

  // Mở bài: tiêu đề + ảnh lớn ngang + sapo nằm trọn trang đầu của bài.
  // Ảnh mở bài được căn cao vừa đúng phần trang còn lại, không để hở cuối trang.
  const moDau = a.sapo
    ? atom(text(a.sapo, { size: 24, bold: true, color: NAVY, lh: 1.55, align: "justify", gap: 16 }))
    : paras.length
      ? atom(text(paras.shift(), { align: "justify", gap: 14 }))
      : null;

  const mo = [header];
  let cumAnhMo = null;
  if (imgs.length) {
    const anh = anhCum(imgs.shift(), 320, CW, a.source);
    cumAnhMo = { ...atom(...anh), co: { anh: anh[0], min: 230, max: 520 } };
    mo.push(atom(...anh));
  }
  if (moDau) mo.push(moDau);

  // Cụm mở bài dính liền nhau; ảnh mở bài co theo chỗ trống còn lại của trang
  // nên bài mới có thể chạy tiếp ngay trên trang đang dở, không phải sang trang.
  const cumMo = group(...mo);
  if (cumAnhMo) {
    cumMo.co = cumAnhMo.co;
    // phương án dự phòng khi trang chỉ còn đủ chỗ cho phần chữ
    cumMo.moBai = { tieuDe: header, tiep: [...(moDau ? [moDau] : []), cumAnhMo] };
  }
  out.push(cumMo);

  // Thân bài: ảnh nửa trang LUÔN có chữ chạy bên cạnh (trái → phải → ngang lớn)
  let kieu = 0;
  while (paras.length) {
    const doan = paras.shift();

    if (!imgs.length) {
      out.push(atom(text(doan, { align: "justify", gap: 14 })));
      continue;
    }

    if (kieu % 3 === 2) {
      // ảnh ngang lớn, chữ nằm trên nó — không đặt ảnh nào cạnh ảnh
      out.push(atom(text(doan, { align: "justify", gap: 14 })));
      const anhNgang = anhCum(imgs.shift(), 300, CW, a.source);
      out.push({ ...atom(...anhNgang), co: { anh: anhNgang[0], min: 170, max: 560 } });
    } else {
      // gộp thêm một đoạn nữa để chữ có phần chảy tiếp bên dưới ảnh
      const noiDung = [doan, ...(paras.length ? [paras.shift()] : [])].join("\n\n");
      out.push(await wrapItem(imgs.shift(), kieu % 3 === 0 ? "left" : "right", noiDung, 250, a.source));
    }
    kieu++;
  }

  // Ảnh còn thừa khi đã hết chữ: để ngang cả trang, không ghép đôi.
  // Cho co giãn chiều cao để lấp kín chỗ trống cuối bài, khỏi hở một mảng trắng.
  for (const img of imgs) {
    const blocks = anhCum(img, 300, CW, a.source);
    out.push({ ...atom(...blocks), co: { anh: blocks[0], min: 170, max: 620 } });
  }

  return out;
}

/* --------------------------------------------------- đo chiều cao thật -- */

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
const page = await browser.newPage();
await page.setContent("<body style='margin:0'></body>");

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

const H = new Map();
async function heightOf(b) {
  if (!H.has(b)) H.set(b, await measure(b));
  return H.get(b);
}

/** Đo nhanh một đoạn chữ bất kỳ theo bề rộng cho trước. */
const measureText = (content, w) =>
  measure(text(content, { w }));

/**
 * Cắt đoạn văn thành phần vừa đúng chiều cao cho trước (chạy cạnh ảnh)
 * và phần còn lại (chạy full chiều ngang bên dưới ảnh).
 */
async function splitToFit(content, w, maxH, chotCau = true) {
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
const WRAP_GAP = 20;

/**
 * Mục "chữ chảy quanh ảnh": ảnh nửa trang một bên, chữ chạy bên cạnh,
 * hết ảnh thì chữ tràn ra full chiều ngang.
 */
/** Khoảng cách giữa hai đoạn nằm trong cùng một khối chữ. */
const HO_DOAN = 16;

/**
 * Tách chuỗi nhiều đoạn thành từng khối chữ riêng, cách nhau HO_DOAN.
 * Trước đây để nguyên "\n\n" nên giữa hai đoạn hở hẳn một dòng trống.
 */
const doanKhoi = (noiDung, o = {}) => {
  const doan = noiDung.split(/\n{2,}/).map((t) => t.trim()).filter(Boolean);
  return doan.map((t, i) =>
    text(t, { align: "justify", ...o, gap: i === doan.length - 1 ? (o.gapCuoi ?? 0) : HO_DOAN }),
  );
};

async function wrapItem(img, side, content, imgH = 250, nguon) {
  const cot = anhCum(img, imgH, HALF, nguon);
  let colH = 0;
  for (const b of cot) colH += (await heightOf(b)) + b.gap;
  colH -= cot.at(-1).gap; // không tính gap cuối

  const [ben, duoi] = await splitToFit(content, HALF, colH);

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
async function paginate(items, { continuedLabel } = {}) {
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
    const anh = it.co.anh;
    const phuTro = h - anh.h; // chú thích + các khoảng cách, không co theo
    const cao = Math.min(it.co.max, BOTTOM - y - phuTro);

    anh.h = Math.max(it.co.min, Math.round(cao));
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
    let h = await heightOfItem(it);
    // căn theo chỗ trống của trang hiện tại; nếu vẫn không vừa thì sang trang
    // mới rồi căn lại theo cả trang
    if (it.co) h = await coAnh(it, h);

    if (cur.length && y + h > BOTTOM) {
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
      if (it.type === "wrap" && it.goc) {
        let lot = null;
        for (const hAnh of [250, 215, 185, 160, 140]) {
          const thu =
            hAnh === 250 ? it : await wrapItem(it.goc.img, it.side, it.goc.content, hAnh, it.goc.nguon);
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
            ...(await wrapItem(it.goc.img, it.side, duoi, 250, it.goc.nguon)),
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

      if (laAnh(it) && BOTTOM - y > 120) {
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

      // Cụm mở bài không đủ chỗ nhưng trang còn trống nhiều: cho tiêu đề và
      // phần đầu sapo của tin mới lấp nốt trang này, ảnh mở bài sang trang sau
      // — giống cách báo giấy vẫn làm, khỏi bỏ trống nửa trang.
      if (it.moBai) {
        const hTieuDe = await heightOfItem(it.moBai.tieuDe);
        if (y + hTieuDe + 110 <= BOTTOM) {
          if (it.bai) baiTrenTrang.add(it.bai);
          await place(it.moBai.tieuDe);
          hangDoi.unshift(...it.moBai.tiep.map((x) => ({ ...x, bai: it.bai })));
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
    }

    if (it.bai) baiTrenTrang.add(it.bai);
    await place(it);
  }

  if (cur.length) ngatTrang();
  return pages;
}

/* ---------------------------------------------------------------- trang -- */

/**
 * Mọi bài xếp trong một mạch liền: bài sau chạy tiếp ngay trên trang đang dở
 * (ảnh mở bài tự co cho vừa chỗ trống) thay vì bài nào cũng mở trang mới —
 * trước đây cách đó bỏ trống rất nhiều nửa trang cuối bài.
 */
const thanBai = [];

for (const a of ok) {
  for (const it of await articleAtoms(a)) thanBai.push({ ...it, bai: a.key });
}

// Ba tin trên fanpage phường không tải được nội dung → gom thành một trang giới thiệu
if (blocked.length) {
  const atoms = [
    atom(
      text("TIN TRÊN FANPAGE PHƯỜNG", { size: 19, font: SANS, bold: true, color: GOLD, gap: 6 }),
      text("HOẠT ĐỘNG ĐƯỢC ĐĂNG TẢI TRÊN TRANG CỘNG ĐỒNG", {
        size: 30,
        bold: true,
        color: RED,
        lh: 1.24,
        gap: 16,
      }),
      text(
        "Ba hoạt động dưới đây được đăng trên fanpage của phường. Facebook không cho phép tải nội dung tự động, nên bản tin chỉ dẫn lại tiêu đề; hình ảnh và bài viết đầy đủ xin xem trên fanpage.",
        { size: 22, italic: true, color: MUTED, lh: 1.55, gap: 20 },
      ),
    ),
    ...blocked.map((b, i) =>
      atom(
        text(`${i + 1}. ${TIEU_DE_FB[b.key] ?? b.key}`, {
          size: 25,
          bold: true,
          color: NAVY,
          lh: 1.35,
          gap: 6,
        }),
        text(b.sapo || "Bài viết và hình ảnh đăng trên fanpage phường Yên Nghĩa.", {
          size: 21,
          color: INK,
          lh: 1.5,
          gap: 4,
        }),
        text("Xem trên fanpage →", {
          size: 19,
          font: SANS,
          italic: true,
          color: RED,
          href: b.url,
          gap: 20,
        }),
      ),
    ),
    atom(image(TRAO_QD_2, 250, { border: 3, gap: 8 })),
    atom(
      text("Ảnh tư liệu hoạt động của Mặt trận phường Yên Nghĩa.", {
        size: 18,
        font: SANS,
        color: MUTED,
        italic: true,
        lh: 1.4,
      }),
    ),
  ];
  for (const it of atoms) thanBai.push({ ...it, bai: "fanpage" });
}

// Trang giấy khen
{
  const atoms = [
    atom(
      text("GHI NHẬN", { size: 19, font: SANS, bold: true, color: GOLD, gap: 6 }),
      text("GIẤY KHEN CỦA BAN CHẤP HÀNH ĐẢNG BỘ PHƯỜNG", {
        size: 31,
        bold: true,
        color: RED,
        lh: 1.24,
        gap: 16,
      }),
    ),
    atom(image(GIAY_KHEN, 470, { border: 4, borderColor: "#e6d9a8", gap: 14 })),
    atom(
      text(
        "Ban Chấp hành Đảng bộ phường Yên Nghĩa tặng Giấy khen cho Cơ quan Uỷ ban MTTQ phường vì đã có thành tích xuất sắc trong 1 năm thực hiện chính quyền địa phương 2 cấp.",
        { size: 23, lh: 1.6, gap: 8 },
      ),
      text("Số 212 — QĐ/ĐU, ngày 22 tháng 7 năm 2026.", {
        size: 20,
        font: SANS,
        color: GOLD,
        italic: true,
        lh: 1.4,
      }),
    ),
  ];
  for (const it of atoms) thanBai.push({ ...it, bai: "khen-thuong" });
}

const bodyPages = await paginate(thanBai);

/* ------------------------------------------------- mục lục (biết số trang) -- */
// bìa = 1, mục lục = 2, nội dung bắt đầu từ trang 3

const firstPageOf = new Map();
bodyPages.forEach((p, i) => {
  for (const key of p.bai) if (!firstPageOf.has(key)) firstPageOf.set(key, i + 3);
});

/**
 * Tên từng mục trong mục lục: nói rõ tin gì, đủ ngắn để mỗi tin gọn một dòng
 * nên các dòng thẳng hàng đều nhau.
 */
const TEN_MUC_LUC = {
  "sau-thang": "Triển khai nhiệm vụ trọng tâm, chăm lo nhân dân",
  "tri-an": "MTTQ phường lan toả nghĩa tình tri ân người có công",
  ccb: "Cựu chiến binh dâng hương tưởng niệm các Anh hùng liệt sĩ",
  "cong-doan": "Đối thoại, lắng nghe tâm tư của người lao động",
  "gpmb-tuyen-truyen": "Đẩy nhanh giải phóng mặt bằng mở rộng Quốc lộ 6",
  "gpmb-tham-hoi": "Thăm hỏi lực lượng tuyên truyền giải phóng mặt bằng",
  "phu-nu": "Phụ nữ phường tổng vệ sinh Nghĩa trang Liệt sĩ",
  "khen-thuong": "Giấy khen của Ban Chấp hành Đảng bộ phường",
};

function tenMucLuc(key) {
  if (TEN_MUC_LUC[key]) return TEN_MUC_LUC[key];

  // sách nhân bản cho tháng sau có thể thêm bài mới — lấy tạm tiêu đề bài
  const bai = ok.find((a) => a.key === key);
  if (!bai) return key;
  const t = tieuDe(bai).replace(/\s+/g, " ").trim();
  if (t.length <= 62) return t;
  const cat = t.lastIndexOf(" ", 62);
  return t.slice(0, cat > 40 ? cat : 62).trim() + "…";
}

/** Cột số trang rộng cố định để các dòng mục lục thẳng hàng nhau. */
const COT_SO = 58;

const tocAtoms = [
  atom(
    text("TRONG SỐ NÀY", { size: 44, bold: true, color: RED, align: "center", lh: 1.2, gap: 8 }),
    text("Bản tin nội bộ của Uỷ ban MTTQ Việt Nam phường Yên Nghĩa", {
      size: 20,
      font: SANS,
      color: GOLD,
      italic: true,
      align: "center",
      gap: 32,
    }),
  ),
  ...[...firstPageOf.entries()].map(([key, num]) =>
    row(
      [
        text(String(num).padStart(2, "0"), {
          size: 24, bold: true, color: GOLD, lh: 1.4, w: COT_SO - 14, align: "right", gap: 18,
        }),
      ],
      [text(tenMucLuc(key), { size: 24, bold: true, color: NAVY, lh: 1.4, w: CW - COT_SO, gap: 18 })],
      [M, M + COT_SO],
    ),
  ),
  atom(
    text(
      "Nội dung và hình ảnh trong số này được tổng hợp từ các bài đã đăng trên Báo Hànộimới và fanpage của phường về hoạt động của Uỷ ban MTTQ Việt Nam phường Yên Nghĩa.",
      { size: 20, font: SANS, color: INK, italic: true, lh: 1.55, gap: 0 },
    ),
  ),
];
const tocPages = await paginate(tocAtoms);

/* ------------------------------------------------------------ bìa & kết -- */

const cover = [
  image(EMBLEM, 104, { w: 104, x: (W - 104) / 2, y: 62, radius: 0, fit: "contain" }),
  text("UỶ BAN MẶT TRẬN TỔ QUỐC VIỆT NAM", {
    size: 22, font: SANS, color: CREAM, bold: true, align: "center", x: M, y: 182, w: CW, lh: 1.3,
  }),
  text("PHƯỜNG YÊN NGHĨA", {
    size: 30, font: SANS, color: WHITE, bold: true, align: "center", x: M, y: 212, w: CW, lh: 1.3,
  }),
  text("BẢN TIN MẶT TRẬN", {
    size: 62, color: WHITE, bold: true, align: "center", x: M, y: 272, w: CW, lh: 1.15,
  }),
  text("SỐ 01  ·  THÁNG 7/2026", {
    size: 26, font: SANS, color: CREAM, bold: true, align: "center", x: M, y: 356, w: CW, lh: 1.3,
  }),
  image(GIAY_KHEN, 232, { w: 330, x: M, y: 452, border: 4, borderColor: CREAM }),
  image(TRAO_QD_1, 232, { w: 330, x: W - M - 330, y: 452, border: 4, borderColor: CREAM }),
  text("Giấy khen của Ban Chấp hành Đảng bộ phường", {
    size: 17, font: SANS, color: CREAM, italic: true, align: "center", x: M, y: 692, w: 330, lh: 1.3,
  }),
  text("Hội nghị công bố quyết định thành lập", {
    size: 17, font: SANS, color: CREAM, italic: true, align: "center", x: W - M - 330, y: 692, w: 330, lh: 1.3,
  }),
  image(TRAO_QD_2, 240, { w: CW, x: M, y: 754, border: 4, borderColor: CREAM }),
  text("15 BAN CÔNG TÁC MẶT TRẬN  ·  15 TỔ DÂN PHỐ", {
    size: 21, font: SANS, color: CREAM, bold: true, align: "center", x: M, y: 1032, w: CW, lh: 1.3,
  }),
];

const back = [
  image(EMBLEM, 110, { w: 110, x: (W - 110) / 2, y: 360, radius: 0, fit: "contain" }),
  text("UỶ BAN MẶT TRẬN TỔ QUỐC VIỆT NAM\nPHƯỜNG YÊN NGHĨA", {
    size: 33, bold: true, color: WHITE, align: "center", x: M, y: 500, w: CW, lh: 1.35,
  }),
  text("BẢN TIN MẶT TRẬN  ·  SỐ 01  ·  THÁNG 7/2026", {
    size: 24, font: SANS, bold: true, color: CREAM, align: "center", x: M, y: 640, w: CW, lh: 1.4,
  }),
  text("15 Ban Công tác Mặt trận tại 15 Tổ dân phố trực thuộc", {
    size: 22, font: SANS, color: "#cfe0ff", align: "center", x: M, y: 692, w: CW, lh: 1.5,
  }),
];

/* ------------------------------------------------------------ xuất trang -- */

function toElement(b, x, y) {
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

const out = [];
out.push({
  background: "#a20f1a",
  backgroundImage: BG_COVER,
  elements: cover.map((b) => toElement(b, b.x ?? M, b.y ?? 0)),
});
for (const { els: p } of [...tocPages, ...bodyPages]) {
  out.push({
    background: "#ffffff",
    backgroundImage: BG_PAGE,
    elements: p.map(({ b, x, y }) => toElement(b, x ?? b.x ?? M, y)),
  });
}
out.push({
  background: "#0b3f8f",
  backgroundImage: BG_BACK,
  elements: back.map((b) => toElement(b, b.x ?? M, b.y ?? 0)),
});

await browser.close();

/* ------------------------------------------------------------- kiểm tra -- */

let loi = 0;
out.forEach((p, i) => {
  const boxes = p.elements.map((e) => ({
    id: e.id,
    t: e.y,
    b: e.y + (e.type === "image" ? e.h : H.get([...H.keys()].find((k) => k.content === e.content)) ?? 0),
    l: e.x,
    r: e.x + e.w,
  }));
  for (let a = 0; a < boxes.length; a++) {
    for (let c = a + 1; c < boxes.length; c++) {
      const A = boxes[a];
      const B = boxes[c];
      if (A.b > B.t + 2 && B.b > A.t + 2 && A.r > B.l + 2 && B.r > A.l + 2) {
        console.warn(`  ! trang ${i + 1}: ${A.id} đè ${B.id}`);
        loi++;
      }
    }
  }
});
console.log(loi ? `  ${loi} chỗ chồng lấn` : "  không có khối nào chồng nhau");

// Chỉ được phép hở ở trang cuối của một tin; hở giữa tin là lỗi xếp trang.
{
  const cuoiTin = new Set();
  bodyPages.forEach((p, i) => {
    const sau = bodyPages[i + 1];
    // trang cuối của một tin: tin trên trang này không còn xuất hiện ở trang sau
    if (!sau || [...p.bai].some((k) => !sau.bai.has(k))) cuoiTin.add(i);
  });

  const hoGiua = [];
  const hoCuoi = [];
  bodyPages.forEach((_, i) => {
    const p = out[i + 1 + tocPages.length];
    const day = Math.max(
      TOP,
      ...p.elements.map((e) =>
        e.y + (e.type === "image" ? e.h : (H.get([...H.keys()].find((k) => k.content === e.content)) ?? 0)),
      ),
    );
    const ho = Math.round(BOTTOM - day);
    if (ho <= 120) return;
    const nhan = `trang ${i + 2 + tocPages.length} (hở ${ho}px)`;
    (cuoiTin.has(i) ? hoCuoi : hoGiua).push(nhan);
  });

  console.log(
    hoGiua.length
      ? `  ✗ hở GIỮA tin (cần sửa): ${hoGiua.join(", ")}`
      : "  không trang nào hở giữa tin",
  );
  if (hoCuoi.length) console.log(`  · hở ở cuối tin (chấp nhận được): ${hoCuoi.join(", ")}`);
}

/* --------------------------------------------------------------- xuất SQL -- */

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const chrome = {
  margin: M,   // trùng lề nội dung để chữ đầu/chân trang thẳng hàng với thân bài
  skipFirstPage: true,
  skipLastPage: true,
  header: {
    enabled: true, text: "BẢN TIN MẶT TRẬN · PHƯỜNG YÊN NGHĨA", align: "left",
    fontSize: 18, color: RED, rule: true, ruleColor: GOLD, ruleWidth: 2,
    pageNumber: true, pageNumberAlign: "right",
  },
  footer: {
    // bỏ hẳn chân trang: số trang đã nằm ở góc trên bên phải
    enabled: false, text: "", align: "left",
    fontSize: 18, color: NAVY, rule: false, ruleColor: GOLD, ruleWidth: 2,
    pageNumber: false,
  },
};

const sql = `-- ============================================================================
-- Bản tin Mặt trận phường Yên Nghĩa — số 01 (tháng 7/2026)
-- SINH TỰ ĐỘNG: node scripts/fetch-articles.mjs && node scripts/make-bulletin.mjs
-- Nội dung + ảnh lấy từ các bài đã đăng trên Báo Hànộimới (nêu rõ nguồn ở mỗi bài),
-- ảnh giấy khen và ảnh hội nghị do phường cung cấp.
-- ============================================================================

delete from public.books where slug = 'ban-tin-mat-tran-so-01';

with b as (
  insert into public.books (id, title, slug, page_ratio, cover_url, chrome)
  values (
    '${BOOK_ID}',
    'Bản tin Mặt trận phường Yên Nghĩa — số 01',
    'ban-tin-mat-tran-so-01',
    'a4',
    ${q(BG_COVER)},
    ${q(JSON.stringify(chrome))}::jsonb
  )
  returning id
)
insert into public.book_pages (book_id, sort_order, background, background_image, elements)
select b.id, p.ord, p.bg, p.bgimg, p.els::jsonb
from b, (values
${out
  .map((p, i) => `  (${i}, ${q(p.background)}, ${q(p.backgroundImage)}, ${q(JSON.stringify(p.elements))})`)
  .join(",\n")}
) as p(ord, bg, bgimg, els);
`;

await writeFile(join(ROOT, "supabase", "demo-book-tin.sql"), sql);
console.log(`→ supabase/demo-book-tin.sql (${out.length} trang)`);
