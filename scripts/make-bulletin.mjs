/**
 * Sinh "Bản tin Mặt trận phường Yên Nghĩa — số 01".
 *
 * Nội dung lấy từ chính các bài báo trong file Word (đã tải sẵn về bằng
 * scripts/fetch-articles.mjs) — chữ và ảnh dựng thẳng vào trang, không phải link.
 *
 * Khung trang, phép đo và bộ xếp trang nằm ở scripts/lib/khung-sach.mjs.
 *
 *   node scripts/fetch-articles.mjs && node scripts/make-bulletin.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  ROOT, W, PH, M, TOP, CHAN_SEN, BOTTOM, CW, GUT, HALF, COL_L, COL_R,
  SERIF, SANS, RED, NAVY, GOLD, INK, MUTED, WHITE, CREAM,
  text, image, atom, row, group, uid,
  tyLeAnh, anhCum, khungCo,
  moTrinhDuyet, dongTrinhDuyet, H, heightOf, measureText,
  splitToFit, caoCot, wrapItem, paginate, toElement,
} from "./lib/khung-sach.mjs";

/**
 * Id cố định của cuốn bản tin. Script xoá rồi tạo lại sách mỗi lần chạy; nếu để
 * Postgres tự sinh id thì đường dẫn /admin/books/<id> đang mở sẽ thành 404.
 */
const BOOK_ID = "69045c01-c567-4097-b580-af7392760aff";

const BG_COVER = "/tin/bg-bia.webp";
const BG_PAGE = "/tin/bg-trang.webp";
const BG_BACK = "/tin/bg-bia-sau.webp";
const EMBLEM = "/brand/emblem.webp";
const GIAY_KHEN = "/tin/giay-khen.webp";
const TRAO_QD_1 = "/tin/trao-quyet-dinh-1.webp";
const GK_TUYEN_QUAN = "/tin/khen/gk-nhap-ngu.webp";
const TRAO_QD_2 = "/tin/trao-quyet-dinh-2.webp";

await moTrinhDuyet();

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


/**
 * Bài báo → danh sách mục để xếp trang.
 * Ảnh xen kẽ nhiều kiểu cho đỡ đơn điệu: ảnh lớn ngang, ảnh nửa trái, nửa phải,
 * và cặp hai ảnh cạnh nhau.
 */
async function articleAtoms(a, tyLe = 1) {
  const co = (h) => Math.round(h * tyLe);
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
    const img = imgs.shift();
    const anh = anhCum(img, Math.min(CW, co(CW)), a.source);
    cumAnhMo = { ...atom(...anh), co: khungCo(img, anh, 250, 560) };
    mo.push(atom(...anh));
  }
  if (moDau) mo.push(moDau);

  // Cụm mở bài dính liền nhau; ảnh mở bài co theo chỗ trống còn lại của trang
  // nên bài mới có thể chạy tiếp ngay trên trang đang dở, không phải sang trang.
  const cumMo = group(...mo);
  cumMo.moDauBai = true; // mỗi tin luôn mở đầu ở một trang riêng
  if (cumAnhMo) cumMo.co = cumAnhMo.co;
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
      const img = imgs.shift();
      const anhNgang = anhCum(img, Math.min(CW, co(CW)), a.source);
      out.push({ ...atom(...anhNgang), co: khungCo(img, anhNgang, 190, 560) });
    } else {
      // gộp thêm một đoạn nữa để chữ có phần chảy tiếp bên dưới ảnh
      const noiDung = [doan, ...(paras.length ? [paras.shift()] : [])].join("\n\n");
      out.push(await wrapItem(imgs.shift(), kieu % 3 === 0 ? "left" : "right", noiDung, Math.min(HALF, co(HALF)), a.source));
    }
    kieu++;
  }

  // Ảnh còn thừa khi đã hết chữ: để ngang cả trang, không ghép đôi.
  // Cho co giãn chiều cao để lấp kín chỗ trống cuối bài, khỏi hở một mảng trắng.
  for (const img of imgs) {
    const blocks = anhCum(img, Math.min(CW, co(CW)), a.source);
    out.push({ ...atom(...blocks), co: khungCo(img, blocks, 190, 700) });
  }

  return out;
}

/* ---------------------------------------------------------------- trang -- */

/**
 * Mọi bài xếp trong một mạch liền: bài sau chạy tiếp ngay trên trang đang dở
 * (ảnh mở bài tự co cho vừa chỗ trống) thay vì bài nào cũng mở trang mới —
 * trước đây cách đó bỏ trống rất nhiều nửa trang cuối bài.
 */
const thanBai = [];

/** Phần trang đã dùng của trang cuối cùng — để biết trang đó có bị trống trơ không. */
async function dayTrangCuoi(trang) {
  let day = TOP;
  for (const { b, y } of trang.at(-1).els) day = Math.max(day, y + (await heightOf(b)));
  return day - TOP;
}

/**
 * Xếp một tin, thử vài cỡ ảnh rồi chọn phương án ít trang nhất. Vì mỗi tin đều
 * mở trang riêng nên thu ảnh nhỏ lại một chút thường kéo được phần đuôi bài về,
 * bớt hẳn một trang gần như trống.
 */
async function xepMotBai(a) {
  let tot = null;
  for (const tyLe of [1.3, 1.15, 1, 0.88, 0.76]) {
    const trang = await paginate(await articleAtoms(a, tyLe));
    // ít trang hơn thắng; cùng số trang thì trang cuối đầy hơn thắng
    const diem = trang.length * 100000 - (await dayTrangCuoi(trang));
    if (!tot || diem < tot.diem) tot = { trang, diem, tyLe };
  }
  return tot.trang;
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
  atoms.forEach((it, i) => thanBai.push({ ...it, bai: "fanpage", moDauBai: i === 0 }));
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
  atoms.forEach((it, i) => thanBai.push({ ...it, bai: "khen-thuong", moDauBai: i === 0 }));
}

// Mỗi tin xếp riêng (tin mới luôn mở trang mới), rồi nối lại thành thân sách
const bodyPages = [];
for (const a of ok) {
  for (const t of await xepMotBai(a)) bodyPages.push({ els: t.els, bai: new Set([a.key]) });
}
for (const t of await paginate(thanBai)) bodyPages.push(t);

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
  image(GIAY_KHEN, 232, { w: 330, x: M, y: 452, border: 4, borderColor: CREAM, fit: "contain" }),
  // bìa đặt hai Giấy khen khác nhau; ảnh hội nghị chỉ để một tấm ở dưới
  image(GK_TUYEN_QUAN, 232, { w: 330, x: W - M - 330, y: 452, border: 4, borderColor: CREAM, fit: "contain" }),
  text("Giấy khen của Ban Chấp hành Đảng bộ phường", {
    size: 17, font: SANS, color: CREAM, italic: true, align: "center", x: M, y: 692, w: 330, lh: 1.3,
  }),
  text("Giấy khen của Chủ tịch UBND phường Yên Nghĩa", {
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

await dongTrinhDuyet();

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

  // Một trang không được có hai ảnh khác cỡ
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
