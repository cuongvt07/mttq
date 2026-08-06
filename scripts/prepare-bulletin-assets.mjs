/**
 * Chuẩn bị ảnh cho Bản tin Mặt trận số 01:
 * - xoay lại giấy khen (ảnh chụp bị nằm ngang), nén WebP
 * - nén 2 ảnh hội nghị trao quyết định
 * - dựng 3 ảnh nền (bìa, ruột, bìa sau) kiểu ấn phẩm in
 *
 *   node scripts/prepare-bulletin-assets.mjs
 */
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "tin");
await mkdir(OUT, { recursive: true });

const W = 800;
const H = 1131;   // khổ A4 quy về bề rộng 800

/* --------------------------------------------------------------- ảnh chụp -- */

// Giấy khen: ảnh gốc nằm ngang (chữ đọc từ dưới lên) → xoay 90° theo chiều kim đồng hồ
await sharp(join(ROOT, "1WUpukh8CqsqQ4b9v8jBeIt14NIRIGyehEYq3vDdTEXpj4bJSY87Q8axEk33CWuA3yV.jpg"))
  .rotate(90)
  .resize({ width: 1600, withoutEnlargement: true })
  .webp({ quality: 82 })
  .toFile(join(OUT, "giay-khen.webp"));

for (const [src, name] of [
  ["14.jpg", "trao-quyet-dinh-1.webp"],
  ["4.jpg", "trao-quyet-dinh-2.webp"],
]) {
  await sharp(join(ROOT, src))
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(join(OUT, name));
}

/* ---------------------------------------------------------------- ảnh nền -- */

const svg = (body) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`,
  );

/** hoa văn chấm mờ dùng làm nền chìm */
const dots = (color, opacity) => `
  <defs>
    <pattern id="d" width="26" height="26" patternUnits="userSpaceOnUse">
      <circle cx="4" cy="4" r="1.6" fill="${color}" opacity="${opacity}"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#d)"/>`;

/**
 * Dây hoa sen chạy ngang mép dưới trang: thân mềm uốn lượn, vài bông sen và lá,
 * để rất nhạt cho nhẹ nhàng, không át chữ.
 */
const senDay = (yBase, mau = "#e8a3b6", mo = 0.5) => {
  /**
   * Bông sen nhìn ngang: các cánh toả lên từ một điểm đài, cánh giữa dựng đứng,
   * cánh ngoài ngả dần sang hai bên — không phải rosette tròn kiểu hoa cúc.
   */
  const bong = (cx, cy, r) => {
    const canh = (goc, dai, rong) => {
      const rad = (goc * Math.PI) / 180;
      const ex = cx + Math.sin(rad) * dai;
      const ey = cy - Math.cos(rad) * dai;
      const nx = Math.cos(rad) * rong;
      const ny = Math.sin(rad) * rong;
      return `<path d="M${cx.toFixed(1)} ${cy.toFixed(1)}
        C${(cx + nx).toFixed(1)} ${(cy + ny - dai * 0.5).toFixed(1)} ${(ex + nx * 0.7).toFixed(1)} ${(ey + ny * 0.7).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}
        C${(ex - nx * 0.7).toFixed(1)} ${(ey - ny * 0.7).toFixed(1)} ${(cx - nx).toFixed(1)} ${(cy - ny - dai * 0.5).toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)} z"
        fill="none" stroke="${mau}" stroke-width="1.4"/>`;
    };
    return `
    <g>
      ${canh(-62, r * 0.82, r * 0.3)}${canh(62, r * 0.82, r * 0.3)}
      ${canh(-36, r * 0.95, r * 0.28)}${canh(36, r * 0.95, r * 0.28)}
      ${canh(-14, r, r * 0.26)}${canh(14, r, r * 0.26)}
      ${canh(0, r * 0.72, r * 0.2)}
    </g>`;
  };

  return `
  <g opacity="${mo}">
    <path d="M-10 ${yBase} C 120 ${yBase - 34}, 250 ${yBase + 26}, 400 ${yBase - 6}
             S 660 ${yBase - 40}, ${W + 10} ${yBase - 4}"
          fill="none" stroke="${mau}" stroke-width="1.8"/>
    <path d="M-10 ${yBase + 14} C 150 ${yBase - 12}, 300 ${yBase + 40}, 470 ${yBase + 10}
             S 690 ${yBase - 16}, ${W + 10} ${yBase + 16}"
          fill="none" stroke="${mau}" stroke-width="1.1" opacity="0.7"/>
    ${bong(126, yBase - 9, 22)}
    ${bong(400, yBase - 6, 27)}
    ${bong(672, yBase - 27, 22)}
  </g>`;
};

