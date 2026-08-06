/**
 * Sinh cuốn "Báo cáo kết quả công tác Mặt trận, các tổ chức chính trị - xã hội
 * 6 tháng đầu năm; phong trào Dân vận khéo và nhiệm vụ trọng tâm 6 tháng cuối
 * năm 2026" — dựng thẳng từ hai file Word của phường và bản quét khen thưởng.
 *
 * Khung trang, phép đo và bộ xếp trang dùng chung ở scripts/lib/khung-sach.mjs.
 *
 *   node scripts/prepare-report-assets.mjs && node scripts/make-report.mjs
 */
import { readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { inflateRawSync } from "node:zlib";
import {
  ROOT, W, PH, M, TOP, BOTTOM, CW, GUT, HALF,
  SERIF, SANS, RED, NAVY, GOLD, INK, MUTED,
  text, image, atom, group,
  anhCum, khungCo,
  moTrinhDuyet, dongTrinhDuyet, H, heightOf,
  paginate, toElement,
} from "./lib/khung-sach.mjs";

/** Id cố định để đường dẫn /admin/books/<id> không đổi sau mỗi lần chạy lại. */
const BOOK_ID = "b7c31f42-8d05-4e6a-9a2c-51d0f7c9e284";
const SLUG = "bao-cao-6-thang-dau-nam-2026";

const BG_BIA = "/tin/bg-bc-bia.webp";
const BG_TRANG = "/tin/bg-trang.webp";
const BG_SAU = "/tin/bg-bia-sau.webp";
const EMBLEM = "/brand/emblem.webp";

const XANH = "#2f7d32"; // xanh lá của bản in

const TIEU_DE = [
  "Kết quả công tác Mặt trận, các tổ chức chính trị - xã hội",
  "06 tháng đầu năm; phong trào “Dân vận khéo”",
  "và nhiệm vụ trọng tâm 06 tháng cuối năm 2026",
].join("\n");

await moTrinhDuyet();

/* --------------------------------------------------------- đọc file Word -- */

/** Lấy word/document.xml trong tệp .docx (zip: chỉ cần bung một mục). */
function docXml(file) {
  const buf = readFileSync(file);
  let i = 0;
  while ((i = buf.indexOf(Buffer.from("PK\x03\x04"), i)) >= 0) {
    const method = buf.readUInt16LE(i + 8);
    const csize = buf.readUInt32LE(i + 18);
    const nlen = buf.readUInt16LE(i + 26);
    const elen = buf.readUInt16LE(i + 28);
    const name = buf.subarray(i + 30, i + 30 + nlen).toString();
    const start = i + 30 + nlen + elen;
    if (name === "word/document.xml") {
      const raw = buf.subarray(start, start + csize);
      return method === 8 ? inflateRawSync(raw).toString("utf8") : raw.toString("utf8");
    }
    i = start + csize;
  }
  throw new Error(`không đọc được ${file}`);
}

const goHtml = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");

/** chữ trong một đoạn của Word */
const chuTrong = (s) =>
  goHtml([...s.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map((t) => t[1]).join(""))
    .replace(/\s+/g, " ")
    .trim();

/** chữ trong một ô bảng: mỗi đoạn một dòng, không dính chữ vào nhau */
const chuO = (s) =>
  [...s.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)]
    .map((m) => chuTrong(m[0]))
    .filter(Boolean)
    .join("\n");

/** Bảng Word → { cols: [bề rộng], hang: [[ô…]] }, bề rộng quy về khổ trang. */
function docBang(xml) {
  const grid = [...xml.matchAll(/<w:gridCol w:w="(\d+)"/g)].map((m) => +m[1]);
  const tong = grid.reduce((a, b) => a + b, 0) || 1;
  const KHE = 10;
  const rong = grid.map((g) => Math.round(((CW - KHE * (grid.length - 1)) * g) / tong));
  const xs = rong.reduce((a, w, i) => [...a, i ? a[i - 1] + rong[i - 1] + KHE : M], []);
  const hang = [...xml.matchAll(/<w:tr[ >][\s\S]*?<\/w:tr>/g)].map((h) =>
    [...h[0].matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)].map((c) => chuO(c[0])),
  );
  return { rong, xs, hang };
}

