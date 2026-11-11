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

const report = {};

// --- Desktop: entrance, reveals, drift -------------------------------------
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "light",
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForTimeout(180);
  await page.screenshot({ path: "qa/hero-intro.png" });
  await page.waitForTimeout(1400);
  await page.screenshot({ path: "qa/hero-settled.png" });

  const hero = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".hero-intro")).map((node) => ({
      opacity: getComputedStyle(node).opacity,
      animation: getComputedStyle(node).animationName,
    })),
  );

  await page.locator("#interiors").scrollIntoViewIfNeeded();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "qa/motion-interiors.png" });

  const motion = await page.evaluate(() => {
    const drift = document.querySelector("#interiors .drift-layer");
    const headings = Array.from(
      document.querySelectorAll("[data-reveal] h2, h2[data-reveal]"),
    ).map((node) => ({
      text: (node.textContent || "").trim().slice(0, 24),
      visible: Boolean(
        node.closest("[data-reveal]")?.classList.contains("is-visible"),
      ),
      opacity: getComputedStyle(node).opacity,
    }));
    const figures = Array.from(
      document.querySelectorAll("#interiors figure[data-reveal]"),
    ).map((node) => ({
      visible: node.classList.contains("is-visible"),
      opacity: getComputedStyle(node).opacity,
      image: node.querySelector("img")?.currentSrc.split("/").pop(),
      imageComplete: node.querySelector("img")?.complete,
    }));
    const quietHeading = document.querySelector("#interiors h2");
    const quietFigure = document.querySelector("#interiors figure[data-reveal]");
    const quietImage = quietFigure?.querySelector("img");
    const rect = (node) => {
      if (!node) return null;
      const r = node.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, height: r.height, width: r.width };
    };
    return {
      visibleReveals: document.querySelectorAll("[data-reveal].is-visible").length,
      totalReveals: document.querySelectorAll("[data-reveal]").length,
      headings,
      figures,
      scrollY: window.scrollY,
      innerHeight: window.innerHeight,
      quietHeading: rect(quietHeading),
      quietHeadingClass: quietHeading?.className,
      quietFigure: rect(quietFigure),
      quietImage: rect(quietImage),
      quietImageOpacity: quietImage
        ? getComputedStyle(quietImage).opacity
        : null,
      driftTransform: drift ? getComputedStyle(drift).transform : null,
      viewTimeline: CSS.supports("animation-timeline: view()"),
    };
  });

  const emptyImages = await page.evaluate(() =>
    Array.from(document.images)
      .filter((image) => !image.getAttribute("src"))
      .map((image) => image.outerHTML.slice(0, 240)),
  );

  // The canvas must not capture page scrolling now that zoom is off.
  await page.locator("#tour").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const stageBox = await page.locator("#tour [data-status]").boundingBox();
  const beforeWheel = await page.evaluate(() => window.scrollY);
  if (stageBox) {
    await page.mouse.move(
      stageBox.x + stageBox.width / 2,
      stageBox.y + stageBox.height / 2,
    );
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(500);
  }
  const afterWheel = await page.evaluate(() => window.scrollY);

  // Every reveal should resolve after a full pass down the page.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
  });
  await page.waitForTimeout(800);
  const revealSweep = await page.evaluate(() => ({
    visible: document.querySelectorAll("[data-reveal].is-visible").length,
    total: document.querySelectorAll("[data-reveal]").length,
    missing: Array.from(document.querySelectorAll("[data-reveal]"))
      .filter((node) => !node.classList.contains("is-visible"))
      .map((node) => (node.textContent || "").trim().slice(0, 40)),
  }));

  report.desktop = {
    errors,
    hero,
    motion,
    emptyImages,
    wheelScroll: { beforeWheel, afterWheel },
    revealSweep,
  };
  await context.close();
}

// --- Mobile: 3D stage framing and page overflow ----------------------------
{
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
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
    await page.waitForFunction(
      () =>
        document.querySelector('#tour [data-status="ready"]') !== null ||
        document.querySelector('#tour [data-status="error"]') !== null,
      { timeout: 30000 },
    );
  } catch (error) {
    report.mobile = { waitFailed: error.message };
  }
  await page.waitForTimeout(900);
  await stage.screenshot({ path: "qa/3d-villa-mobile.png" });
  await page.screenshot({ path: "qa/tour-mobile.png" });

  report.mobile = {
    ...report.mobile,
    errors,
    status: await stage.getAttribute("data-status"),
    box: await stage.boundingBox(),
    overflowX: await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
    touchAction: await page
      .locator("#tour canvas")
      .evaluate((node) => getComputedStyle(node).touchAction)
      .catch(() => null),
  };
  await context.close();
}

console.log(JSON.stringify(report, null, 2));
await browser.close();
