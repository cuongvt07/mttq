/**
 * Sinh "Bản tin Mặt trận phường Yên Nghĩa — số 01" từ nội dung file Word + ảnh thật.
 *
 * Điểm khác các file demo viết tay: script đo chiều cao thật của từng khối chữ
 * bằng Chrome (đúng phông, đúng bề rộng) rồi mới xếp dọc theo dòng chảy, nên
 * không bao giờ chồng chữ hay tràn khỏi trang.
 *
 *   node scripts/make-bulletin.mjs          # sinh supabase/demo-book-tin.sql
 */
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const W = 800;
const H = 1067;
const M = 60; // lề trái/phải
const TOP = 96; // chừa chỗ cho đầu trang
const BOTTOM = 975; // chừa chỗ cho chân trang
const CW = W - M * 2; // bề rộng cột chữ

const SERIF = '"Times New Roman", Times, serif';
const SANS = '"Segoe UI", system-ui, sans-serif';

const RED = "#a20f1a";
const NAVY = "#0b3f8f";
const GOLD = "#c8a227";
const INK = "#22303f";
const WHITE = "#ffffff";
const CREAM = "#ffd76a";

const BG_COVER = "/tin/bg-bia.webp";
const BG_PAGE = "/tin/bg-trang.webp";
const BG_BACK = "/tin/bg-bia-sau.webp";
const EMBLEM = "/brand/emblem.webp";
const GIAY_KHEN = "/tin/giay-khen.webp";
const TRAO_QD_1 = "/tin/trao-quyet-dinh-1.webp";
const TRAO_QD_2 = "/tin/trao-quyet-dinh-2.webp";

/* ------------------------------------------------------------- helper khối -- */

let seq = 0;
const uid = (p) => `${p}${++seq}`;

const text = (content, o = {}) => ({
  kind: "text",
  content,
  fontSize: o.size ?? 26,
  fontFamily: o.font ?? SERIF,
  color: o.color ?? INK,
  bold: o.bold ?? false,
  italic: o.italic ?? false,
  align: o.align ?? "left",
  lineHeight: o.lh ?? 1.5,
  href: o.href,
  gap: o.gap ?? 18,
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
  gap: o.gap ?? 18,
});

/* --------------------------------------------------------------- nội dung -- */
// Tiêu đề và link lấy nguyên từ file Word; phần mô tả chỉ diễn giải lại tiêu đề,
// không thêm chi tiết nào không có trong tài liệu.

