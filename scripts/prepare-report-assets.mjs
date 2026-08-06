/**
 * Chuẩn bị ảnh cho cuốn "Báo cáo kết quả công tác Mặt trận 6 tháng đầu năm 2026":
 * - tách 3 bản quét khen thưởng trong tệp CamScanner, xoay lại cho đúng chiều
 * - dựng ảnh nền bìa (giấy xanh nhạt, khung kép, giống bản in phường đang dùng)
 * - ghi lại kích thước thật của từng ảnh để khung luôn ôm trọn ảnh, không cắt
 *
 *   node scripts/prepare-report-assets.mjs
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "tin", "khen");
await mkdir(OUT, { recursive: true });

const W = 800;
const H = 1131; // A4 quy về bề rộng 800

/* ------------------------------------------------- bản quét khen thưởng -- */

/** Ảnh JPEG nhúng trong PDF nằm nguyên vẹn giữa hai dấu SOI…EOI. */
function anhTrongPdf(buf) {
  const ra = [];
  let i = 0;
  while ((i = buf.indexOf(Buffer.from([0xff, 0xd8, 0xff]), i)) >= 0) {
    const e = buf.indexOf(Buffer.from([0xff, 0xd9]), i);
    if (e < 0) break;
    const anh = buf.subarray(i, e + 2);
    if (anh.length > 50_000) ra.push(anh);
    i = e + 2;
  }
  return ra;
}

// Bản quét để ngang (chữ đọc từ dưới lên) → xoay 90° theo chiều kim đồng hồ.
const TEN = [
  { file: "gk-cong-doan.webp", caption: "Giấy khen của Chủ tịch UBND phường tặng Công đoàn phường Yên Nghĩa." },
  { file: "gk-nhap-ngu.webp", caption: "Giấy khen của Chủ tịch UBND phường tặng Uỷ ban MTTQ Việt Nam phường về công tác tuyển quân năm 2026." },
  { file: "bang-khen-bau-cu.webp", caption: "Bằng khen của Chủ tịch UBND thành phố Hà Nội tặng Uỷ ban MTTQ Việt Nam phường Yên Nghĩa về công tác bầu cử." },
];

const quet = anhTrongPdf(await readFile(join(ROOT, "..", "CamScanner 6-8-26 15.36.pdf")));
if (quet.length < TEN.length) throw new Error(`chỉ tách được ${quet.length} bản quét`);

const anhKhen = [];
for (const [i, meta] of TEN.entries()) {
  const r = await sharp(quet[i])
    .rotate(90)
    .resize({ width: 1500, withoutEnlargement: true })
    .webp({ quality: 84 })
    .toFile(join(OUT, meta.file));
  anhKhen.push({ path: `/tin/khen/${meta.file}`, caption: meta.caption, w: r.width, h: r.height });
}

/* ------------------------------------------------------- ảnh nền trang -- */

const svg = (body) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`,
  );

// Bìa: giấy xanh nhạt, khung kép xanh lá — theo đúng bản báo cáo phường đang in.
await sharp(
  svg(`
    <rect width="${W}" height="${H}" fill="#e9f3cf"/>
    <rect x="46" y="46" width="${W - 92}" height="${H - 92}" fill="none" stroke="#2f7d32" stroke-width="2.5"/>
    <rect x="54" y="54" width="${W - 108}" height="${H - 108}" fill="none" stroke="#2f7d32" stroke-width="1"/>
  `),
)
  .webp({ quality: 90 })
  .toFile(join(ROOT, "public", "tin", "bg-bc-bia.webp"));

/* ---------------------------------------- kích thước ảnh dùng lại sẵn có -- */

const doAnh = async (p) => {
  const m = await sharp(join(ROOT, "public", p)).metadata();
  return { path: p, w: m.width, h: m.height };
};

await writeFile(
  join(ROOT, "lib", "report-assets.json"),
  JSON.stringify(
    {
      khen: anhKhen,
      giayKhenCu: {
        ...(await doAnh("/tin/giay-khen.webp")),
        caption: "Giấy khen của Ban Chấp hành Đảng bộ phường tặng Cơ quan Uỷ ban MTTQ phường.",
      },
      hoiNghi: {
        ...(await doAnh("/tin/trao-quyet-dinh-2.webp")),
        caption: "Hội nghị công bố quyết định thành lập 15 Ban Công tác Mặt trận ở 15 tổ dân phố.",
      },
      traoQuyetDinh: {
        ...(await doAnh("/tin/trao-quyet-dinh-1.webp")),
        caption: "Trao quyết định thành lập Ban Công tác Mặt trận các tổ dân phố.",
      },
    },
    null,
    2,
  ),
);

console.log("· ảnh khen thưởng:");
for (const a of anhKhen) console.log(`  ${a.path.padEnd(34)} ${a.w}x${a.h}`);
console.log("· nền bìa: public/tin/bg-bc-bia.webp");
console.log("→ lib/report-assets.json");
