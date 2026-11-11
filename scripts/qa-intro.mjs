import { chromium } from "playwright-core";

const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const base = process.env.BASE_URL ?? "http://localhost:60902";

const browser = await chromium.launch({ executablePath: chrome, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});

await page.goto(base, { waitUntil: "networkidle" });
await page.waitForTimeout(900);

const read = () =>
  page.evaluate(() => {
    const intro = document.querySelector(".intro");
    const frame = intro.querySelector(".intro-frame");
    const slot = intro.querySelector(".intro-slot");
    const words = [...intro.querySelectorAll(".intro-word")];
    const rule = [...intro.querySelectorAll("span")].find((node) =>
      node.className.includes("origin-left"),
    );
    const meta = intro.querySelector(".translate-y-4");
    const collage = document.querySelector(".collage-card").closest("section");
    const main = collage.querySelector(".collage-main").parentElement;
    const cards = [...collage.querySelectorAll(".collage-card")];
    const heading = collage.querySelector("h2");
    const css = (node) => getComputedStyle(node);
    const upright = words.filter((word) => {
      const transform = css(word).transform;
      return transform === "none" || transform === "matrix(1, 0, 0, 1, 0, 0)";
    }).length;

    const hero = intro.querySelector(".z-30");
    const heroTitle = intro.querySelector("h1");

    return {
      scrollY: Math.round(scrollY),
      hero: {
        title: heroTitle?.textContent.replace(/\s+/g, " ").trim(),
        titleSize: heroTitle ? css(heroTitle).fontSize : null,
        opacity: hero ? css(hero).opacity : null,
      },
      frame: {
        transform: css(frame).transform,
        opacity: css(frame).opacity,
        radius: css(frame).borderTopLeftRadius,
        width: Math.round(frame.getBoundingClientRect().width),
      },
      slot: {
        opacity: css(slot).opacity,
        width: Math.round(slot.getBoundingClientRect().width),
        top: Math.round(slot.getBoundingClientRect().top),
        firstWordTop: Math.round(words[0].getBoundingClientRect().top),
      },
      wordsUp: upright,
      wordsTotal: words.length,
      rule: css(rule).transform,
      meta: css(meta).opacity,
      collage: {
        heading: css(heading).opacity,
        main: css(main).transform,
        cardOpacity: css(cards[0]).opacity,
        cardTransform: css(cards[0]).transform,
      },
      triggers: window.__zaraMotion?.scrollTriggers,
    };
  });

const top = await read();

const pinEnd = await page.evaluate(() => {
  // The pinned intro runs for 260% of the viewport.
  const end = Math.round(window.innerHeight * 2.6);
  document.documentElement.style.scrollBehavior = "auto";
  window.scrollTo(0, end);
  return end;
});
await page.waitForTimeout(1400);
const end = await read();

const galleryTop = await page.evaluate(() => {
  const stage = document
    .querySelector(".collage-card")
    .closest("section")
    .querySelector(".relative.mx-auto");
  const y = Math.round(stage.getBoundingClientRect().top + scrollY - 40);
  window.scrollTo(0, y);
  return y;
});
await page.waitForTimeout(1600);
const gallery = await read();

const captionBefore = await page.locator('[aria-live="polite"]').first().innerText();
await page.getByRole("button", { name: "Next residence" }).click();
await page.waitForTimeout(900);
const captionAfter = await page.locator('[aria-live="polite"]').first().innerText();

console.log(
  JSON.stringify(
    { top, pinEnd, end, galleryTop, gallery, captionBefore, captionAfter, errors },
    null,
    2,
  ),
);

await browser.close();