const TIN = {
  hoiNghi: {
    title: "CÔNG BỐ QUYẾT ĐỊNH THÀNH LẬP BAN CÔNG TÁC MẶT TRẬN VÀ CÁC CHI HỘI ĐOÀN THỂ",
    lead: "Uỷ ban MTTQ Việt Nam và các đoàn thể phường Yên Nghĩa tổ chức hội nghị công bố các quyết định thành lập Ban Công tác Mặt trận và các chi hội đoàn thể tại 15 tổ dân phố.",
  },
  sauThang: {
    title: "TRIỂN KHAI NHIỀU NHIỆM VỤ TRỌNG TÂM, HƯỚNG VỀ CƠ SỞ, CHĂM LO NHÂN DÂN",
    href: "https://hanoimoi.vn/phuong-yen-nghia-trien-khai-nhieu-nhiem-vu-trong-tam-huong-ve-co-so-cham-lo-nhan-dan-1212418.html",
    lead: "Hội nghị đánh giá kết quả công tác Mặt trận 6 tháng đầu năm và thống nhất nhiệm vụ trọng tâm thời gian tới.",
  },
  triAn: [
    {
      title: "MTTQ phường Yên Nghĩa lan toả nghĩa tình, tri ân người có công",
      note: "Tặng quà nhân kỷ niệm Ngày Thương binh — Liệt sĩ 27/7.",
      href: "https://hanoimoi.vn/mttq-phuong-yen-nghia-lan-toa-nghia-tinh-tri-an-nguoi-co-cong-1213537.html",
    },
    {
      title: "Hội Cựu chiến binh phường dâng hương tưởng niệm các anh hùng liệt sĩ",
      note: "Đoàn dâng hương tại nghĩa trang liệt sĩ của phường.",
      href: "https://hanoimoi.vn/hoi-cuu-chien-binh-phuong-yen-nghia-dang-huong-tuong-niem-cac-anh-hung-liet-si-1213358.html",
    },
    {
      title: "Hội Liên hiệp Phụ nữ phường viếng nghĩa trang liệt sĩ",
      note: "Hoạt động tri ân trong tháng 7/2026.",
      href: "https://www.facebook.com/share/p/1FRNSXhiPg/?mibextid=wwXIfr",
    },
    {
      title: "Đoàn Thanh niên tổ chức lễ thắp nến tri ân",
      note: "Tư liệu, hình ảnh sẽ cập nhật trong số tiếp theo.",
    },
  ],
  gpmb: [
    {
      title: "Tuyên truyền công tác giải phóng mặt bằng",
      note: "Vận động nhân dân đồng thuận, chấp hành chủ trương giải phóng mặt bằng trên địa bàn.",
      href: "https://www.facebook.com/share/p/14qF1b89ttH/",
    },
    {
      title: "MTTQ thăm hỏi, tặng quà tổ công tác tham gia tuyên truyền giải phóng mặt bằng",
      note: "Động viên các thành viên tổ công tác đang bám sát địa bàn.",
      href: "https://www.facebook.com/share/p/1EgRTBx2Ru/?mibextid=wwXIfr",
    },
  ],
  doanThe: [
    {
      title: "Yên Nghĩa đối thoại, lắng nghe tâm tư của người lao động",
      note: "Hội nghị “Lắng nghe công đoàn nói” do Công đoàn phường tổ chức.",
      href: "https://hanoimoi.vn/yen-nghia-doi-thoai-lang-nghe-tam-tu-cua-nguoi-lao-dong-1214595.html",
    },
    {
      title: "MTTQ phường tổ chức hội nghị làm việc với các hội quần chúng",
      note: "Tư liệu, hình ảnh sẽ cập nhật trong số tiếp theo.",
    },
  ],
};

/** một mẩu tin ngắn: tiêu đề + mô tả + dòng link */
const tinNgan = (t, i) => [
  text(`${i}. ${t.title}`, { size: 26, bold: true, color: NAVY, lh: 1.35, gap: 6 }),
  text(t.note, { size: 22, color: INK, lh: 1.5, gap: t.href ? 4 : 20 }),
  ...(t.href
    ? [
        text("Đọc bài đầy đủ →", {
          size: 20,
          font: SANS,
          color: RED,
          italic: true,
          href: t.href,
          gap: 22,
        }),
      ]
    : []),
];

/* ----------------------------------------------------------------- trang -- */