/**
 * Duyệt thân tài liệu theo đúng thứ tự: đoạn văn và bảng xen kẽ nhau, để bảng
 * nằm đúng chỗ của nó trong báo cáo chứ không bị đổ thành chữ chạy.
 */
function docThan(xml) {
  const body = xml.slice(xml.indexOf("<w:body>"));
  const khoi = [];
  let vt = 0;
  const themDoan = (doan) => {
    for (const m of doan.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)) {
      const t = chuTrong(m[0]);
      if (t) khoi.push({ loai: "p", t });
    }
  };
  for (const m of body.matchAll(/<w:tbl>[\s\S]*?<\/w:tbl>/g)) {
    themDoan(body.slice(vt, m.index));
    khoi.push({ loai: "bang", ...docBang(m[0]) });
    vt = m.index + m[0].length;
  }
  themDoan(body.slice(vt));
  return khoi;
}

const xmlBC = docXml(join(ROOT, "..", "BC phục vụ HN làm việc với Đảng uỷ phường..docx"));
const thanBC = docThan(xmlBC);
const dongBC = thanBC.filter((k) => k.loai === "p").map((k) => k.t);

const xmlBieu = docXml(join(ROOT, "..", "ĐU. Biểu kèm theo BC 6 tháng.docx"));
const bangBieu = [...xmlBieu.matchAll(/<w:tbl>[\s\S]*?<\/w:tbl>/g)].map((b) =>
  [...b[0].matchAll(/<w:tr[ >][\s\S]*?<\/w:tr>/g)].map((h) =>
    [...h[0].matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)].map((c) => chuTrong(c[0])),
  ),
);

const anh = JSON.parse(await readFile(join(ROOT, "lib", "report-assets.json"), "utf8"));

/* ------------------------------------------------------- kiểu từng cấp -- */

const CAP = {
  /** I. II. … — đề mục lớn */
  I: (t) => atom(text(t, { size: 27, bold: true, color: RED, lh: 1.3, gap: 12 })),
  /** 1. 2. … — đề mục vừa */
  "1": (t) => atom(text(t, { size: 24, bold: true, color: NAVY, lh: 1.35, gap: 10 })),
  /** 1.1. 2.3. … — đề mục nhỏ */
  "1.1": (t) => atom(text(t, { size: 22, bold: true, italic: true, color: NAVY, lh: 1.4, gap: 8 })),
  /** * … — mục nhấn */
  "*": (t) => atom(text(t, { size: 22, bold: true, color: INK, lh: 1.45, gap: 8 })),
  /** - … + … — gạch đầu dòng */
  gach: (t) => atom(text(t, { size: 22, color: INK, lh: 1.55, align: "justify", gap: 8 })),
  /** đoạn văn thường */
  p: (t) => atom(text(t, { size: 22, color: INK, lh: 1.6, align: "justify", gap: 12 })),
};

const phanCap = (s) =>
  /^[IVX]+\.\s/.test(s) ? "I"
  : /^\d+\.\d+\./.test(s) ? "1.1"
  : /^\d+\.\s/.test(s) ? "1"
  : /^\*/.test(s) ? "*"
  : /^[-+]\s/.test(s) ? "gach"
  : "p";

/* ------------------------------------------------------------- các trang -- */

