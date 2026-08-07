/**
 * Sinh "Bản tin Dân vận khéo — Uỷ ban MTTQ Việt Nam phường Yên Nghĩa".
 *
 * Nội dung lấy từ 9 bài trong bộ "Tin bài dân vận khéo" (file Word do phường
 * cung cấp) — chữ và ảnh dựng thẳng vào trang, không phải link.
 * Bóc nội dung bằng scripts/extract-danvankheo.py → lib/danvankheo-articles.json.
 *
 * Khung trang, phép đo và bộ xếp trang dùng chung ở scripts/lib/khung-sach.mjs.
 *
 *   node scripts/make-danvankheo.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  ROOT, W, M, TOP, BOTTOM, CW, HALF,
  SANS, RED, NAVY, GOLD, INK, MUTED, WHITE, CREAM,
  text, image, atom, row, group,
  anhCum, khungCo,
  moTrinhDuyet, dongTrinhDuyet, heightOf,
  wrapItem, paginate, toElement,
} from "./lib/khung-sach.mjs";

/** Id cố định — script xoá rồi tạo lại sách mỗi lần chạy, giữ nguyên /admin/books/<id>. */
const BOOK_ID = "c4e8a1d7-3b62-4f95-8e07-2a9d5c61bf34";
const SLUG = "ban-tin-dan-van-kheo";

const BG_COVER = "/tin/bg-bia.webp";
const BG_PAGE = "/tin/bg-trang.webp";
const BG_BACK = "/tin/bg-bia-sau.webp";
const EMBLEM = "/brand/emblem.webp";

/** 3 ảnh tiêu biểu lên bìa: đi từng ngõ, đối thoại tại nhà dân, tháo dỡ bàn giao. */
const BIA_1 = "/tin/dvk/di-tung-ngo-5.webp";
const BIA_2 = "/tin/dvk/di-tung-ngo-6.webp";
const BIA_3 = "/tin/dvk/di-tung-ngo-13.webp";

await moTrinhDuyet();

/* -------------------------------------------------------------- dữ liệu -- */

const articles = JSON.parse(
  await readFile(join(ROOT, "lib", "danvankheo-articles.json"), "utf8"),
);

/**
 * Tiểu mục trong bài: dòng ngắn, không kết bằng dấu câu — in đậm màu xanh cờ
 * cho tách khỏi thân bài, giống cách trình bày trên báo.
 */