const pages = [
  /* 1 — bìa: theo đúng bản phác thảo (logo đỏ, tên đơn vị, 2 ảnh, tên bản tin) */
  {
    background: "#a20f1a",
    backgroundImage: BG_COVER,
    fixed: [
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
    ],
  },

  /* 2 — mục lục */
  {
    background: "#fffdf6",
    backgroundImage: BG_PAGE,
    flow: [
      text("TRONG SỐ NÀY", { size: 44, bold: true, color: RED, align: "center", lh: 1.2, gap: 8 }),
      text("Bản tin nội bộ của Uỷ ban MTTQ Việt Nam phường Yên Nghĩa", {
        size: 21, font: SANS, color: GOLD, italic: true, align: "center", gap: 34,
      }),
      text("03    Công bố quyết định thành lập Ban Công tác Mặt trận và các chi hội đoàn thể", {
        size: 25, color: NAVY, bold: true, lh: 1.4, gap: 16,
      }),
      text("04    Triển khai nhiệm vụ trọng tâm, hướng về cơ sở, chăm lo nhân dân", {
        size: 25, color: NAVY, bold: true, lh: 1.4, gap: 16,
      }),
      text("05    Tri ân người có công nhân kỷ niệm Ngày Thương binh — Liệt sĩ 27/7", {
        size: 25, color: NAVY, bold: true, lh: 1.4, gap: 16,
      }),
      text("06    Tuyên truyền, vận động giải phóng mặt bằng", {
        size: 25, color: NAVY, bold: true, lh: 1.4, gap: 16,
      }),
      text("07    Công đoàn và các hội quần chúng", {
        size: 25, color: NAVY, bold: true, lh: 1.4, gap: 16,
      }),
      text("08    Ghi nhận và khen thưởng", {
        size: 25, color: NAVY, bold: true, lh: 1.4, gap: 30,
      }),
      text(
        "Toàn bộ tin, bài trong số này đều có đường dẫn tới nguồn đăng tải chính thức. Bấm vào dòng “Đọc bài đầy đủ” ở mỗi tin để mở bài viết.",
        { size: 21, font: SANS, color: INK, italic: true, lh: 1.55 },
      ),
    ],
  },

  /* 3 — tin chính: hội nghị công bố quyết định */
  {
    background: "#fffdf6",
    backgroundImage: BG_PAGE,
    flow: [
      text("TIN NỔI BẬT", { size: 20, font: SANS, bold: true, color: GOLD, gap: 6 }),
      text(TIN.hoiNghi.title, { size: 34, bold: true, color: RED, lh: 1.25, gap: 14 }),
      image(TRAO_QD_1, 300, { border: 3 }),
      text(
        "Hội nghị công bố các quyết định thành lập Ban Công tác Mặt trận và các chi hội đoàn thể tại 15 tổ dân phố phường Yên Nghĩa.",
        { size: 19, font: SANS, color: "#6b7280", italic: true, lh: 1.4, gap: 20 },
      ),
      text(TIN.hoiNghi.lead, { size: 25, lh: 1.6, gap: 16 }),
      text(
        "Việc kiện toàn tổ chức là bước chuẩn bị để Mặt trận và các đoàn thể hoạt động ổn định theo mô hình chính quyền địa phương 2 cấp, bám sát địa bàn dân cư.",
        { size: 25, lh: 1.6 },
      ),
    ],
  },

  /* 4 — 6 tháng đầu năm */
  {
    background: "#fffdf6",
    backgroundImage: BG_PAGE,
    flow: [
      text("CÔNG TÁC MẶT TRẬN", { size: 20, font: SANS, bold: true, color: GOLD, gap: 6 }),
      text(TIN.sauThang.title, { size: 32, bold: true, color: RED, lh: 1.25, gap: 14 }),
      image(TRAO_QD_2, 290, { border: 3 }),
      text("Ảnh: hội nghị của Uỷ ban MTTQ Việt Nam phường Yên Nghĩa.", {
        size: 19, font: SANS, color: "#6b7280", italic: true, lh: 1.4, gap: 20,
      }),
      text(TIN.sauThang.lead, { size: 25, lh: 1.6, gap: 12 }),
      text("Đọc bài đầy đủ trên Báo Hànộimới →", {
        size: 22, font: SANS, color: RED, bold: true, href: TIN.sauThang.href, gap: 10,
      }),
    ],
  },

  /* 5 — tri ân 27/7 */
  {
    background: "#fffdf6",
    backgroundImage: BG_PAGE,
    flow: [
      text("TRI ÂN NGƯỜI CÓ CÔNG", { size: 20, font: SANS, bold: true, color: GOLD, gap: 6 }),
      text("KỶ NIỆM NGÀY THƯƠNG BINH — LIỆT SĨ 27/7", {
        size: 32, bold: true, color: RED, lh: 1.25, gap: 24,
      }),
      ...TIN.triAn.flatMap((t, i) => tinNgan(t, i + 1)),
    ],
  },

  /* 6 — giải phóng mặt bằng */
  {
    background: "#fffdf6",
    backgroundImage: BG_PAGE,
    flow: [
      text("VẬN ĐỘNG NHÂN DÂN", { size: 20, font: SANS, bold: true, color: GOLD, gap: 6 }),
      text("TUYÊN TRUYỀN, VẬN ĐỘNG GIẢI PHÓNG MẶT BẰNG", {
        size: 32, bold: true, color: RED, lh: 1.25, gap: 24,
      }),
      ...TIN.gpmb.flatMap((t, i) => tinNgan(t, i + 1)),
      image(TRAO_QD_2, 250, { border: 3, gap: 10 }),
      text("Ảnh tư liệu hoạt động của Mặt trận phường.", {
        size: 19, font: SANS, color: "#6b7280", italic: true, lh: 1.4,
      }),
    ],
  },

  /* 7 — công đoàn, hội quần chúng */
  {
    background: "#fffdf6",
    backgroundImage: BG_PAGE,
    flow: [
      text("ĐOÀN THỂ — HỘI QUẦN CHÚNG", { size: 20, font: SANS, bold: true, color: GOLD, gap: 6 }),
      text("LẮNG NGHE, ĐỐI THOẠI VÀ PHỐI HỢP HOẠT ĐỘNG", {
        size: 32, bold: true, color: RED, lh: 1.25, gap: 24,
      }),
      ...TIN.doanThe.flatMap((t, i) => tinNgan(t, i + 1)),
      image(TRAO_QD_1, 260, { border: 3, gap: 10 }),
      text("Ảnh: các đoàn thể phường Yên Nghĩa.", {
        size: 19, font: SANS, color: "#6b7280", italic: true, lh: 1.4,
      }),
    ],
  },

  /* 8 — khen thưởng */
  {
    background: "#fffdf6",
    backgroundImage: BG_PAGE,
    flow: [
      text("GHI NHẬN", { size: 20, font: SANS, bold: true, color: GOLD, gap: 6 }),
      text("GIẤY KHEN CỦA BAN CHẤP HÀNH ĐẢNG BỘ PHƯỜNG", {
        size: 32, bold: true, color: RED, lh: 1.25, gap: 18,
      }),
      image(GIAY_KHEN, 480, { border: 4, borderColor: "#e6d9a8" }),
      text(
        "Ban Chấp hành Đảng bộ phường Yên Nghĩa tặng Giấy khen cho Cơ quan Uỷ ban MTTQ phường vì đã có thành tích xuất sắc trong 1 năm thực hiện chính quyền địa phương 2 cấp.",
        { size: 24, lh: 1.6, gap: 10 },
      ),
      text("Số 212 — QĐ/ĐU, ngày 22 tháng 7 năm 2026.", {
        size: 21, font: SANS, color: GOLD, italic: true, lh: 1.4,
      }),
    ],
  },

  /* 9 — bìa sau */
  {
    background: "#0b3f8f",
    backgroundImage: BG_BACK,
    fixed: [
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
    ],
  },
];