/** Bìa 1 — theo bản phác của phường: tên cơ quan, tên báo cáo, ảnh khen thưởng. */
const KHUNG_KHEN = { w: 206, h: 143 }; // ba khung bằng nhau, ảnh vào trọn khung
const bia = [
  image(EMBLEM, 92, { w: 92, x: (W - 92) / 2, y: 74, radius: 0, fit: "contain" }),
  text("UỶ BAN MẶT TRẬN TỔ QUỐC VIỆT NAM", {
    size: 21, font: SANS, bold: true, color: XANH, align: "center", x: M, y: 184, w: CW, lh: 1.3,
  }),
  text("PHƯỜNG YÊN NGHĨA", {
    size: 27, font: SANS, bold: true, color: XANH, align: "center", x: M, y: 214, w: CW, lh: 1.3,
  }),
  text("BÁO CÁO", {
    size: 58, bold: true, color: RED, align: "center", x: M, y: 274, w: CW, lh: 1.15,
  }),
  text(TIEU_DE, {
    size: 23, bold: true, color: "#1f4d20", align: "center", x: M, y: 356, w: CW, lh: 1.5,
  }),

  // ba khung khen thưởng cùng một cỡ, ảnh không bị cắt
  ...[anh.giayKhenCu, anh.khen[2], anh.khen[1]].map((a, i) =>
    image(a.path, KHUNG_KHEN.h, {
      w: KHUNG_KHEN.w,
      x: M + i * (KHUNG_KHEN.w + 31),
      y: 490,
      border: 3,
      borderColor: XANH,
      fit: "contain",
    }),
  ),
  text("Giấy khen, Bằng khen tặng Uỷ ban MTTQ Việt Nam phường và các tổ chức thành viên", {
    size: 17, font: SANS, italic: true, color: MUTED, align: "center", x: M, y: 648, w: CW, lh: 1.4,
  }),

  // khung đúng tỉ lệ ảnh nên không hở viền hai bên
  image(anh.hoiNghi.path, Math.round(430 * (anh.hoiNghi.h / anh.hoiNghi.w)), {
    w: 430, x: (W - 430) / 2, y: 692, border: 3, borderColor: XANH, fit: "contain",
  }),
  text("Yên Nghĩa, tháng 8 năm 2026", {
    size: 20, italic: true, color: "#1f4d20", align: "center", x: M, y: 1030, w: CW, lh: 1.4,
  }),
];

/** Trang 2 — trang tên báo cáo, dựng theo đúng bản in phường đang dùng. */
const trangTen = [
  text("UỶ BAN MẶT TRẬN TỔ QUỐC PHƯỜNG YÊN NGHĨA", {
    size: 24, bold: true, color: RED, align: "center", x: M, y: 150, w: CW, lh: 1.35,
  }),
  text("- - - - - - - - - - - - - - - - -", {
    size: 20, color: XANH, align: "center", x: M, y: 196, w: CW, lh: 1.3,
  }),
  image(EMBLEM, 200, { w: 200, x: (W - 200) / 2, y: 300, radius: 0, fit: "contain" }),
  text("BÁO CÁO", {
    size: 46, bold: true, color: RED, align: "center", x: M, y: 594, w: CW, lh: 1.2,
  }),
  text(TIEU_DE, {
    size: 22, bold: true, color: RED, align: "center", x: M, y: 672, w: CW, lh: 1.6,
  }),
  text("Yên Nghĩa, tháng 8 năm 2026", {
    size: 21, italic: true, color: INK, align: "center", x: M, y: 1002, w: CW, lh: 1.4,
  }),
];

/* --------------------------------------------------- thân báo cáo & phụ lục -- */

const items = [];

// Phần đầu công văn: hai cột kiểu văn bản hành chính
const CO_TRAI = 300;
items.push({
  type: "row",
  cols: [
    [
      text("UỶ BAN MTTQ VIỆT NAM PHƯỜNG YÊN NGHĨA", {
        size: 19, font: SANS, bold: true, color: INK, align: "center", w: CO_TRAI, lh: 1.35, gap: 2,
      }),
      text("BAN THƯỜNG TRỰC", {
        size: 19, font: SANS, bold: true, color: INK, align: "center", w: CO_TRAI, lh: 1.35, gap: 6,
      }),
      text("Số:        /BC-MTTQ-BTT", {
        size: 19, font: SANS, color: INK, align: "center", w: CO_TRAI, lh: 1.35, gap: 0,
      }),
    ],
    [
      text("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", {
        size: 19, font: SANS, bold: true, color: INK, align: "center", w: CW - CO_TRAI - GUT, lh: 1.35, gap: 2,
      }),
      text("Độc lập - Tự do - Hạnh phúc", {
        size: 19, font: SANS, bold: true, color: INK, align: "center", w: CW - CO_TRAI - GUT, lh: 1.35, gap: 6,
      }),
      text("Yên Nghĩa, ngày 04 tháng 8 năm 2026", {
        size: 19, font: SANS, italic: true, color: INK, align: "center", w: CW - CO_TRAI - GUT, lh: 1.35, gap: 0,
      }),
    ],
  ],
  xs: [M, M + CO_TRAI + GUT],
});

