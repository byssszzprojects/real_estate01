/**
 * Local visual QA. Uses the installed Chrome so screenshots reflect the real
 * layout at a given viewport (the desktop preview panel can be narrower than
 * the emulated viewport).
 * Run with: node scripts/shots.mjs
 */
import { chromium } from "playwright-core";
import fs from "node:fs/promises";

const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const base = process.env.BASE_URL ?? "http://localhost:3000";

await fs.mkdir("qa", { recursive: true });

const browser = await chromium.launch({ executablePath: chrome, headless: true });

for (const [name, width, height] of [
  ["desktop", 1440, 900],
  ["mobile", 390, 844],
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);

  // Walk the page so lazy images and scroll reveals are resolved before the
  // full-page capture.
  await page.evaluate(async () => {
    const step = 600;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    window.scrollTo(0, 0);
    await new Promise((resolve) => setTimeout(resolve, 300));
  });
  await page.waitForTimeout(400);

  const metrics = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    overflowX:
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
    images: Array.from(document.images).map((image) => ({
      src: image.currentSrc.split("/").pop(),
      width: image.naturalWidth,
      complete: image.complete,
    })),
  }));

  await page.screenshot({ path: `qa/${name}.png`, fullPage: true });
  console.log(name, JSON.stringify(metrics, null, 2));
  console.log("errors:", errors);
  await context.close();
}

await browser.close();
