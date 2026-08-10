# AJAYI VII — Living Paintings

Image-target WebAR for physical AJAYI VII paintings. Point a phone at the
real canvas; the same painting, animated, appears over it — no app
install, runs in mobile Safari and Chrome via the camera + WebGL, using
[MindAR](https://github.com/hiukim/mind-ar-js) for image tracking.

This app is deployed as its own Vercel project and stitched into
`elijahsnoz.me` at `/ar` and `/art` via rewrites in the repo root's
`vercel.json` — the same pattern `ai-music-lab` already uses for `/ai`.
The main site itself is static HTML and is untouched by this app.

## Status

**The system is real and working end to end** — routing, the artwork
config schema, the MindAR camera pipeline, the shared three.js layer
renderer (used identically by AR mode and the camera-less Digital mode),
the `.mind` target compiler, the automatic layer-extraction pipeline
(`scripts/extract-layers.mjs`), sound/info/QR/SEO — all implemented and
verified (see "What's been tested" below).

**`aje` ("Ajé", 2026, acrylic on canvas, 3 × 4 ft) is done.** Real source
photo (cropped to just the canvas — see `public/artworks/aje/
source-gallery-full.png` for the original gallery installation shot the
artist provided), a real compiled `.mind` target, and all 26 layers cut
automatically by `scripts/extract-layers.mjs` from
`content/artworks/aje.boxes.json` (a fractional bounding box per layer —
see that file and "Adding a new painting" below for how it works). The
water shader, sun/star/eye glow, figure sway, land-form breathing, fish
swim, and boat bob all render correctly over the real painting in Digital
mode, verified in a real browser.

Still missing: an ambient audio file (optional — sound is off by default
regardless). Search `content/artworks/aje.ts` for `TODO`.

A few layers whose neighbors sit very close (figure-right/plants-right,
orange-bar/figure-left) carry a faint trace of the neighboring shape at
their edges — a known limitation of box-based extraction on a busy
composition, documented in `aje.ts`. At the subtle animation amplitudes
used throughout it reads as imperceptible; worth a manual touch-up only
if a specific layer looks visibly off on a real device.

## Running locally

```bash
npm install
npm run dev
# http://localhost:3000/ar/aje
# http://localhost:3000/art/aje
```

AR mode needs `https` and a real camera on a phone to actually track
anything — on desktop `localhost` you'll get the camera permission
prompt and, once granted, MindAR will start (you can verify the video
pipeline works even with a laptop webcam), but it won't find a match
without a physical printout of the target image in front of the camera.
**Digital mode** (`/ar/aje` → simulate an unsupported device, or see
`ARExperience.tsx`'s `stage` state machine) is the fastest way to
iterate on layer positioning/animation without a camera at all.

## How the coordinate system works

Everything in `lib/scene/` is written against one convention: a layer's
`rect` is authored in ordinary top-left-origin, y-down, fractional image
coordinates (`x`, `y`, `width`, `height`, all 0–1, same as CSS `%`
positioning against the source photo). `lib/scene/coords.ts` converts
that into MindAR's own anchor space (image width = 1 unit, centered at
origin, y-up) — this is the same space the camera-less Digital mode uses
for its background plane, so **a layer positioned correctly in Digital
mode is positioned correctly in AR**, and if the phone moves around the
physical painting, MindAR keeps re-aligning that whole coordinate system
to the tracked image every frame; layer code never touches tracking.

`lib/scene/buildScene.ts` is the one function that turns an
`ArtworkConfig`'s `layers` array into three.js objects — sprites (plain
textured planes, animated via `lib/scene/behaviors.ts`'s sway/bob/
breathe/pulse/drift/swim/glowFlicker functions), the water shader
(`waterMaterial.ts`, a small vertex+fragment shader — displacement wave
plus a moving shimmer band, not a video), and particle systems
(`particles.ts` — falling rain, rising bubbles, flickering star-glow
points). Both `ARCanvas.tsx` and `DigitalPaintingViewer.tsx` call this
same function; neither has its own copy of the animation logic.

## Adding a new painting

1. **Photograph the physical painting** — flat, evenly lit, square-on,
   no glare or motion blur. If the shot includes the frame/wall (like the
   gallery installation photo `aje` shipped with), crop it down to just
   the canvas first — a plain white wall behind the frame reads as "the
   background" to every tool below, and the goal is the deep-blue *canvas*
   background instead. This photo is then used three ways: as the MindAR
   tracking target, as the Digital-mode background, and as the
   og:image/hero. Save it as `public/artworks/<slug>/source.png` (or
   `.jpg`).