items.push(
  group(
    atom(text("BÁO CÁO", { size: 34, bold: true, color: RED, align: "center", lh: 1.2, gap: 24 })),
    atom(
      text(TIEU_DE.replace(/\n/g, " "), {
        size: 23, bold: true, color: NAVY, align: "center", lh: 1.5, gap: 22,
      }),
    ),
  ),
);

/**
 * Một bảng của báo cáo → các hàng để xếp trang. Hàng đầu là tiêu đề cột (đậm,
 * màu đỏ); mỗi ô là một cột chữ riêng nên chữ dài tự xuống dòng trong ô.
 */
function veBang({ rong, xs, hang }) {
  const dungHang = (o, dauBang) => ({
    type: "row",
    cols: rong.map((w, c) => [
      text(o[c] ?? "", {
        size: dauBang ? 17 : 18,
        font: SANS,
        bold: dauBang,
        color: dauBang ? RED : INK,
        align: c === 0 ? "center" : "left",
        w,
        lh: 1.42,
        gap: dauBang ? 12 : 16,
      }),
    ]),
    xs,
  });

  const tieuDe = dungHang(hang[0] ?? [], true);
  // các hàng dữ liệu mang theo dòng tiêu đề, để bảng vắt trang thì nhắc lại
  return [tieuDe, ...hang.slice(1).map((o) => ({ ...dungHang(o, false), tieuDeBang: tieuDe }))];
}

// Thân báo cáo: đoạn văn và bảng xen kẽ đúng thứ tự trong file Word.
// Bỏ phần đầu công văn và khối "Nơi nhận" (hai bảng 2 cột) vì đã dựng riêng.
const batDau = thanBC.findIndex((k) => k.loai === "p" && /^Thực hiện Công văn/.test(k.t));
for (const khoi of thanBC.slice(batDau)) {
  if (khoi.loai === "p") {
    items.push(CAP[phanCap(khoi.t)](khoi.t));
  } else if (khoi.rong.length >= 3) {
    items.push(...veBang(khoi));
  }
}

// Khối ký cuối báo cáo (trong file Word nằm trong một bảng 2 cột nên dựng riêng)
const NOI_NHAN = [
  "Nơi nhận:",
  "- BTT UB MTTQ Việt Nam Thành phố (để b/c);",
  "- Ban Thường vụ Đảng ủy phường (để b/c);",
  "- Các tổ chức chính trị - xã hội phường;",
  "- Lưu: BTT-MTTQ.",
];
items.push(
  group(
    ...NOI_NHAN.map((t) =>
      atom(
        text(t, {
          size: 19, font: SANS, italic: !/^Nơi nhận:/.test(t), bold: /^Nơi nhận:/.test(t),
          color: MUTED, lh: 1.5, gap: 4,
        }),
      ),
    ),
    atom(
      text("TM. BAN THƯỜNG TRỰC\nCHỦ TỊCH", {
        size: 20, font: SANS, bold: true, color: INK, align: "center", x: M + CW / 2, w: CW / 2, lh: 1.5, gap: 76,
      }),
    ),
    atom(
      text("Lương Huệ Minh", {
        size: 22, bold: true, color: INK, align: "center", x: M + CW / 2, w: CW / 2, lh: 1.4, gap: 0,
      }),
    ),
  ),
);

/* ------------------------------------------------------------- phụ lục -- */

const COT = [40, 122, 258, 138, 92]; // STT · tên · nội dung · đơn vị · hình thức
const XCOT = COT.reduce((a, w, i) => [...a, i ? a[i - 1] + COT[i - 1] + 8 : M], []);

