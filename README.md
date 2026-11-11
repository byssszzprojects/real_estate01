# ZARA — a reference study

A light, single-page architecture and residences website built from the
`zara.homes` design measurements. Editorial spacing, glass surfaces over
photography, Instrument Serif display type, Familjen Grotesk text, and a single
green accent used sparingly.

> **Placeholder content.** The wordmark, copy, photography, 3D models and sky
> cube come from the reference page and are used here to reproduce its layout.
> Replace the copy, brand name, imagery and models with the project's own
> before publishing. The footer carries a visible placeholder note.

## Stack

- Next.js 16 (App Router, `output: "export"`), React 19, TypeScript
- Tailwind CSS 4 with measured design tokens in `app/globals.css`
- `next/font/local` — the two original typefaces, self-hosted
- Lenis 1.3 for weighted, inertial page scrolling
- Three.js 0.187 for the seven-stage structure study and the interactive
  model viewer (`GLTFLoader`, `OrbitControls`, `DRACOLoader`)
- Sharp for the image pipeline, `playwright-core` + `axe-core` for local QA
- No UI kit: motion is CSS keyframes, Lenis, one `IntersectionObserver` and
  scroll-driven CSS views

## Run it

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

```bash
npm run build      # static export to out/
npm run preview    # serves out/ at http://localhost:4173
npm run typecheck  # tsc --noEmit
```

## The opening sequence

`IntroSequence` runs one pinned stage for 260% of the viewport, scrubbed with
ScrollTrigger (`scrub: 1`, `pin`, `invalidateOnRefresh`):

1. Cream hero, a seamless “ZARA” marquee at 12vw and a 390×295 print.
2. The print opens to 90% of the viewport with a uniform cover scale; the
   marquee drops to 25% opacity behind it.
3. The print wipes through three photographs with horizontal clip-path wipes,
   then travels into the About headline and hands over to its inline thumbnail
   (125×60, radius 8). Only after it has cleared the text do the words rise out
   of their masks, the divider draw and the supporting copy fade up.

All distances are function-based GSAP values so `invalidateOnRefresh`
re-measures the slot on resize. The headline is marked `data-split="manual"`
so the page-wide motion system leaves it alone.

## Collage (“A quieter way to live”)

Seven prints scattered within -8°..+8° around the carousel. Scrolling pulls
them into the centre, eases their rotation to 0 and fades them out while the
carousel opens from 0.62 to full size and the serif heading drops to 40%.
The arrows wipe the next slide in from the right (`clip-path`, 0.5s) while the
outgoing print shifts left 15%; the counter and caption follow.

## Where things live

```
app/
  layout.tsx        fonts, metadata, OG image, skip link
  page.tsx          section order + JSON-LD
  globals.css       colour, type, radius, shadow and spacing tokens
components/
  sections/         IntroSequence (pinned hero → About), Collage, FullView,
                    FullViewStudy, Study, Quiet, Stay, Tour, StepInside
  site/             header, footer, Photo, gallery, reveal observer
  three/            TourViewer — lazy Three.js model viewer
                    (FullViewStudy is the scroll-driven study in sections/)
lib/
  gallery.ts        gallery captions
  image-manifest.json  generated intrinsic dimensions
public/
  fonts/            Familjen Grotesk 400–700, Instrument Serif regular/italic
  images/           optimised placeholders + responsive/ derivatives
  models/           vill_draco.glb, apartment.glb
  draco/            Draco decoder for the compressed villa
  skybox/           six-face sky cube used for image-based lighting
  svg/              supplied hint icons
assets/             the original reference asset pack (fonts, photos, 3D, skybox)
scripts/
  optimize-images.mjs  crop stamps, build srcsets, write manifest
  shots.mjs            full-page screenshots at 1440 and 390
  qa.mjs               gallery/menu/links/images + axe checks
  qa3d.mjs             both models, console errors, framed screenshots
  qa-motion.mjs        entrance/reveals/drift, wheel scroll, mobile stage
```

## Design tokens

Light (`:root`) and dark (`prefers-color-scheme: dark`) values are declared
exactly as measured:

| Token | Value |
| --- | --- |
| Background | `#ffffff` |
| Foreground | `#171717` |
| Panel (beige) | `#ede6d6` |
| Ink | `#2a2725` |
| Muted ink | `#2A2725B3` |
| Accent | `#3fa85b` |
| Glass | `#FFFFFF80` / `#FFFFFF99` |
| Border | `#FFFFFFB3` |
| Radius | `9999px` |

Type sizes in use: 11, 14, 16, 18, 50.4, 60, 63.36, 74.88, 90.24 and 128 px.
Section padding sits on the measured 40 px step; inner rhythm uses 24/16/12/8.
Radii: 6, 18, 24, 36, 9999. Glass shadow: the four measured layers, including
the 4 px white ring.

## Images

`scripts/optimize-images.mjs` reads the pristine pack in
`assets/zara.homes-assets/images`, removes the baked-in
“EXPLORE THE MODEL” lettering from the tour captures, writes 640/1024 WebP
derivatives, and regenerates the full-size files. It also writes
`lib/image-manifest.json`, which `Photo` uses for exact `width`/`height` and a
complete `srcset`. Re-run with:

```bash
npm run images
```

All photos are lazy-loaded below the hero. The hero is preloaded and marked
`fetchPriority="high"`.

## The structure study

The “Full View” sequence is a seven-stage architectural study built from
`public/models/vill_draco.glb`. It follows the reference recording: **Full View,
Walls, Floor, Roof, Pillars, Stairs, Windows & Doors**. The section is pinned
for roughly four and a half screens; scrolling moves through the stages, and
each stage has a rail dot for direct access.

