/**
 * Nén ảnh đã cào về WebP (tối đa 1600px, q78) và cập nhật lib/canva-assets.json.
 *
 *   node scripts/optimize-images.mjs
 */
import { readFile, readdir, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "public", "canva");
const MANIFEST = join(ROOT, "lib", "canva-assets.json");
const MAX_WIDTH = 1600;

const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
const byFile = new Map(manifest.assets.map((a) => [a.path.split("/").pop(), a]));

let before = 0;
let after = 0;
let converted = 0;

for (const name of await readdir(DIR)) {
  if (extname(name).toLowerCase() === ".webp") continue;

  const src = join(DIR, name);
  before += (await stat(src)).size;

  const out = name.replace(/\.[^.]+$/, ".webp");
  const dest = join(DIR, out);

  const img = sharp(src);
  const meta = await img.metadata();
  await img
    .resize({ width: Math.min(meta.width ?? MAX_WIDTH, MAX_WIDTH), withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(dest);

  after += (await stat(dest)).size;
  await unlink(src);
  converted++;

  const asset = byFile.get(name);
  if (asset) {
    const outMeta = await sharp(dest).metadata();
    asset.path = `/canva/${out}`;
    asset.width = outMeta.width ?? asset.width;
    asset.height = outMeta.height ?? asset.height;
  }
}

await writeFile(MANIFEST, JSON.stringify(manifest, null, 2));

const mb = (n) => (n / 1024 / 1024).toFixed(1) + " MB";
console.log(`· nén ${converted} ảnh: ${mb(before)} → ${mb(after)}`);
