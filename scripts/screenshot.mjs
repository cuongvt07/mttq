/**
 * Chụp màn hình kiểm tra giao diện bằng Chrome có sẵn trên máy.
 *
 *   node scripts/screenshot.mjs [thư-mục-lưu] [base-url]
 */
import puppeteer from "puppeteer-core";

const OUT = process.argv[2] ?? ".";
const BASE = process.argv[3] ?? "http://localhost:3000";

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
});

async function shot(path, file, width, height, fullPage = false) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.goto(BASE + path, { waitUntil: "networkidle0" });
  // chờ hiệu ứng reveal chạy xong
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: `${OUT}/${file}`, fullPage });
  await page.close();
  console.log("→", file);
}

await shot("/", "home-desktop.png", 1400, 1900);
await shot("/", "home-mobile.png", 430, 1400);
await shot("/admin/login", "login.png", 1200, 800);

await browser.close();
