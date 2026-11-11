/**
 * Build-time asset prep for the reference photography.
 * - Removes the baked-in "EXPLORE THE MODEL" stamp from the lower edge of the
 *   tour captures by cropping the bottom 16%.
 * - Generates 640 / 1024 px WebP derivatives. The untouched original is used
 *   as the largest srcset entry.
 * - Writes lib/image-manifest.json so Photo can emit exact width/height and a
 *   complete srcset without runtime filesystem access.
 * Run with: node scripts/optimize-images.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SOURCE_DIR = "assets/zara.homes-assets/images";
const OUT_ROOT = "public/images";
const OUT_DIR = "public/images/responsive";
const WIDTHS = [640, 1024];
const STAMPED = new Set([
  "living-room-clean",
  "kitchen-clean",
  "exterior-garden-clean",
  "landscape-house-clean",
]);

const files = (await fs.readdir(SOURCE_DIR)).filter((file) => file.endsWith(".webp"));
await fs.mkdir(OUT_DIR, { recursive: true });
await fs.mkdir("lib", { recursive: true });

const manifest = {};

for (const file of files) {
  const name = path.parse(file).name;
  const inputPath = path.join(SOURCE_DIR, file);
  const meta = await sharp(inputPath).metadata();

  let pipeline = sharp(inputPath);
  let width = meta.width ?? 1600;
  let height = meta.height ?? 900;
  let cropped = false;

  if (STAMPED.has(name)) {
    const kept = Math.round(height * 0.84);
    pipeline = pipeline.extract({ left: 0, top: 0, width, height: kept });
    height = kept;
    cropped = true;
  }

  const buffer = await pipeline.toBuffer();

  // The largest source is regenerated too, so stamped captures are clean at
  // every srcset step. Assets are read from the pristine pack, never public/,
  // which keeps this script idempotent.
  await sharp(buffer)
    .webp({ quality: 84, effort: 5 })
    .toFile(path.join(OUT_ROOT, file));

  for (const target of WIDTHS) {
    if (target > width) continue;
    await sharp(buffer)
      .resize({ width: target, withoutEnlargement: true })
      .webp({ quality: 78, effort: 5 })
      .toFile(path.join(OUT_DIR, `${name}-${target}.webp`));
  }

  manifest[name] = { width, height };
  console.log(`${name} ${width}x${height}${cropped ? " (stamp cropped)" : ""}`);
}

await fs.writeFile("lib/image-manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);

// Social card, composed from the daylight exterior.
await sharp(path.join(SOURCE_DIR, "hero3.webp"))
  .resize(1200, 630, { fit: "cover", position: "centre" })
  .jpeg({ quality: 82 })
  .toFile("public/images/og.jpg");

console.log("image-manifest.json + og.jpg written");