/* ------------------------------------------------- đo chiều cao chữ thật -- */

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
const page = await browser.newPage();
await page.setContent("<body style='margin:0'></body>");

async function measure(block) {
  if (block.kind === "image") return block.h;
  return page.evaluate((b) => {
    const d = document.createElement("div");
    Object.assign(d.style, {
      position: "absolute",
      left: "-9999px",
      width: b.w + "px",
      fontSize: b.fontSize + "px",
      fontFamily: b.fontFamily,
      fontWeight: b.bold ? "700" : "400",
      fontStyle: b.italic ? "italic" : "normal",
      lineHeight: String(b.lineHeight),
      textAlign: b.align,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    });
    d.textContent = b.content;
    document.body.appendChild(d);
    const h = d.offsetHeight;
    d.remove();
    return h;
  }, block);
}

const out = [];
for (const [i, p] of pages.entries()) {
  const els = [];

  const boxes = [];
  for (const b of p.fixed ?? []) {
    const h = await measure(b);
    const x = b.x ?? M;
    const y = b.y ?? 0;
    els.push(toElement(b, x, y));
    boxes.push({ id: b.content?.slice(0, 18) ?? b.src, x, y, w: b.w, h });
  }

  // khối đặt tuyệt đối dễ đè nhau khi chữ xuống dòng ngoài dự tính
  for (let a = 0; a < boxes.length; a++) {
    for (let c = a + 1; c < boxes.length; c++) {
      const A = boxes[a];
      const B = boxes[c];
      const dungNhau = A.y + A.h > B.y + 2 && B.y + B.h > A.y + 2;
      const trungCot = A.x + A.w > B.x + 2 && B.x + B.w > A.x + 2;
      if (dungNhau && trungCot) {
        console.warn(`  ! trang ${i + 1}: "${A.id}" đè lên "${B.id}"`);
      }
    }
  }

  let y = TOP;
  for (const b of p.flow ?? []) {
    const h = await measure(b);
    els.push(toElement(b, b.x ?? M, y));
    y += h + b.gap;
  }

  const overflow = Math.round(y - b0(p) - BOTTOM);
  if ((p.flow ?? []).length && y - (p.flow.at(-1)?.gap ?? 0) > BOTTOM) {
    console.warn(
      `  ! trang ${i + 1} tràn ${Math.round(y - (p.flow.at(-1)?.gap ?? 0) - BOTTOM)}px — cần bớt nội dung`,
    );
  } else {
    console.log(`  · trang ${i + 1}: ${els.length} khối, kết thúc ở y=${Math.round(y)}`);
  }

  out.push({ background: p.background, backgroundImage: p.backgroundImage, elements: els });
}
function b0() {
  return 0;
}

