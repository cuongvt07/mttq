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
const H = 1067;

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
    <rect width="${W}" height="${H}" fill="#fffdf6"/>
    ${dots("#c1121f", 0.035)}
    <rect x="0" y="0" width="${W}" height="14" fill="#c1121f"/>
    <rect x="0" y="14" width="${W}" height="4" fill="#f0c14b"/>
    <rect x="0" y="${H - 12}" width="${W}" height="12" fill="#0b3f8f"/>
    <rect x="30" y="34" width="${W - 60}" height="${H - 62}" fill="none" stroke="#e6d9a8" stroke-width="1.5"/>
    <rect x="30" y="34" width="6" height="${H - 62}" fill="#f0c14b" opacity="0.35"/>
  `),
).toBuffer();

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
  .composite([{ input: dauChim, top: Math.round((H - 430) / 2), left: Math.round((W - 430) / 2) }])
  .webp({ quality: 88 })
  .toFile(join(OUT, "bg-trang.webp"));

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
