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

const W = 800;
const M = 60;
const TOP = 96;
const BOTTOM = 972;
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
const row = (left, right) => ({ type: 'row', cols: [left, right] });

/** Nhiều mục dính liền: mở bài (tiêu đề + ảnh + sapo) không được tách trang. */
const group = (...items) => ({ type: 'group', items });

/* -------------------------------------------------------------- dữ liệu -- */

/** Tiêu đề các tin chỉ đăng trên fanpage (lấy nguyên từ file Word). */
const TIEU_DE_FB = {
  'gpmb-tuyen-truyen': 'Tuyên truyền công tác giải phóng mặt bằng',
  'gpmb-tham-hoi': 'MTTQ thăm hỏi, tặng quà tổ công tác tham gia tuyên truyền giải phóng mặt bằng',
  'phu-nu': 'Hội Liên hiệp Phụ nữ phường viếng nghĩa trang liệt sĩ',
};

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
    text(a.title, { size: 33, bold: true, color: RED, lh: 1.24, gap: 8 }),
    text([a.author, a.date, `Nguồn: ${a.source}`].filter(Boolean).join(" · "), {
      size: 18, font: SANS, color: MUTED, italic: true, lh: 1.4, gap: 14,
    }),
  );

  const paras = [...a.paragraphs];
  const imgs = [...a.images];

  // Mở bài: tiêu đề + ảnh lớn ngang + sapo đi liền nhau, không để trống trang
  const mo = [header];
  if (imgs.length) mo.push(atom(...anhCum(imgs.shift(), 320, CW, a.source)));
  if (a.sapo) {
    mo.push(atom(text(a.sapo, { size: 24, bold: true, color: NAVY, lh: 1.55, gap: 16 })));
  } else if (paras.length) {
    mo.push(atom(text(paras.shift(), { gap: 14 })));
  }
  out.push(group(...mo));

  // Thân bài: ảnh nửa trang LUÔN có chữ chạy bên cạnh (trái → phải → ngang lớn)
  let kieu = 0;
  while (paras.length) {
    const doan = paras.shift();

    if (!imgs.length) {
      out.push(atom(text(doan, { gap: 14 })));
      continue;
    }

    if (kieu % 3 === 2) {
      // ảnh ngang lớn, chữ nằm trên nó — không đặt ảnh nào cạnh ảnh
      out.push(atom(text(doan, { gap: 14 })));
      out.push(atom(...anhCum(imgs.shift(), 300, CW, a.source)));
    } else {
      // gộp thêm một đoạn nữa để chữ có phần chảy tiếp bên dưới ảnh
      const noiDung = [doan, ...(paras.length ? [paras.shift()] : [])].join("\n\n");
      out.push(await wrapItem(imgs.shift(), kieu % 3 === 0 ? "left" : "right", noiDung, 250, a.source));
    }
    kieu++;
  }

  // Ảnh còn thừa khi đã hết chữ: để ngang cả trang, không ghép đôi
  for (const img of imgs) out.push(atom(...anhCum(img, 300, CW, a.source)));

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
async function splitToFit(content, w, maxH) {
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

  // Không tìm được ranh giới câu hợp lý → đẩy cả đoạn xuống dưới, để trống
  // bên cạnh ảnh còn hơn cắt giữa câu.
  if (cat < 60) return ["", content];

  return [content.slice(0, cat).trim(), content.slice(cat).trim()];
}

/** Khoảng hở giữa đáy ảnh và phần chữ chạy full ngang bên dưới. */
const WRAP_GAP = 20;

/**
 * Mục "chữ chảy quanh ảnh": ảnh nửa trang một bên, chữ chạy bên cạnh,
 * hết ảnh thì chữ tràn ra full chiều ngang.
 */
async function wrapItem(img, side, content, imgH = 250, nguon) {
  const cot = anhCum(img, imgH, HALF, nguon);
  let colH = 0;
  for (const b of cot) colH += (await heightOf(b)) + b.gap;
  colH -= cot.at(-1).gap; // không tính gap cuối

  const [ben, duoi] = await splitToFit(content, HALF, colH);

  return {
    type: "wrap",
    side,
    cot,
    colH,
    ben: ben ? text(ben, { w: HALF, gap: 0 }) : null,
    duoi: duoi ? text(duoi, { gap: 14 }) : null,
  };
}

/* ------------------------------------------------------- xếp & ngắt trang -- */