- The model is stripped of its site slab, lawn and bushes at load time; the
  villa's named nodes (`walls`, `floor`, `outerroof`, `pillers`, `stairs`,
  `windowframe` and the rest) drive the layer selection.
- Stage 0 keeps the original materials, with subtle architectural edges for
  definition. Later stages ghost the rest of the house in a cool wireframe and
  light the selected layer: titanium-white walls, a honed marble floor, roof
  tiles and walnut, painted columns, oak stairs and chrome-framed glazing.
- Each stage eases the camera to a framing suited to the layer, from the full
  overview to a slightly closer stair view. Portrait phones get an additional
  distance multiplier so the plan never crops behind the labels.
- Drag or use the arrow keys to orbit. Wheel zoom is off and vertical touch
  drags scroll the page (`touch-action: pan-y`), so the pinned stage never traps
  scroll. The render loop pauses offscreen.
- The header switches to a sky-coloured, ink-on-light bar over the study so the
  fixed navigation does not leave stale hero pixels across the canvas, then
  returns to the cream bar afterwards.
- `prefers-reduced-motion` uses instant stage/camera changes and turns off
  auto-rotation. WebGL or model failures fall back to the photography.

The study loads its model only when the section approaches the viewport, using
the same sky cube and Draco decoder as the tour below.

## The 3D tour

“Walk around it.” sits between Stays and the closing image. Three.js is
dynamically imported only when the section comes within 600 px of the
viewport, so the initial page load stays light.

- **Villa** — `vill_draco.glb`, Draco-compressed, with the reference site slab
  and lawn stripped out. It sits on the page's own warm ground and contact
  shadow, with the vermilion car muted to stone.
- **Apartment** — `apartment.glb`, an unfurnished shell presented as
  “Residence 02 — Plan” at 1:100. Its dark source floor is lifted to warm stone
  and its walls warmed to match the page.
- A supplied six-face sky cube is prefiltered with `PMREMGenerator` for
  image-based lighting, alongside a high sun, hemisphere fill and soft shadows.
- Camera distance is derived from each model's bounds, with a wider fit for the
  narrow mobile stage.
- Drag (or the left/right arrow keys when focused) orbits; auto-rotation pauses
  on interaction and resumes after six seconds.
- Wheel zoom is deliberately off so a full-width canvas cannot trap page
  scroll. Touch drags use `touch-action: pan-y`: horizontal drags orbit,
  vertical swipes scroll the page.
- Rendering pauses when the stage leaves the viewport. Reduced motion turns off
  auto-rotation and the reveal scale.
- If WebGL or the model fails, an in-stage fallback points back to the
  photography.

The viewer is a client component; both GLBs, the Draco decoder and the sky
cube are static files under `public/` and need no server.

## Motion

Lenis supplies the page's inertial scroll, with CSS keyframes and one observer
for the rest:

- Lenis smooth scrolling (`lerp` 0.09, light wheel resistance), with anchor
  links eased to the existing 5 rem scroll margin. It is not initialised when
  `prefers-reduced-motion: reduce` is set, leaving native scrolling in place.
- Staggered hero entrance (title, label, copy, buttons, spec card, scroll cue)
  and a 26-second slow zoom on the hero photograph.
- A drawn scroll cue, a softly pulsing availability dot, and a paused-on-hover
  “Full View” marquee.
- Scroll reveals with a short vertical rise for sections and images.
- Scroll-driven image drift inside the architecture and interiors figures
  (`animation-timeline: view()`), with a static crop as fallback.
- A thin reading-progress hairline in the scrolled header.
- Enter animations for the native gallery dialog and backdrop.

`prefers-reduced-motion: reduce` disables Lenis, the zoom, marquee, ping,
drift, hero entrance and reveals, and the 3D auto-rotation.

## Behaviour and accessibility

- Scroll reveals are progressive enhancement; content is visible without JS.
  Headings use the same unclipped fade as everything else, so none can be left
  invisible by a reveal mask.
- `prefers-reduced-motion` removes the slow zoom, marquee, ping, drift, hero
  entrance and reveals.
- The gallery is a native `<dialog>` (focus containment, Escape, arrow keys,
  backdrop close), with a filmstrip and live counter.
- Sticky header becomes a near-opaque cream glass bar with a scroll-progress
  hairline; over the structure study it becomes an opaque sky bar so the canvas
  can sit beneath it without ghosting. Mobile menu traps page scroll and closes on Escape, with
  `data-lenis-prevent` on its scroll surface. Anchor targets carry a 5 rem
  scroll margin so the fixed header never covers a section label.
- Skip link, semantic landmarks, labelled controls, alt text on every photo,
  visible focus rings, and AA contrast.
- axe (WCAG 2.1 A/AA) reports no violations; no console errors. Both 3D models
  and all seven study stages are checked separately with Playwright/WebGL.

## Deploy

The project is a fully static export (`out/`) with trailing slashes, so both
hosts work without a Node server.

**Cloudflare Pages**

- Framework preset: None (or Next.js static)
- Build command: `npm run build`
- Output directory: `out`

**Vercel**

- Import the repository, framework preset: Next.js
- `output: "export"` is already configured; Vercel serves the exported site.

Contact details live in `components/site/SiteFooter.tsx` (email, phone, street
address), `components/site/SiteHeader.tsx` and the JSON-LD block in
`app/page.tsx`. The domain is set by `metadataBase` in `app/layout.tsx`
(currently `https://zarastudio.in`) — update it if the site moves.
