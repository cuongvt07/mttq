/**
 * Sinh bộ nền trang mẫu cho trình thiết kế sách (public/tin/mau/*.webp).
 * Người dùng chỉ việc bấm chọn mẫu, không phải tự chỉnh màu/đường dẫn.
 *
 *   node scripts/make-page-templates.mjs
 */
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "tin", "mau");
await mkdir(OUT, { recursive: true });

const W = 800;
const H = 1067;

const svg = (body) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`,
  );

const cham = (color, opacity) => `
  <defs>
    <pattern id="d" width="26" height="26" patternUnits="userSpaceOnUse">
      <circle cx="4" cy="4" r="1.6" fill="${color}" opacity="${opacity}"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#d)"/>`;

/** con dấu Mặt trận khử màu, rất mờ — hoạ tiết chìm giữa trang */
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

const MAU = [
  {
    file: "trang-tron.webp",
    body: `<rect width="${W}" height="${H}" fill="#ffffff"/>`,
  },
  {
    file: "nga-vien-vang.webp",
    body: `
      <rect width="${W}" height="${H}" fill="#fffdf6"/>
      ${cham("#c1121f", 0.03)}
      <rect x="28" y="28" width="${W - 56}" height="${H - 56}" fill="none" stroke="#e0c060" stroke-width="2"/>`,
  },
  {
    file: "bang-do.webp",
    body: `
      <rect width="${W}" height="${H}" fill="#fffdf6"/>
      ${cham("#c1121f", 0.03)}
      <rect x="0" y="0" width="${W}" height="16" fill="#c1121f"/>
      <rect x="0" y="16" width="${W}" height="4" fill="#f0c14b"/>
      <rect x="0" y="${H - 12}" width="${W}" height="12" fill="#0b3f8f"/>`,
    dau: true,
  },
  {
    file: "xanh-nhat.webp",
    body: `
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#eaf3fb"/><stop offset="1" stop-color="#ffffff"/>
      </linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#g)"/>
      <rect x="0" y="0" width="${W}" height="14" fill="#0b3f8f"/>
      <rect x="28" y="34" width="${W - 56}" height="${H - 62}" fill="none" stroke="#c9dcf0" stroke-width="2"/>`,
  },
  {
    file: "bia-do.webp",
    body: `
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#c1121f"/><stop offset="0.55" stop-color="#a20f1a"/>
        <stop offset="1" stop-color="#6f0a12"/>
      </linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#g)"/>
      ${cham("#ffffff", 0.05)}
      <rect x="26" y="26" width="${W - 52}" height="${H - 52}" fill="none" stroke="#f0c14b" stroke-width="3"/>
      <rect x="36" y="36" width="${W - 72}" height="${H - 72}" fill="none" stroke="#f0c14b" stroke-width="1" opacity="0.7"/>
      <rect x="0" y="0" width="${W}" height="10" fill="#f0c14b"/>
      <rect x="0" y="${H - 10}" width="${W}" height="10" fill="#f0c14b"/>`,
  },
  {
    file: "bia-xanh.webp",
    body: `
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#123c7a"/><stop offset="1" stop-color="#08234a"/>
      </linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#g)"/>
      ${cham("#ffffff", 0.05)}
      <rect x="26" y="26" width="${W - 52}" height="${H - 52}" fill="none" stroke="#f0c14b" stroke-width="2"/>`,
  },
  {
    file: "vang-nhat.webp",
    body: `
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff7e0"/><stop offset="1" stop-color="#fffdf6"/>
      </linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#g)"/>
      <rect x="0" y="0" width="12" height="${H}" fill="#f0c14b"/>
      <rect x="40" y="34" width="${W - 80}" height="${H - 68}" fill="none" stroke="#ecd9a0" stroke-width="1.5"/>`,
  },
];

for (const m of MAU) {
  let img = sharp(svg(m.body));
  if (m.dau) {
    img = sharp(await img.toBuffer()).composite([
      { input: dauChim, top: Math.round((H - 430) / 2), left: Math.round((W - 430) / 2) },
    ]);
  }
  await img.webp({ quality: 88 }).toFile(join(OUT, m.file));
  console.log("·", m.file);
}

console.log(`→ ${MAU.length} mẫu nền trong public/tin/mau`);