2. **Compile the MindAR target** (fully automated, no browser needed):

   ```bash
   npm run compile-target -- public/artworks/<slug>/source.png public/targets/<slug>.mind
   ```

   This runs mind-ar's own `OfflineCompiler` in Node (via `canvas`) — the
   same compiler their web tool runs client-side. Commit the `.mind`
   file; it's a small binary of feature-point data, not something to
   regenerate on every deploy.

3. **Cut the animation layers — automatically, via local background
   removal.** `scripts/extract-layers.mjs boxes` takes one small JSON
   file — a generous fractional bounding box per layer, the same
   `{x,y,width,height}` shape as a layer's `rect` — and for each box:
   crops it out, flood-fills *that box's own* background inward from
   its edges (tolerant of the paint's natural brushstroke gradient), and
   auto-trims to the tight bounding box of whatever's left. No manual
   Photoshop cutout, no ML model, and — unlike trying to segment the
   *whole* painting in one pass — this works even when the whole-image
   background is walled off into disconnected pockets by abutting shapes
   (very common once a composition gets busy; `aje`'s did).

   ```bash
   npm run layers:boxes -- public/artworks/<slug>/source.png boxes.json public/layers/<slug>
   ```

   For an element that sits against *other painted shapes* rather than
   plain background (no single "background color" to key off — `aje`'s
   two patterned figures and its central winged form are exactly this),
   add `"mode": "keepLowSaturation"` to that box instead:

   ```json
   {
     "fish": { "rect": { "x": 0.36, "y": 0.86, "width": 0.22, "height": 0.13 } },
     "whale-form": {
       "rect": { "x": 0.29, "y": 0.28, "width": 0.44, "height": 0.17 },
       "mode": "keepLowSaturation"
     }
   }
   ```

   This keeps only the greyscale (black/white/grey) pixels and drops
   every saturated color around them — reliable whenever the target
   element is the *only* unsaturated shape in a colorful painting, which
   is common for line-art/mosaic figures against a vividly colored field.

   Every printed `rect` pastes straight into the layer's config entry —
   no eyeballing pixel coordinates. Anything you don't put in a box just
   stays part of `source.png` (the Digital-mode background plane and the
   un-cut parts of the AR video feed already show it). The water, rain,
   bubbles, and star-glow layers need no extraction at all — they're
   generated procedurally from just a `rect` and a few numbers (color,
   amplitude, speed, count); see `kind: "water"` / `"particles-*"` in
   `lib/types.ts`. `content/artworks/aje.boxes.json` is a complete
   worked example — 26 layers, both modes.

   `scripts/extract-layers.mjs report`/`extract` (whole-image connected
   components) still exist and are simpler when they apply, but only
   really work on sparser compositions where the background stays
   connected to the image border everywhere — check `npm run
   layers:report` first; if its `components.png` shows one giant blob
   swallowing most of the painting instead of separate shapes, go
   straight to `boxes`.

   Known limitations: background-colored negative space fully enclosed
   inside a shape (not touching that box's own edge) stays opaque rather
   than transparent, and two elements packed edge-to-edge can each pick
   up a faint trace of the other. Both are usually invisible once
   composited back over the real painting at the subtle animation
   amplitudes this system uses; touch up by hand only if a specific
   layer visibly shows it.

4. **Write the config**: copy `content/artworks/aje.ts` as a template,
   fill in `title`/`year`/`medium`/`dimensions`/`description`, the real
   `image.width`/`height` (the source photo's actual pixel dimensions),
   the layers and rects from step 3, and `ar.physicalWidthMeters` (the
   real canvas width on the wall). Register it in
   `content/artworks/index.ts`. That's the entire integration — no other
   file changes.

5. **(Optional) ambient audio** — a short, loopable, quiet ambient loop
   (water/atmosphere) at `public/audio/<slug>-ambient.mp3`. Sound is off
   by default and only starts after the visitor taps "Sound" (mobile
   autoplay restrictions, and the spec calls for opt-in audio).

6. **Print a QR code** for `https://elijahsnoz.me/ar/<slug>` — generated
   automatically on that artwork's `/art/<slug>` page
   (`components/ui/QRCode.tsx`); screenshot/export it for the gallery
   placard. The URL is stable and short by design.

## Deploying

1. Create a new Vercel project from this `ajayi-ar/` directory (Vercel
   will detect Next.js automatically — set its **root directory** to
   `ajayi-ar` if importing the whole monorepo).
2. Note the deployment's domain (or pin a stable one in the project's
   Vercel settings — don't rely on the random `-xyz123.vercel.app`
   suffix changing under you).
3. Set the `AJAYI_AR_ASSET_PREFIX` environment variable on that Vercel
   project to that domain (see `.env.example`) — this is what lets its
   `/_next/*` assets load directly from its own origin instead of
   needing a root-domain `/_next/*` rewrite, which `ai-music-lab`
   already occupies.
4. Update the four `ajayi-ar.vercel.app` placeholder destinations in the
   **repo root** `vercel.json` (`/ar`, `/ar/:path*`, `/art`,
   `/art/:path*`) to that same real domain.
5. Redeploy the root `elijahsnoz.me` project so the new rewrites take
   effect.

## What's been tested

Verified in this session, in a real headed-mode-equivalent Chrome
(driven via Playwright, not just typechecked):

- Landing screen renders per spec (title, quote, CTA, numbered steps).
- Unsupported-device path (`checkARSupport()` returning false) shows the
  exact fallback copy and correctly routes to Digital mode.
- Digital mode renders a live three.js canvas: the background photo, the
  water shader (visible wave/shimmer), the sun's pulse glow, and the
  star-glow particles all composited with correct alpha over the
  painting — proving `buildPaintingScene()`'s coordinate math and
  shaders work, independent of AR/camera plumbing.
- AR mode, with a fake camera device and granted permission: MindAR
  starts, the video pipeline goes live (`readyState 4`, real frames),
  the anchor/scene graph mounts without throwing, and the AR UI (Sound /
  Info / Exit AR, the Info panel) all render — no console errors beyond
  a harmless upstream `outputEncoding` deprecation warning from
  mind-ar's own bundle (three.js still honors it as a shim).
- `npm run build` passes (Turbopack + TypeScript), including
  `generateStaticParams`/`generateMetadata` for `/ar/aje` and `/art/aje`.
- `npm run compile-target` produces a real `.mind` file from a JPEG in
  Node, no browser involved.

**Not tested here** (needs a real device and the real artwork, both
outside what this session had access to): actual image-target detection
against a printed/physical painting, iPhone Safari specifically, Android
Chrome specifically, poor lighting, an artwork viewed at an angle or
partially out of frame, or a real camera permission *denial* dialog
(the sandboxed headless browser here has no camera hardware, so it can
only simulate "granted with a fake device" or "unsupported/no
`mediaDevices`" — not a genuine user tapping "Block").

## Testing checklist (do this once the real artwork/photo exist)

- [ ] iPhone Safari — landing → permission prompt → detection → animation
- [ ] Android Chrome — same flow
- [ ] Desktop (no phone) — confirm Digital-mode fallback works
- [ ] Deny camera permission on a real device — confirm the error state
      shows the "View Digital Painting" CTA, not a blank/crashed screen
- [ ] Grant permission, point at the painting in normal indoor lighting
- [ ] Point at the painting in poor/dim lighting
- [ ] Partially obscure the painting (hand, glare, edge of frame)
- [ ] View the painting at an angle, confirm layers stay aligned to it
      as the phone moves (not just detected once and frozen)
- [ ] Throttle network (target image / layer PNGs) and confirm the
      landing screen still works before assets finish loading
- [ ] Enable "reduce motion" at the OS level — confirm animations are
      replaced by each layer's `reducedMotion` (default: `still`)
- [ ] Toggle sound on/off, confirm it's off by default and needs a tap
- [ ] Scan the printed QR code end to end from a cold phone

## Known upstream quirks (already worked around, documented so nobody
"fixes" them into a re-break)

- **`three` is pinned to exactly `0.160.0`.** mind-ar 1.2.5's prebuilt
  `dist/mindar-image-three.prod.js` imports `sRGBEncoding` from `three`,
  which newer three.js releases (≳0.170) removed outright. Don't bump
  `three` without confirming mind-ar has shipped a compatible build.
- **`next.config.ts` aliases `fs` → `lib/empty-fs.js` for the browser
  build.** mind-ar's bundle contains tfjs's Node-only file-loading
  IOHandler, guarded by a runtime check that's always false in the
  browser — but bundlers still try to statically resolve `require("fs")`
  inside it. The stub only needs to exist, never runs.
