import { chromium } from "playwright-core";
import path from "node:path";
import fs from "node:fs/promises";

const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const base = process.env.BASE_URL ?? "http://localhost:3000";
const axePath = path.resolve("node_modules/axe-core/axe.min.js");

await fs.mkdir("qa", { recursive: true });
const browser = await chromium.launch({ executablePath: chrome, headless: true });

const report = {};

// --- Desktop: gallery, links, axe ------------------------------------------
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base, { waitUntil: "networkidle" });

  await page.getByRole("button", { name: "View the full gallery" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Photography viewer" });
  await dialog.waitFor({ state: "visible" });
  await page.waitForTimeout(900);
  const firstCaption = await page.locator("dialog p.truncate").innerText();
  const galleryImage = await page.locator("dialog figure img").evaluate((img) => ({
    complete: img.complete,
    naturalWidth: img.naturalWidth,
    src: img.currentSrc.split("/").pop(),
  }));
  report.galleryImage = galleryImage;
  await page.screenshot({ path: "qa/gallery.png" });
  await page.keyboard.press("ArrowRight");
  const secondCaption = await page.locator("dialog p.truncate").innerText();
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });

  const missingAnchors = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href^="#"]'))
      .filter((a) => {
        const hash = a.getAttribute("href") ?? "";
        return hash.length > 1 && !document.querySelector(hash);
      })
      .map((a) => a.getAttribute("href")),
  );

  // Lazy images after a full walk.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
  });
  await page.waitForTimeout(500);
  const brokenImages = await page.evaluate(() =>
    Array.from(document.images)
      .filter((img) => img.currentSrc && img.complete && img.naturalWidth === 0)
      .map((img) => img.currentSrc),
  );

  await page.addScriptTag({ path: axePath });
  const axe = await page.evaluate(async () => {
    // @ts-expect-error injected
    return await window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
      },
    });
  });

  report.desktop = {
    errors,
    firstCaption,
    secondCaption,
    missingAnchors,
    brokenImages,
    axe: axe.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.length,
      targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")),
    })),
  };

  await context.close();
}

// --- Mobile: menu -----------------------------------------------------------
{
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: "qa/menu.png" });
  report.mobileMenu = {
    expanded: await page
      .getByRole("button", { name: "Close menu" })
      .getAttribute("aria-expanded"),
    linkCount: await page.locator("#mobile-menu a").count(),
  };
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  report.mobileMenu.closed = (await page.locator("#mobile-menu").count()) === 0;
  await context.close();
}

// --- Dark scheme ------------------------------------------------------------
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "dark",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  await page.screenshot({ path: "qa/dark-top.png" });
  await page.locator("#interiors").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: "qa/dark-interiors.png" });
  report.dark = await page.evaluate(() => ({
    bodyBg: getComputedStyle(document.body).backgroundColor,
    bodyColor: getComputedStyle(document.body).color,
  }));
  await context.close();
}

console.log(JSON.stringify(report, null, 2));
await browser.close();
