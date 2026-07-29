/**
 * Cào toàn bộ ảnh (nền, icon, ảnh hoạt động) + danh sách cụm/đơn vị
 * từ trang Canva gốc https://mttqvn.my.canva.site/
 *
 *   node scripts/scrape-canva.mjs
 *
 * Kết quả:
 *   public/canva/<hash>.<ext>        — ảnh đã tải
 *   lib/canva-assets.json            — manifest (id, kích thước, đường dẫn)
 *   supabase/seed-canva.sql          — 11 cụm + 126 phường/xã đúng tên
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = "https://mttqvn.my.canva.site/";
const OUT_DIR = join(ROOT, "public", "canva");
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";

/* ------------------------------------------------------------------ tải HTML -- */

const cacheFile = join(ROOT, "scripts", ".canva-cache.html");
let html;
if (existsSync(cacheFile) && !process.argv.includes("--fresh")) {
  html = await readFile(cacheFile, "utf8");
  console.log("· dùng bản HTML đã cache (thêm --fresh để tải lại)");
} else {
  console.log("· tải", SRC);
  const res = await fetch(SRC, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Tải trang thất bại: ${res.status}`);
  html = await res.text();
  await writeFile(cacheFile, html);
}

/* ------------------------------------------------------- manifest ảnh trong doc -- */

const manifest = new Map(); // id -> { id, type, files: [{url,w,h}] }
const reMedia =
  /"type":"(RASTER|SVG|VECTOR)","id":"([A-Za-z0-9_-]+)","version":\d+,"files":\[\{"url":"(_assets\/media\/[^"]+)","urlDenied":\w+,"width":(\d+),"height":(\d+)/g;
for (const m of html.matchAll(reMedia)) {
  const [, type, id, url, w, h] = m;
  const e = manifest.get(id) ?? { id, type, files: [] };
  e.files.push({ url, w: +w, h: +h });
  manifest.set(id, e);
}

/** Chọn bản đủ nét nhưng không quá nặng: nhỏ nhất trong các bản rộng >= 1200px. */
function pickFile(entry) {
  const sorted = entry.files.slice().sort((a, b) => a.w - b.w);
  return sorted.find((f) => f.w >= 1200) ?? sorted.at(-1);
}

/* ------------------------------------------------ chuỗi token theo thứ tự tài liệu -- */

function unesc(s) {
  try {
    return JSON.parse(`"${s.replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => "\\u00" + h)}"`);
  } catch {
    return s;
  }
}

const reToken =
  /\{"A\?":"d","A":"([A-Za-z0-9_-]+)","B":\d+\}|\{"A\?":"A","A":"((?:[^"\\]|\\.)*)"\}/g;
const tokens = [];
for (const m of html.matchAll(reToken)) {
  if (m[1]) tokens.push({ t: "media", v: m[1] });
  else {
    const v = unesc(m[2]).replace(/\\+n/g, " ").replace(/\s+/g, " ").trim();
    if (v) tokens.push({ t: "text", v });
  }
}

/* --------------------------------------------------------- cụm + đơn vị theo trang -- */

const isHeading = (t) => t.t === "text" && /^các đơn vị cụm\s*\d+$/i.test(t.v);
const headings = tokens.map((t, i) => (isHeading(t) ? i : -1)).filter((i) => i >= 0);

const clusters = headings.map((start, k) => {
  const prev = k === 0 ? 0 : headings[k - 1];
  const end = k + 1 < headings.length ? headings[k + 1] : tokens.length;
  return {
    index: k + 1,
    name: `Các đơn vị Cụm ${k + 1}`,
    slug: `cum-${k + 1}`,
    units: tokens
      .slice(start + 1, end)
      .filter((t) => t.t === "text" && /^(Phường|Xã)\s/u.test(t.v))
      .map((t) => t.v),
    mediaIds: [...new Set(tokens.slice(prev, start).filter((t) => t.t === "media").map((t) => t.v))],
  };
});

/* ------------------------------------------------------------------- tải ảnh về -- */

await mkdir(OUT_DIR, { recursive: true });

const assets = [];
let downloaded = 0;
let skipped = 0;

for (const entry of manifest.values()) {
  const file = pickFile(entry);
  if (!file) continue;
  const fileName = file.url.split("/").pop();
  const dest = join(OUT_DIR, fileName);
  const webp = fileName.replace(/\.[^.]+$/, ".webp");

  // Đã nén sang .webp ở lần chạy trước thì dùng lại, không tải lại bản gốc.
  if (existsSync(join(OUT_DIR, webp))) {
    skipped++;
    assets.push({
      id: entry.id,
      path: `/canva/${webp}`,
      width: file.w,
      height: file.h,
      uses: tokens.filter((t) => t.t === "media" && t.v === entry.id).length,
    });
    continue;
  }

  if (!existsSync(dest)) {
    const res = await fetch(new URL(file.url, SRC), { headers: { "User-Agent": UA } });
    if (!res.ok) {
      console.warn(`  ! bỏ qua ${fileName} (${res.status})`);
      continue;
    }
    await writeFile(dest, Buffer.from(await res.arrayBuffer()));
    downloaded++;
  } else {
    skipped++;
  }

  assets.push({
    id: entry.id,
    path: `/canva/${fileName}`,
    width: file.w,
    height: file.h,
    /** số lần xuất hiện trong tài liệu — ảnh dùng lại nhiều thường là nền/icon */
    uses: tokens.filter((t) => t.t === "media" && t.v === entry.id).length,
  });
}

console.log(`· ảnh: ${downloaded} tải mới, ${skipped} đã có, tổng ${assets.length}`);

/* ------------------------------------------- phân loại nền / icon / ảnh hoạt động -- */

const byId = new Map(assets.map((a) => [a.id, a]));
const is16by9 = (a) => Math.abs(a.width / a.height - 16 / 9) < 0.12;

/** Ảnh nền của mỗi trang cụm: ảnh 16:9 đầu tiên trong khối media của trang đó. */
const backgrounds = clusters.map((c) => {
  const bg = c.mediaIds.map((id) => byId.get(id)).find((a) => a && is16by9(a));
  return { slug: c.slug, name: c.name, background: bg?.path ?? null };
});

/** Icon dùng lại nhiều nhất và có tỉ lệ vuông = con dấu Mặt trận Tổ quốc. */
const emblem =
  assets.find((a) => Math.abs(a.width - a.height) < 40 && a.uses > 5)?.path ?? null;

/** Ảnh trang bìa (banner lớn nhất trong khối media đầu tiên). */
const coverMedia = tokens
  .slice(0, tokens.findIndex((t) => t.t === "text"))
  .filter((t) => t.t === "media")
  .map((t) => byId.get(t.v))
  .filter(Boolean);

await writeFile(
  join(ROOT, "lib", "canva-assets.json"),
  JSON.stringify(
    {
      source: SRC,
      emblem,
      hero: coverMedia.find((a) => a.width > 1000 && !is16by9(a))?.path ?? null,
      heroBackground: coverMedia.find((a) => is16by9(a))?.path ?? null,
      backgrounds,
      assets: assets.sort((a, b) => b.uses - a.uses || b.width - a.width),
      clusters: clusters.map((c) => ({ ...c, mediaIds: undefined })),
    },
    null,
    2,
  ),
);

console.log(
  `· tham khảo: ${clusters.length} cụm / ${clusters.reduce((n, c) => n + c.units.length, 0)} đơn vị (chỉ ghi vào manifest, KHÔNG đụng tới dữ liệu Supabase)`,
);
console.log("· đã ghi lib/canva-assets.json");