/** Xếp các atom vào nhiều trang, atom nào không đủ chỗ thì đẩy sang trang sau. */
async function paginate(items, { continuedLabel } = {}) {
  const pages = [];
  let cur = [];
  let y = TOP;

  /** chiều cao của một mục: atom xếp dọc, row lấy cột cao nhất */
  async function heightOfItem(it) {
    if (it.type === "wrap") {
      return it.colH + (it.duoi ? WRAP_GAP + (await heightOf(it.duoi)) + it.duoi.gap : 14);
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
      if (it.ben) cur.push({ b: it.ben, x: xTxt, y });

      y += it.colH + WRAP_GAP;
      if (it.duoi) {
        cur.push({ b: it.duoi, x: M, y });
        y += (await heightOf(it.duoi)) + it.duoi.gap;
      }
      return;
    }
    if (it.type === "group") {
      for (const sub of it.items) await place(sub);
      return;
    }
    if (it.type === "row") {
      const xs = [COL_L, COL_R];
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

  for (const it of items) {
    const h = await heightOfItem(it);

    if (cur.length && y + h > BOTTOM) {
      pages.push(cur);
      cur = [];
      y = TOP;
      if (continuedLabel) {
        const label = text(continuedLabel, {
          size: 18, font: SANS, bold: true, color: GOLD, italic: true, gap: 14,
        });
        cur.push({ b: label, x: M, y });
        y += (await heightOf(label)) + label.gap;
      }
    }

    await place(it);
  }

  if (cur.length) pages.push(cur);
  return pages;
}

/* ---------------------------------------------------------------- trang -- */

const bodyPages = [];

for (const a of ok) {
  const laid = await paginate(await articleAtoms(a));
  for (const els of laid) bodyPages.push({ article: a.key, els });
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
  for (const els of await paginate(atoms)) bodyPages.push({ article: "fanpage", els });
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
  for (const els of await paginate(atoms)) bodyPages.push({ article: "khen-thuong", els });
}

/* ------------------------------------------------- mục lục (biết số trang) -- */
// bìa = 1, mục lục = 2, nội dung bắt đầu từ trang 3

const firstPageOf = new Map();
bodyPages.forEach((p, i) => {
  if (!firstPageOf.has(p.article)) firstPageOf.set(p.article, i + 3);
});

const MUC_LUC_TEN = {
  "sau-thang": "Triển khai nhiều nhiệm vụ trọng tâm, hướng về cơ sở, chăm lo nhân dân",
  "tri-an": "MTTQ phường lan toả nghĩa tình, tri ân người có công",
  ccb: "Hội Cựu chiến binh dâng hương tưởng niệm các anh hùng liệt sĩ",
  "cong-doan": "Đối thoại, lắng nghe tâm tư của người lao động",
  fanpage: "Hoạt động đăng tải trên fanpage phường",
  "khen-thuong": "Giấy khen của Ban Chấp hành Đảng bộ phường",
};

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
    atom(
      text(`${String(num).padStart(2, "0")}    ${MUC_LUC_TEN[key] ?? key}`, {
        size: 24,
        bold: true,
        color: NAVY,
        lh: 1.4,
        gap: 16,
      }),
    ),
  ),
  atom(
    text(
      "Nội dung và hình ảnh trong số này được tổng hợp từ các bài viết đã đăng trên Báo Hànộimới về hoạt động của Uỷ ban MTTQ Việt Nam phường Yên Nghĩa.",
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
  image(GIAY_KHEN, 232, { w: 330, x: M, y: 424, border: 4, borderColor: CREAM }),
  image(TRAO_QD_1, 232, { w: 330, x: W - M - 330, y: 424, border: 4, borderColor: CREAM }),
  text("Giấy khen của Ban Chấp hành Đảng bộ phường", {
    size: 17, font: SANS, color: CREAM, italic: true, align: "center", x: M, y: 664, w: 330, lh: 1.3,
  }),
  text("Hội nghị công bố quyết định thành lập", {
    size: 17, font: SANS, color: CREAM, italic: true, align: "center", x: W - M - 330, y: 664, w: 330, lh: 1.3,
  }),
  image(TRAO_QD_2, 220, { w: CW, x: M, y: 726, border: 4, borderColor: CREAM }),
  text("15 BAN CÔNG TÁC MẶT TRẬN  ·  15 TỔ DÂN PHỐ", {
    size: 21, font: SANS, color: CREAM, bold: true, align: "center", x: M, y: 986, w: CW, lh: 1.3,
  }),
];

const back = [
  image(EMBLEM, 110, { w: 110, x: (W - 110) / 2, y: 330, radius: 0, fit: "contain" }),
  text("UỶ BAN MẶT TRẬN TỔ QUỐC VIỆT NAM\nPHƯỜNG YÊN NGHĨA", {
    size: 33, bold: true, color: WHITE, align: "center", x: M, y: 470, w: CW, lh: 1.35,
  }),
  text("BẢN TIN MẶT TRẬN  ·  SỐ 01  ·  THÁNG 7/2026", {
    size: 24, font: SANS, bold: true, color: CREAM, align: "center", x: M, y: 606, w: CW, lh: 1.4,
  }),
  text("15 Ban Công tác Mặt trận tại 15 Tổ dân phố trực thuộc", {
    size: 22, font: SANS, color: "#cfe0ff", align: "center", x: M, y: 656, w: CW, lh: 1.5,
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
for (const p of [...tocPages, ...bodyPages.map((p) => p.els)]) {
  out.push({
    background: "#fffdf6",
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

/* --------------------------------------------------------------- xuất SQL -- */

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const chrome = {
  margin: 48,
  skipFirstPage: true,
  skipLastPage: true,
  header: {
    enabled: true, text: "BẢN TIN MẶT TRẬN · PHƯỜNG YÊN NGHĨA", align: "left",
    fontSize: 18, color: RED, rule: true, ruleColor: GOLD, ruleWidth: 2, pageNumber: false,
  },
  footer: {
    enabled: true, text: "Số 01 · Tháng 7/2026", align: "left",
    fontSize: 18, color: NAVY, rule: true, ruleColor: GOLD, ruleWidth: 2,
    pageNumber: true, pageNumberAlign: "right",
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
  insert into public.books (title, slug, page_ratio, cover_url, chrome)
  values (
    'Bản tin Mặt trận phường Yên Nghĩa — số 01',
    'ban-tin-mat-tran-so-01',
    '3:4',
    ${q(GIAY_KHEN)},
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
