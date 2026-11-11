import { chromium } from "playwright-core";
import fs from "node:fs/promises";

const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const base = process.env.BASE_URL ?? "http://localhost:3000";
await fs.mkdir("qa", { recursive: true });

const browser = await chromium.launch({
  executablePath: chrome,
  headless: true,
  args: ["--enable-webgl", "--ignore-gpu-blocklist", "--use-gl=angle"],
});

const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
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
await page.locator("#tour").scrollIntoViewIfNeeded();

const stage = page.locator("#tour [data-status]");

try {
  await stage.waitFor({ state: "visible" });
  await page.waitForFunction(
    () =>
      document.querySelector('#tour [data-status="ready"]') !== null ||
      document.querySelector('#tour [data-status="error"]') !== null,
    { timeout: 30000 },
  );
} catch (error) {
  console.log("wait failed", error.message);
}

const state = await page.evaluate(() => {
  const node = document.querySelector("#tour [data-status]");
  const canvas = node?.querySelector("canvas");
  return {
    status: node?.getAttribute("data-status"),
    model: node?.getAttribute("data-model"),
    canvas: Boolean(canvas),
    canvasSize: canvas ? `${canvas.width}x${canvas.height}` : null,
  };
});

await page.waitForTimeout(1200);
await page.screenshot({ path: "qa/3d-villa.png" });
await stage.screenshot({ path: "qa/3d-villa-stage.png" });

const apartmentTab = page.getByRole("button", { name: /The apartment/ });
await apartmentTab.click();
await page.waitForFunction(
  () =>
    document.querySelector('#tour [data-status="ready"]') !== null &&
    document.querySelector('#tour [data-model="apartment"]') !== null,
  { timeout: 30000 },
);
await page.waitForTimeout(1200);
await page.screenshot({ path: "qa/3d-apartment.png" });
await stage.screenshot({ path: "qa/3d-apartment-stage.png" });

const apartmentState = await page.evaluate(() => {
  const node = document.querySelector("#tour [data-status]");
  return {
    status: node?.getAttribute("data-status"),
    model: node?.getAttribute("data-model"),
  };
});

console.log(JSON.stringify({ state, apartmentState, errors }, null, 2));
await browser.close();