const laTieuMuc = (t) => t.length <= 90 && !/[.!?:…]$/.test(t) && !/^[“"]/.test(t);

/** Khung ảnh khi xếp hai tấm chung một trang. */
const DOI_W = 540;
const DOI_H = 320;

/** Một tấm trong cặp ảnh xếp đôi: khung cố định, ảnh co vào trong khung. */
const anhDoi = (img, nguon) => [
  image(img.path, DOI_H, {
    w: DOI_W, x: Math.round(M + (CW - DOI_W) / 2), border: 3, gap: 8, fit: "contain",
  }),
  text(img.caption || `Ảnh: ${nguon}.`, {
    size: 17, font: SANS, color: MUTED, italic: true, lh: 1.4, w: CW, x: M, gap: 14,
  }),
];

/**
 * Bài báo → danh sách mục để xếp trang.
 * Ảnh xen kẽ nhiều kiểu cho đỡ đơn điệu: ảnh lớn ngang, ảnh nửa trái, nửa phải.
 */
async function articleAtoms(a, tyLe = 1) {
  const co = (h) => Math.round(h * tyLe);
  const out = [];

  const header = atom(
    text(a.muc.toUpperCase(), { size: 19, font: SANS, bold: true, color: GOLD, gap: 6 }),
    text(a.title, { size: 33, bold: true, color: RED, lh: 1.24, gap: 8 }),
    text(`Nguồn: ${a.source}`, {
      size: 18, font: SANS, color: MUTED, italic: true, lh: 1.4, gap: 14,
    }),
  );

  const paras = [...a.paragraphs];
  const imgs = [...a.images];

  const moDau = a.sapo
    ? atom(text(a.sapo, { size: 24, bold: true, color: NAVY, lh: 1.55, align: "justify", gap: 16 }))
    : paras.length
      ? atom(text(paras.shift(), { align: "justify", gap: 14 }))
      : null;

  const mo = [header];
  let cumAnhMo = null;
  if (imgs.length) {
    const img = imgs.shift();
    const anh = anhCum(img, Math.min(CW, co(CW)), a.source);
    cumAnhMo = { ...atom(...anh), co: khungCo(img, anh, 250, 560) };
    mo.push(atom(...anh));
  }
  if (moDau) mo.push(moDau);

  const cumMo = group(...mo);
  cumMo.moDauBai = true; // mỗi tin luôn mở đầu ở một trang riêng
  if (cumAnhMo) cumMo.co = cumAnhMo.co;
  out.push(cumMo);

  // Thân bài: ảnh nửa trang LUÔN có chữ chạy bên cạnh (trái → phải → ngang lớn)
  let kieu = 0;
  while (paras.length) {
    const doan = paras.shift();

    // tiểu mục đi liền đoạn ngay sau nó, không đứng trơ cuối trang
    if (laTieuMuc(doan)) {
      const ke = paras.length ? paras.shift() : null;
      out.push(
        atom(
          text(doan, { size: 26, bold: true, color: NAVY, lh: 1.35, gap: ke ? 10 : 14 }),
          ...(ke ? [text(ke, { align: "justify", gap: 14 })] : []),
        ),
      );
      continue;
    }

    if (!imgs.length) {
      out.push(atom(text(doan, { align: "justify", gap: 14 })));
      continue;
    }

    if (kieu % 3 === 2) {
      // ảnh ngang lớn, chữ nằm trên nó
      out.push(atom(text(doan, { align: "justify", gap: 14 })));
      const img = imgs.shift();
      const anhNgang = anhCum(img, Math.min(CW, co(CW)), a.source);
      out.push({ ...atom(...anhNgang), co: khungCo(img, anhNgang, 190, 560) });
    } else {
      // gộp thêm một đoạn nữa để chữ có phần chảy tiếp bên dưới ảnh
      const noiDung = [doan, ...(paras.length && !laTieuMuc(paras[0]) ? [paras.shift()] : [])].join("\n\n");
      out.push(
        await wrapItem(imgs.shift(), kieu % 3 === 0 ? "left" : "right", noiDung, Math.min(HALF, co(HALF)), a.source),
      );
    }
    kieu++;
  }

  // Ảnh còn thừa khi đã hết chữ (bài ít chữ, nhiều ảnh): xếp hai tấm một trang.
  // Để mỗi trang một tấm thì ảnh ngang 16:9 không cao lên được (bề rộng đã kịch
  // khung), trang nào cũng hở gần nửa dưới.
  for (let i = 0; i < imgs.length; i += 2) {
    const cap = imgs.slice(i, i + 2);

    if (cap.length === 2) {
      // Hai ảnh dùng CHUNG một khung (fit "contain" nên không méo, không cắt) —
      // một trang không được có hai ảnh khác cỡ.
      out.push(atom(...cap.flatMap((img) => anhDoi(img, a.source))));
      continue;
    }

    const blocks = anhCum(cap[0], Math.min(CW, co(CW)), a.source);
    out.push({ ...atom(...blocks), co: khungCo(cap[0], blocks, 190, 700) });
  }

  return out;
}

/* ---------------------------------------------------------------- trang -- */

async function dayTrangCuoi(trang) {
  let day = TOP;
  for (const { b, y } of trang.at(-1).els) day = Math.max(day, y + (await heightOf(b)));
  return day - TOP;
}

/** Xếp một tin, thử vài cỡ ảnh rồi chọn phương án ít trang nhất. */
async function xepMotBai(a) {
  let tot = null;
  for (const tyLe of [1.3, 1.15, 1, 0.88, 0.76]) {
    const trang = await paginate(await articleAtoms(a, tyLe));
    const diem = trang.length * 100000 - (await dayTrangCuoi(trang));
    if (!tot || diem < tot.diem) tot = { trang, diem, tyLe };
  }
  return tot.trang;
}

const bodyPages = [];
for (const a of articles) {
  for (const t of await xepMotBai(a)) bodyPages.push({ els: t.els, bai: new Set([a.key]) });
}

/* ------------------------------------------------- mục lục (biết số trang) -- */
// bìa = 1, mục lục = 2, nội dung bắt đầu từ trang 3

const firstPageOf = new Map();
bodyPages.forEach((p, i) => {
  for (const key of p.bai) if (!firstPageOf.has(key)) firstPageOf.set(key, i + 3);
});

/** Tên mục lục: đủ ngắn để mỗi tin gọn một dòng, các dòng thẳng hàng nhau. */
const TEN_MUC_LUC = {
  "quyet-liet": "Yên Nghĩa quyết liệt tháo gỡ “5 điểm nghẽn” từ cơ sở",
  "tuyen-truyen-co-so": "Lấy tuyên truyền từ cơ sở gỡ “điểm nghẽn”",
  "gpmb-dong-thuan": "Giải phóng mặt bằng Quốc lộ 6: Tạo đồng thuận trong dân",
  "cu-tri": "Cử tri kiến nghị tháo gỡ vướng mắc đất đai, hạ tầng",
  "ba-ro-bon-tot": "Ra mắt mô hình “3 rõ, 4 tốt” tháo gỡ điểm nghẽn đô thị",
  "thi-dua": "Phát động thi đua cao điểm tháo gỡ 5 điểm nghẽn",
  "dong-vien": "Động viên lực lượng tuyên truyền giải phóng mặt bằng",
  "day-nhanh": "Đẩy nhanh tiến độ giải phóng mặt bằng Quốc lộ 6",
  "di-tung-ngo": "Đi từng ngõ, gõ từng nhà, gỡ từng vướng mắc",
};

const COT_SO = 58;

const tocAtoms = [
  atom(
    text("TRONG SỐ NÀY", { size: 44, bold: true, color: RED, align: "center", lh: 1.2, gap: 8 }),
    text("Tin bài các hoạt động của Uỷ ban MTTQ Việt Nam phường Yên Nghĩa\ntrong phong trào “Dân vận khéo”", {
      size: 20, font: SANS, color: GOLD, italic: true, align: "center", lh: 1.5, gap: 32,
    }),
  ),
  ...[...firstPageOf.entries()].map(([key, num]) =>
    row(
      [
        text(String(num).padStart(2, "0"), {
          size: 24, bold: true, color: GOLD, lh: 1.4, w: COT_SO - 14, align: "right", gap: 18,
        }),
      ],
      [text(TEN_MUC_LUC[key] ?? key, { size: 24, bold: true, color: NAVY, lh: 1.4, w: CW - COT_SO, gap: 18 })],
      [M, M + COT_SO],
    ),
  ),
  atom(
    text(
      "Nội dung và hình ảnh trong số này do Uỷ ban MTTQ Việt Nam phường Yên Nghĩa cung cấp, tổng hợp từ các tin bài về hoạt động của Mặt trận phường trong phong trào “Dân vận khéo”.",
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
  text("BẢN TIN DÂN VẬN KHÉO", {
    size: 54, color: WHITE, bold: true, align: "center", x: M, y: 268, w: CW, lh: 1.15,
  }),
  text("TIN BÀI HOẠT ĐỘNG CỦA MẶT TRẬN PHƯỜNG  ·  NĂM 2026", {
    size: 22, font: SANS, color: CREAM, bold: true, align: "center", x: M, y: 352, w: CW, lh: 1.4,
  }),
  image(BIA_1, 232, { w: 330, x: M, y: 452, border: 4, borderColor: CREAM }),
  image(BIA_2, 232, { w: 330, x: W - M - 330, y: 452, border: 4, borderColor: CREAM }),
  text("Đi từng ngõ, gõ từng nhà vận động bàn giao mặt bằng", {
    size: 17, font: SANS, color: CREAM, italic: true, align: "center", x: M, y: 692, w: 330, lh: 1.3,
  }),
  text("Đối thoại với từng hộ dân ngay tại gia đình", {
    size: 17, font: SANS, color: CREAM, italic: true, align: "center", x: W - M - 330, y: 692, w: 330, lh: 1.3,
  }),
  image(BIA_3, 240, { w: CW, x: M, y: 754, border: 4, borderColor: CREAM }),
  text("THÁO GỠ “5 ĐIỂM NGHẼN”  ·  GIẢI PHÓNG MẶT BẰNG QUỐC LỘ 6", {
    size: 20, font: SANS, color: CREAM, bold: true, align: "center", x: M, y: 1032, w: CW, lh: 1.3,
  }),
];

const back = [
  image(EMBLEM, 110, { w: 110, x: (W - 110) / 2, y: 360, radius: 0, fit: "contain" }),
  text("UỶ BAN MẶT TRẬN TỔ QUỐC VIỆT NAM\nPHƯỜNG YÊN NGHĨA", {
    size: 33, bold: true, color: WHITE, align: "center", x: M, y: 500, w: CW, lh: 1.35,
  }),
  text("BẢN TIN DÂN VẬN KHÉO  ·  NĂM 2026", {
    size: 24, font: SANS, bold: true, color: CREAM, align: "center", x: M, y: 640, w: CW, lh: 1.4,
  }),
  text("“Dân biết, dân bàn, dân làm, dân kiểm tra, dân thụ hưởng”", {
    size: 22, font: SANS, italic: true, color: "#cfe0ff", align: "center", x: M, y: 692, w: CW, lh: 1.5,
  }),
];

/* ------------------------------------------------------------ xuất trang -- */

const out = [];

/**
 * Ghi một trang. Chiều cao đo được của từng khối lưu kèm theo (mảng `cao`) để
 * bước kiểm tra bên dưới dùng đúng số đo của khối đó — tra ngược theo nội dung
 * sẽ nhầm khi hai khối khác cỡ có cùng một câu chữ (chú thích ảnh dùng lại,
 * tiêu đề bài trùng tên mục lục…).
 */
async function ghiTrang(background, backgroundImage, items) {
  const elements = [];
  const cao = [];
  for (const { b, x, y } of items) {
    elements.push(toElement(b, x ?? b.x ?? M, y ?? b.y ?? 0));
    cao.push(await heightOf(b));
  }
  out.push({ background, backgroundImage, elements, cao });
}

await ghiTrang("#a20f1a", BG_COVER, cover.map((b) => ({ b, x: b.x ?? M, y: b.y ?? 0 })));
for (const { els } of [...tocPages, ...bodyPages]) await ghiTrang("#ffffff", BG_PAGE, els);
await ghiTrang("#0b3f8f", BG_BACK, back.map((b) => ({ b, x: b.x ?? M, y: b.y ?? 0 })));

await dongTrinhDuyet();

/* ------------------------------------------------------------- kiểm tra -- */

let loi = 0;
out.forEach((p, i) => {
  const boxes = p.elements.map((e, k) => ({ id: e.id, t: e.y, b: e.y + p.cao[k], l: e.x, r: e.x + e.w }));
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

{
  const cuoiTin = new Set();
  bodyPages.forEach((p, i) => {
    const sau = bodyPages[i + 1];
    if (!sau || [...p.bai].some((k) => !sau.bai.has(k))) cuoiTin.add(i);
  });

  const hoGiua = [];
  const hoCuoi = [];
  bodyPages.forEach((_, i) => {
    const p = out[i + 1 + tocPages.length];
    const day = Math.max(TOP, ...p.elements.map((e, k) => e.y + p.cao[k]));
    const ho = Math.round(BOTTOM - day);
    if (ho <= 120) return;
    const nhan = `trang ${i + 2 + tocPages.length} (hở ${ho}px)`;
    (cuoiTin.has(i) ? hoCuoi : hoGiua).push(nhan);
  });

  console.log(
    hoGiua.length ? `  ✗ hở GIỮA tin (cần sửa): ${hoGiua.join(", ")}` : "  không trang nào hở giữa tin",
  );

  const lechCo = [];
  out.slice(1, -1).forEach((p, i) => {
    const anh = p.elements.filter((e) => e.type === "image");
    if (anh.length > 1 && anh.some((e) => e.w !== anh[0].w || e.h !== anh[0].h))
      lechCo.push(`trang ${i + 2} (${anh.map((e) => `${e.w}×${e.h}`).join(", ")})`);
  });
  console.log(
    lechCo.length ? `  ✗ trang có ảnh khác cỡ: ${lechCo.join(", ")}` : "  không trang nào có ảnh khác cỡ",
  );
  if (hoCuoi.length) console.log(`  · hở ở cuối tin (chấp nhận được): ${hoCuoi.join(", ")}`);
}

/* --------------------------------------------------------------- xuất SQL -- */

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const chrome = {
  margin: M,
  skipFirstPage: true,
  skipLastPage: true,
  header: {
    enabled: true, text: "BẢN TIN DÂN VẬN KHÉO · PHƯỜNG YÊN NGHĨA", align: "left",
    fontSize: 18, color: RED, rule: true, ruleColor: GOLD, ruleWidth: 2,
    pageNumber: true, pageNumberAlign: "right",
  },
  footer: {
    enabled: false, text: "", align: "left",
    fontSize: 18, color: NAVY, rule: false, ruleColor: GOLD, ruleWidth: 2,
    pageNumber: false,
  },
};

const sql = `-- ============================================================================
-- Bản tin Dân vận khéo — Uỷ ban MTTQ Việt Nam phường Yên Nghĩa
-- SINH TỰ ĐỘNG: node scripts/make-danvankheo.mjs
-- Nội dung + ảnh bóc từ 9 file Word trong bộ "Tin bài dân vận khéo" do phường
-- cung cấp (scripts/extract-danvankheo.py → lib/danvankheo-articles.json).
-- ============================================================================

delete from public.books where slug = '${SLUG}';

with b as (
  insert into public.books (id, title, slug, page_ratio, cover_url, chrome)
  values (
    '${BOOK_ID}',
    'Bản tin Dân vận khéo — phường Yên Nghĩa',
    '${SLUG}',
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

await writeFile(join(ROOT, "supabase", "book-dan-van-kheo.sql"), sql);
console.log(`→ supabase/book-dan-van-kheo.sql (${out.length} trang)`);