/** một hàng của biểu: mỗi ô là một cột chữ riêng */
const hangBieu = (o, dam = false) => ({
  type: "row",
  cols: o.map((noiDung, i) =>
    [
      text(noiDung, {
        size: dam ? 18 : 19,
        font: SANS,
        bold: dam,
        color: dam ? RED : INK,
        align: i === 0 ? "center" : "left",
        w: COT[i],
        lh: 1.4,
        gap: dam ? 14 : 16,
      }),
    ],
  ),
  xs: XCOT,
});

items.push(
  group(
    atom(text("PHỤ LỤC KÈM THEO", { size: 19, font: SANS, bold: true, color: GOLD, gap: 6 })),
    atom(text("BIỂU KẾT QUẢ CÔNG TÁC THI ĐUA - KHEN THƯỞNG", {
      size: 27, bold: true, color: RED, lh: 1.3, gap: 8,
    })),
    atom(text("Uỷ ban Mặt trận Tổ quốc Việt Nam phường Yên Nghĩa — 6 tháng đầu năm 2026", {
      size: 19, font: SANS, italic: true, color: MUTED, lh: 1.4, gap: 18,
    })),
  ),
);
items.at(-1).moDauBai = true; // phụ lục mở trang riêng

const bieu = bangBieu[0] ?? [];
items.push({ ...hangBieu(bieu[0] ?? [], true), nenTieuDe: true });
for (const h of bieu.slice(1)) items.push(hangBieu(h));

/* -------------------------------------------------- ảnh khen thưởng cuối -- */

const cumKhen = group(
  atom(text("HÌNH ẢNH KHEN THƯỞNG", { size: 19, font: SANS, bold: true, color: GOLD, gap: 6 })),
  atom(text("Bằng khen, Giấy khen 6 tháng đầu năm 2026", {
    size: 27, bold: true, color: RED, lh: 1.3, gap: 18,
  })),
);
cumKhen.moDauBai = true;
items.push(cumKhen);

// Mọi bằng/giấy khen dùng chung một khung đúng bằng nhau (lấy theo tấm "cao"
// nhất) nên hai tấm được phép nằm chung một trang, và không tấm nào bị cắt.
const DS_KHEN = [anh.giayKhenCu, ...anh.khen];
const W_KHEN = 500;
const H_KHEN = Math.round(W_KHEN * Math.max(...DS_KHEN.map((a) => a.h / a.w)));

for (const a of DS_KHEN) {
  items.push(
    atom(
      image(a.path, H_KHEN, {
        w: W_KHEN,
        x: Math.round(M + (CW - W_KHEN) / 2),
        border: 3,
        gap: 8,
        fit: "contain",
      }),
      text(a.caption, {
        size: 17, font: SANS, color: MUTED, italic: true, align: "center", lh: 1.4, w: CW, gap: 22,
      }),
    ),
  );
}

/* -------------------------------------------------------------- xếp trang -- */

const trangThan = await paginate(items);

const out = [
  { background: "#e9f3cf", backgroundImage: BG_BIA, elements: bia.map((b) => toElement(b, b.x ?? M, b.y ?? 0)) },
  { background: "#e9f3cf", backgroundImage: BG_BIA, elements: trangTen.map((b) => toElement(b, b.x ?? M, b.y ?? 0)) },
  ...trangThan.map(({ els }) => ({
    background: "#ffffff",
    backgroundImage: BG_TRANG,
    elements: els.map(({ b, x, y }) => toElement(b, x ?? b.x ?? M, y)),
  })),
  {
    background: "#0b3f8f",
    backgroundImage: BG_SAU,
    elements: [
      image(EMBLEM, 110, { w: 110, x: (W - 110) / 2, y: 360, radius: 0, fit: "contain" }),
      text("UỶ BAN MẶT TRẬN TỔ QUỐC VIỆT NAM\nPHƯỜNG YÊN NGHĨA", {
        size: 32, bold: true, color: "#ffffff", align: "center", x: M, y: 500, w: CW, lh: 1.35,
      }),
      text("Báo cáo 6 tháng đầu năm 2026", {
        size: 23, font: SANS, bold: true, color: "#ffd76a", align: "center", x: M, y: 640, w: CW, lh: 1.4,
      }),
    ].map((b) => toElement(b, b.x ?? M, b.y ?? 0)),
  },
];