/** cánh sen cách điệu — hoạ tiết chìm giữa trang bìa */
const lotus = (cx, cy, r, color, opacity) => `
  <g opacity="${opacity}" fill="none" stroke="${color}" stroke-width="2">
    <circle cx="${cx}" cy="${cy}" r="${r}"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.74}"/>
    ${Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI) / 6;
      return `<ellipse cx="${cx + Math.cos(a) * r * 0.45}" cy="${cy + Math.sin(a) * r * 0.45}"
        rx="${r * 0.34}" ry="${r * 0.14}" transform="rotate(${(i * 30).toFixed(0)} ${cx + Math.cos(a) * r * 0.45} ${cy + Math.sin(a) * r * 0.45})"/>`;
    }).join("")}
  </g>`;

// --- bìa: đỏ cờ, khung vàng kim, hoạ tiết sen chìm
await sharp(
  svg(`
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#c1121f"/>
        <stop offset="0.55" stop-color="#a20f1a"/>
        <stop offset="1" stop-color="#6f0a12"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    ${dots("#ffffff", 0.05)}
    ${lotus(W / 2, 560, 250, "#ffd76a", 0.16)}
    <rect x="26" y="26" width="${W - 52}" height="${H - 52}" fill="none" stroke="#f0c14b" stroke-width="3"/>
    <rect x="36" y="36" width="${W - 72}" height="${H - 72}" fill="none" stroke="#f0c14b" stroke-width="1" opacity="0.7"/>
    <rect x="0" y="0" width="${W}" height="10" fill="#f0c14b"/>
    <rect x="0" y="${H - 10}" width="${W}" height="10" fill="#f0c14b"/>
  `),
)
  .webp({ quality: 88 })
  .toFile(join(OUT, "bg-bia.webp"));

// --- trang ruột: nền ngà, băng đỏ đầu trang, khung vàng mảnh, con dấu chìm
const nenTrang = await sharp(
  svg(`
    <rect width="${W}" height="${H}" fill="#ffffff"/>
    <rect x="0" y="0" width="${W}" height="14" fill="#c1121f"/>
    <rect x="0" y="14" width="${W}" height="4" fill="#f0c14b"/>
    <rect x="0" y="${H - 12}" width="${W}" height="12" fill="#0b3f8f"/>
    <rect x="30" y="34" width="${W - 60}" height="${H - 62}" fill="none" stroke="#e6d9a8" stroke-width="1.5"/>
    <rect x="30" y="34" width="6" height="${H - 62}" fill="#f0c14b" opacity="0.35"/>
  `),
).toBuffer();

/**
 * Dải hoa sen trang trí chân trang: đặt vừa trong hai đường kẻ dọc hai bên,
 * đáy chạm đường kẻ ngang dưới cùng của khung.
 */
const CHAN_W = W - 60;
const chanSen = await sharp(join(ROOT, "assets", "chan-trang-hoa-sen.png"))
  .resize({ width: CHAN_W })
  .toBuffer({ resolveWithObject: true });
export const CHAN_H = chanSen.info.height;

/** con dấu Mặt trận khử màu, mờ 3% làm hoạ tiết chìm giữa trang */
const dauChim = await sharp(join(ROOT, "public", "brand", "emblem.webp"))
  .resize(430)
  .grayscale()
  .ensureAlpha()
  .composite([
    {
      input: Buffer.from([255, 255, 255, Math.round(255 * 0.03)]),
      raw: { width: 1, height: 1, channels: 4 },
      tile: true,
      blend: "dest-in",
    },
  ])
  .toBuffer();

await sharp(nenTrang)
  .composite([
    { input: dauChim, top: Math.round((H - 430) / 2), left: Math.round((W - 430) / 2) },
    { input: chanSen.data, top: H - 28 - CHAN_H, left: 30 },
  ])
  .webp({ quality: 88 })
  .toFile(join(OUT, "bg-trang.webp"));

console.log(`· dải hoa sen chân trang: ${CHAN_W}×${CHAN_H}, đỉnh ở y=${H - 28 - CHAN_H}`);

// --- bìa sau: xanh cờ đậm
await sharp(
  svg(`
    <defs>
      <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#123c7a"/>
        <stop offset="1" stop-color="#08234a"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g2)"/>
    ${dots("#ffffff", 0.05)}
    ${lotus(W / 2, H / 2, 230, "#f0c14b", 0.14)}
    ${senDay(H - 96, "#f2b9c8", 0.5)}
    <rect x="26" y="26" width="${W - 52}" height="${H - 52}" fill="none" stroke="#f0c14b" stroke-width="2"/>
  `),
)
  .webp({ quality: 88 })
  .toFile(join(OUT, "bg-bia-sau.webp"));

console.log("· ảnh trong public/tin:");
for (const f of [
  "giay-khen.webp",
  "trao-quyet-dinh-1.webp",
  "trao-quyet-dinh-2.webp",
  "bg-bia.webp",
  "bg-trang.webp",
  "bg-bia-sau.webp",
]) {
  const m = await sharp(join(OUT, f)).metadata();
  console.log(`  ${f.padEnd(24)} ${m.width}x${m.height}`);
}
