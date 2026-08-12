#!/usr/bin/env node
/**
 * Keep-alive pinger — giữ site Vercel + Supabase luôn "ấm".
 *
 * Vercel đóng băng serverless function sau ~10-15 phút vắng request; Supabase
 * free tier pause project sau 7 ngày không query. Script này gọi các URL đích
 * theo chu kỳ để cả hai không bao giờ ngủ.
 *
 * Dùng:
 *   node scripts/keepalive.mjs
 *   node scripts/keepalive.mjs --url https://abc.vercel.app --interval 10
 *   KEEPALIVE_URLS="https://a.com/api/ping,https://a.com/" node scripts/keepalive.mjs
 *
 * Biến môi trường:
 *   KEEPALIVE_URLS      Danh sách URL, ngăn cách bởi dấu phẩy.
 *   KEEPALIVE_INTERVAL  Số giây giữa 2 vòng ping (mặc định 10).
 *   KEEPALIVE_TIMEOUT   Timeout mỗi request, giây (mặc định 20).
 */

// Ping cả trang chủ lẫn /api/ping: Vercel tách mỗi route thành lambda riêng,
// nên hâm nóng /api/ping không đảm bảo hâm nóng luôn lambda render "/".
const DEFAULT_URLS = [
  "https://mttq.vercel.app/",
  "https://mttq.vercel.app/api/ping",
];

function parseArgs(argv) {
  const out = { urls: [], interval: null, timeout: null };
  for (let i = 0; i < argv.length; i++) {
    const next = () => argv[++i];
    switch (argv[i]) {
      case "--url":
      case "-u":
        out.urls.push(next());
        break;
      case "--interval":
      case "-i":
        out.interval = Number(next());
        break;
      case "--timeout":
      case "-t":
        out.timeout = Number(next());
        break;
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));

const urls = (
  args.urls.length
    ? args.urls
    : (process.env.KEEPALIVE_URLS ?? "").split(",").map((s) => s.trim()).filter(Boolean)
).filter(Boolean);
const TARGETS = urls.length ? urls : DEFAULT_URLS;

/** Lấy số giây từ CLI → env → mặc định, bỏ qua giá trị rác. */
function seconds(cliValue, envValue, fallback) {
  for (const candidate of [cliValue, Number(envValue)]) {
    if (Number.isFinite(candidate) && candidate > 0) return candidate * 1000;
  }
  return fallback * 1000;
}

const INTERVAL_MS = seconds(args.interval, process.env.KEEPALIVE_INTERVAL, 10);
const TIMEOUT_MS = seconds(args.timeout, process.env.KEEPALIVE_TIMEOUT, 20);

const stats = new Map(TARGETS.map((u) => [u, { ok: 0, fail: 0 }]));

function stamp() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

async function ping(url) {
  const t0 = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      // Cache-buster: chắc chắn không bị CDN/edge trả bản cached, vì bản cached
      // không đánh thức lambda phía sau.
      headers: {
        "User-Agent": "phuong-xanh-keepalive/1.0",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });
    // Đọc hết body để giải phóng socket, tránh rò rỉ kết nối khi chạy dài ngày.
    await res.arrayBuffer();
    const ms = Date.now() - t0;
    const rec = stats.get(url);
    if (res.ok) rec.ok++;
    else rec.fail++;
    return `${res.status} ${String(ms).padStart(5)}ms`;
  } catch (err) {
    stats.get(url).fail++;
    const ms = Date.now() - t0;
    const reason = err.name === "AbortError" ? "TIMEOUT" : (err.cause?.code ?? err.message);
    return `ERR   ${String(ms).padStart(5)}ms ${reason}`;
  } finally {
    clearTimeout(timer);
  }
}

let running = false;

async function round() {
  // Bỏ qua nếu vòng trước còn chạy — tránh chồng request khi site đang cold start
  // lâu hơn cả interval.
  if (running) return;
  running = true;
  try {
    const results = await Promise.all(TARGETS.map(ping));
    TARGETS.forEach((url, idx) => {
      console.log(`[${stamp()}] ${results[idx]}  ${url}`);
    });
  } finally {
    running = false;
  }
}

function shutdown(signal) {
  console.log(`\n[${stamp()}] Nhận ${signal}, dừng. Thống kê:`);
  for (const [url, { ok, fail }] of stats) {
    console.log(`  ${url}  ok=${ok} fail=${fail}`);
  }
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

console.log(
  `[${stamp()}] Keep-alive khởi động — ${TARGETS.length} URL, mỗi ${INTERVAL_MS / 1000}s:`,
);
TARGETS.forEach((u) => console.log(`  → ${u}`));

await round();
setInterval(round, INTERVAL_MS);