function toElement(b, x, y) {
  if (b.kind === "image") {
    return {
      id: uid("i"),
      type: "image",
      x: Math.round(x),
      y: Math.round(y),
      w: Math.round(b.w),
      h: Math.round(b.h),
      rotation: 0,
      src: b.src,
      radius: b.radius,
      opacity: 1,
      fit: b.fit,
      borderWidth: b.borderWidth,
      borderColor: b.borderColor,
    };
  }
  const el = {
    id: uid("t"),
    type: "text",
    x: Math.round(x),
    y: Math.round(y),
    w: Math.round(b.w),
    rotation: 0,
    content: b.content,
    fontSize: b.fontSize,
    fontFamily: b.fontFamily,
    color: b.color,
    bold: b.bold,
    italic: b.italic,
    align: b.align,
    lineHeight: b.lineHeight,
  };
  if (b.href) el.href = b.href;
  return el;
}

await browser.close();

/* ------------------------------------------------------------- xuất SQL -- */

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const chrome = {
  margin: 48,
  skipFirstPage: true,
  skipLastPage: true,
  header: {
    enabled: true,
    text: "BẢN TIN MẶT TRẬN · PHƯỜNG YÊN NGHĨA",
    align: "left",
    fontSize: 18,
    color: RED,
    rule: true,
    ruleColor: GOLD,
    ruleWidth: 2,
    pageNumber: false,
  },
  footer: {
    enabled: true,
    text: "Số 01 · Tháng 7/2026",
    align: "left",
    fontSize: 18,
    color: NAVY,
    rule: true,
    ruleColor: GOLD,
    ruleWidth: 2,
    pageNumber: true,
    pageNumberAlign: "right",
  },
};

const sql = `-- ============================================================================
-- Bản tin Mặt trận phường Yên Nghĩa — số 01 (tháng 7/2026)
-- SINH TỰ ĐỘNG bởi scripts/make-bulletin.mjs — sửa nội dung trong script rồi chạy lại,
-- hoặc chỉnh trực tiếp trong /admin/books.
-- Nguồn: file Word "Link phục vụ là bản tin 2026" + ảnh giấy khen, ảnh hội nghị.
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
  .map(
    (p, i) =>
      `  (${i}, ${q(p.background)}, ${q(p.backgroundImage)}, ${q(JSON.stringify(p.elements))})`,
  )
  .join(",\n")}
) as p(ord, bg, bgimg, els);
`;

await writeFile(join(ROOT, "supabase", "demo-book-tin.sql"), sql);
console.log(`→ supabase/demo-book-tin.sql (${out.length} trang)`);
