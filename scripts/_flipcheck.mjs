import puppeteer from "puppeteer-core";

const BASE = process.argv[2] ?? "http://localhost:3010";
const OUT = process.argv[3] ?? ".";

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
});
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900 });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(BASE + "/", { waitUntil: "networkidle0" });

const cards = await page.$$eval("a[href*='heyzine']", (els) => els.length);
console.log("thẻ có flip-book:", cards);

// bấm vào thẻ tin đầu tiên
await page.click("a[href*='heyzine']");
await new Promise((r) => setTimeout(r, 3500));

const state = await page.evaluate(() => {
  const dlg = document.querySelector("[role='dialog']");
  const iframe = dlg?.querySelector("iframe");
  return {
    modalOpen: !!dlg,
    iframeSrc: iframe?.getAttribute("src") ?? null,
    iframeSize: iframe ? `${Math.round(iframe.clientWidth)}x${Math.round(iframe.clientHeight)}` : null,
    bodyOverflow: document.body.style.overflow,
  };
});
console.log("modal:", JSON.stringify(state));
await page.screenshot({ path: `${OUT}/flipbook-open.png` });

// đóng bằng ESC
await page.keyboard.press("Escape");
await new Promise((r) => setTimeout(r, 500));
console.log(
  "sau ESC:",
  JSON.stringify(
    await page.evaluate(() => ({
      modalOpen: !!document.querySelector("[role='dialog']"),
      bodyOverflow: document.body.style.overflow,
    })),
  ),
);
console.log("lỗi JS:", errors.length ? errors : "không có");

await browser.close();