await dongTrinhDuyet();

/* -------------------------------------------------------------- kiểm tra -- */

let loi = 0;
out.forEach((p, i) => {
  const hop = p.elements.map((e) => ({
    id: e.id,
    t: e.y,
    b: e.y + (e.type === "image" ? e.h : (H.get([...H.keys()].find((k) => k.content === e.content)) ?? 0)),
    l: e.x,
    r: e.x + e.w,
  }));
  for (let a = 0; a < hop.length; a++)
    for (let c = a + 1; c < hop.length; c++) {
      const A = hop[a];
      const B = hop[c];
      if (A.b > B.t + 2 && B.b > A.t + 2 && A.r > B.l + 2 && B.r > A.l + 2) {
        console.warn(`  ! trang ${i + 1}: ${A.id} đè ${B.id}`);
        loi++;
      }
    }
});
console.log(loi ? `  ${loi} chỗ chồng lấn` : "  không có khối nào chồng nhau");

const lechCo = [];
out.slice(2, -1).forEach((p, i) => {
  const a = p.elements.filter((e) => e.type === "image");
  if (a.length > 1 && a.some((e) => e.w !== a[0].w || e.h !== a[0].h))
    lechCo.push(`trang ${i + 3} (${a.map((e) => `${e.w}×${e.h}`).join(", ")})`);
});
console.log(lechCo.length ? `  ✗ trang có ảnh khác cỡ: ${lechCo.join(", ")}` : "  không trang nào có ảnh khác cỡ");

/* --------------------------------------------------------------- xuất SQL -- */

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const chrome = {
  margin: M,
  skipFirstPage: true,
  skipLastPage: true,
  header: {
    enabled: true, text: "BÁO CÁO 6 THÁNG ĐẦU NĂM 2026 · MTTQ PHƯỜNG YÊN NGHĨA", align: "left",
    fontSize: 17, color: RED, rule: true, ruleColor: GOLD, ruleWidth: 2,
    pageNumber: true, pageNumberAlign: "right",
  },
  footer: {
    enabled: false, text: "", align: "left",
    fontSize: 18, color: NAVY, rule: false, ruleColor: GOLD, ruleWidth: 2, pageNumber: false,
  },
};

const sql = `-- ============================================================================
-- Báo cáo kết quả công tác Mặt trận 6 tháng đầu năm 2026 — phường Yên Nghĩa
-- SINH TỰ ĐỘNG: node scripts/prepare-report-assets.mjs && node scripts/make-report.mjs
-- Nội dung lấy từ file Word của phường; ảnh khen thưởng từ bản quét CamScanner.
-- ============================================================================

delete from public.books where slug = '${SLUG}';

with b as (
  insert into public.books (id, title, slug, page_ratio, cover_url, chrome)
  values (
    '${BOOK_ID}',
    'Báo cáo công tác Mặt trận 6 tháng đầu năm 2026',
    '${SLUG}',
    'a4',
    ${q(BG_BIA)},
    ${q(JSON.stringify(chrome))}::jsonb
  )
  returning id
)
insert into public.book_pages (book_id, sort_order, background, background_image, elements)
select b.id, p.ord, p.bg, p.bgimg, p.els::jsonb
from b, (values
${out
  .map(
    (p, i) =>
      `  (${i}, ${q(p.background)}, ${q(p.backgroundImage)}, ${q(JSON.stringify(p.elements))})`,
  )
  .join(",\n")}
) as p(ord, bg, bgimg, els);
`;

await writeFile(join(ROOT, "supabase", "book-bao-cao.sql"), sql);
console.log(`→ supabase/book-bao-cao.sql (${out.length} trang)`);
