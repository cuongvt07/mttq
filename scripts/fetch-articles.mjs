/**
 * Tải nội dung + ảnh các bài báo được liệt kê trong file Word về máy,
 * để dựng thẳng vào bản tin (không phải chỉ gắn link).
 *
 *   node scripts/fetch-articles.mjs
 *
 * Kết quả: public/tin/bao/*.webp  +  lib/bulletin-articles.json
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const IMG_DIR = join(ROOT, "public", "tin", "bao");
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";

/** Danh sách lấy nguyên từ file Word "Link phục vụ là bản tin 2026". */
const SOURCES = [
  { key: "sau-thang", muc: "Công tác Mặt trận", url: "https://hanoimoi.vn/phuong-yen-nghia-trien-khai-nhieu-nhiem-vu-trong-tam-huong-ve-co-so-cham-lo-nhan-dan-1212418.html" },
  { key: "tri-an", muc: "Tri ân người có công", url: "https://hanoimoi.vn/mttq-phuong-yen-nghia-lan-toa-nghia-tinh-tri-an-nguoi-co-cong-1213537.html" },
  { key: "ccb", muc: "Tri ân người có công", url: "https://hanoimoi.vn/hoi-cuu-chien-binh-phuong-yen-nghia-dang-huong-tuong-niem-cac-anh-hung-liet-si-1213358.html" },
  { key: "cong-doan", muc: "Đoàn thể", url: "https://hanoimoi.vn/yen-nghia-doi-thoai-lang-nghe-tam-tu-cua-nguoi-lao-dong-1214595.html" },
  { key: "gpmb-tuyen-truyen", muc: "Vận động nhân dân", url: "https://www.facebook.com/share/p/14qF1b89ttH/" },
  { key: "gpmb-tham-hoi", muc: "Vận động nhân dân", url: "https://www.facebook.com/share/p/1EgRTBx2Ru/?mibextid=wwXIfr" },
  { key: "phu-nu", muc: "Tri ân người có công", url: "https://www.facebook.com/share/p/1FRNSXhiPg/?mibextid=wwXIfr" },
];

const decode = (s = "") =>
  s
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/&#x([0-9a-f]+);/gi, (_, x) => String.fromCharCode(parseInt(x, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const strip = (html = "") => decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

await mkdir(IMG_DIR, { recursive: true });

const articles = [];

for (const src of SOURCES) {
  process.stdout.write(`· ${src.key} … `);

  let html = "";
  try {
    const res = await fetch(src.url, { headers: { "User-Agent": UA }, redirect: "follow" });
    html = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (e) {
    console.log(`không tải được (${e.message})`);
    articles.push({ ...src, ok: false, reason: e.message });
    continue;
  }

  // Facebook chặn máy khách không đăng nhập → không có nội dung để lấy
  if (/facebook\.com/.test(src.url)) {
    const og = html.match(/property="og:description"\s+content="([^"]*)"/)?.[1];
    console.log(og ? "chỉ lấy được mô tả ngắn" : "bị chặn (cần đăng nhập)");
    articles.push({ ...src, ok: false, reason: "Facebook chặn tải nội dung", sapo: og ? decode(og) : null });
    continue;
  }

  const title = strip(html.match(/<h1[^>]*class="[^"]*sc-longform-header-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? "");
  const sapo = strip(html.match(/<p[^>]*class="[^"]*sc-longform-header-sapo[^"]*"[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? "");
  const author = strip(html.match(/class="[^"]*sc-longform-header-author[^"]*"[^>]*>([\s\S]*?)</)?.[1] ?? "");
  const date = strip(html.match(/class="[^"]*sc-longform-header-date[^"]*"[^>]*>([\s\S]*?)</)?.[1] ?? "");

  // phần thân bài nằm giữa khối tiêu đề và khối chia sẻ
  const bodyStart = html.indexOf("sc-longform-header-media");
  const bodyEnd = html.indexOf("c-share-detail");
  const body = html.slice(bodyStart > 0 ? bodyStart : 0, bodyEnd > 0 ? bodyEnd : html.length);

  const paras = [...body.matchAll(/<p(?![^>]*class="[^"]*sc-longform)[^>]*>([\s\S]*?)<\/p>/g)]
    .map((m) => strip(m[1]))
    .filter((t) => t.length > 60 && !/^Ảnh:/i.test(t));

  const figures = [...body.matchAll(/<figure[^>]*>([\s\S]*?)<\/figure>/g)]
    .map((m) => ({
      src: m[1].match(/<img[^>]+src="([^"]+)"/)?.[1],
      caption: strip(m[1].match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/)?.[1] ?? ""),
    }))
    .filter((f) => f.src && !/\/thumbs\//.test(f.src));

  // tải tối đa 6 ảnh mỗi bài để có đủ ảnh minh hoạ cho từng đoạn
  const images = [];
  for (const [i, fig] of figures.slice(0, 6).entries()) {
    try {
      const res = await fetch(fig.src, { headers: { "User-Agent": UA, Referer: src.url } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const file = `${src.key}-${i + 1}.webp`;
      const meta = await sharp(buf)
        .resize({ width: 1400, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(join(IMG_DIR, file));
      images.push({ path: `/tin/bao/${file}`, caption: fig.caption, w: meta.width, h: meta.height });
    } catch (e) {
      console.log(`\n    ! ảnh ${i + 1} lỗi: ${e.message}`);
    }
  }

  articles.push({
    ...src,
    ok: true,
    title,
    sapo,
    author,
    date,
    paragraphs: paras,
    images,
    source: "Báo Hànộimới",
  });
  console.log(`${paras.length} đoạn, ${images.length} ảnh`);
}

await writeFile(join(ROOT, "lib", "bulletin-articles.json"), JSON.stringify(articles, null, 2));
console.log("\n→ lib/bulletin-articles.json");
for (const a of articles) {
  console.log(`  ${a.ok ? "✓" : "✗"} ${a.key.padEnd(18)} ${a.ok ? a.title.slice(0, 60) : a.reason}`);
}
