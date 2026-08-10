#!/usr/bin/env node
/**
 * Automatic layer extraction for flat-color, black-outlined paintings
 * (exactly this painting's style): every shape is enclosed by a solid
 * black line, so "background" and "painted shape" can be told apart by
 * color and connectivity alone — no manual cutout, no ML model.
 *
 * RECOMMENDED — local per-element extraction, robust on busy compositions:
 *   node scripts/extract-layers.mjs boxes <source.jpg> <boxes.json> <outDir>
 *
 *   boxes.json: one generous fractional bounding box per layer —
 *   { "fish": { "rect": {"x":0.36,"y":0.86,"width":0.22,"height":0.13} },
 *     "whale-form": { "rect": {...}, "mode": "keepLowSaturation" } }
 *   For each box: crops it out, flood-fills *that box's own* background
 *   inward from its edges, and auto-trims to whatever's left — see
 *   runExtractBoxes()'s doc comment below for why this succeeds where a
 *   whole-image pass gets stuck. `mode: "keepLowSaturation"` swaps the
 *   background-removal step for "keep only unsaturated (black/white/
 *   grey) pixels" — use it for an element that sits against *other
 *   painted shapes* rather than plain background, whenever it's the only
 *   greyscale shape in an otherwise colorful painting (patterned
 *   figures, white/line-art forms). content/artworks/aje.boxes.json is a
 *   complete worked example.
 *
 * SIMPLER, but only works on sparser compositions — whole-image pass:
 *   node scripts/extract-layers.mjs report <source.jpg> [outDir]
 *
 *   Flood-fills the background color inward from the image border, then
 *   labels every remaining enclosed region as a connected component.
 *   Writes <outDir>/components.png (each component tinted a distinct
 *   color) and prints every component's id, pixel count and bounding
 *   box. Check this first: if components.png shows one giant blob
 *   swallowing most of the painting instead of separate shapes (common
 *   once shapes start abutting each other with no background gap
 *   between them — their touching outlines fuse into one component),
 *   the whole-image approach can't separate this painting; use `boxes`
 *   instead.
 *
 *   node scripts/extract-layers.mjs extract <source.jpg> <mapping.json> <outDir>
 *
 *   mapping.json: { "fish": [17, 18], "boat": [22], ... } — component
 *   ids per layer, read off components.png. Writes one transparent PNG
 *   per named layer and prints its fractional rect.
 *
 * Known limitations (both modes): background-colored pixels fully
 * enclosed inside a shape (not connected to the background) stay opaque
 * rather than transparent — e.g. a sliver of negative space between a
 * figure's arm and body. Two elements packed edge-to-edge can each pick
 * up a faint trace of the other. Both are usually invisible once
 * composited back over the real painting at this system's subtle
 * animation amplitudes; touch up by hand in an image editor only if a
 * specific layer visibly shows it.
 */
import { loadImage, createCanvas } from "canvas";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const BACKGROUND_TOLERANCE = Number(process.env.BG_TOLERANCE) || 42; // Euclidean RGB distance; raise if flood-fill misses textured background, lower if it eats faint shapes
const BORDER_SAMPLE_PX = 3;
const MIN_COMPONENT_AREA = 24; // drop stray anti-aliasing specks

function getImageData(image) {
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, image.width, image.height);
  return ctx.getImageData(0, 0, image.width, image.height);
}

function sampleBackgroundColor(data, width, height) {
  let r = 0, g = 0, b = 0, n = 0;
  const addPixel = (x, y) => {
    const i = (y * width + x) * 4;
    r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
  };
  for (let x = 0; x < width; x++) {
    for (let t = 0; t < BORDER_SAMPLE_PX; t++) {
      addPixel(x, t);
      addPixel(x, height - 1 - t);
    }
  }
  for (let y = 0; y < height; y++) {
    for (let t = 0; t < BORDER_SAMPLE_PX; t++) {
      addPixel(t, y);
      addPixel(width - 1 - t, y);
    }
  }
  return [r / n, g / n, b / n];
}

function colorDistance(data, i, [br, bg, bb]) {
  const dr = data[i] - br;
  const dg = data[i + 1] - bg;
  const db = data[i + 2] - bb;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * BFS flood fill seeded from the border, following background-colored
 * pixels. Compares each candidate to the neighbor that's admitting it
 * (not a single fixed target color), so it tolerates the gradual
 * brushstroke/gradient variation real acrylic backgrounds have — a
 * fixed-target comparison stalls partway across a large hand-painted
 * field. A global cap (relative to the sampled border average) still
 * catches runaway drift so it can't tunnel through a long, slow
 * gradient into a differently-colored painted shape.
 * Returns a Uint8Array mask: 1 = background, 0 = foreground (painted shape or outline).
 */
function floodFillBackground(data, width, height, bgColor) {
  const mask = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0, tail = 0;
  const globalCap = BACKGROUND_TOLERANCE * 2.2;

  const tryEnqueue = (x, y, fromIdx) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (mask[idx] !== 0) return;
    const dr = data[idx * 4] - data[fromIdx * 4];
    const dg = data[idx * 4 + 1] - data[fromIdx * 4 + 1];
    const db = data[idx * 4 + 2] - data[fromIdx * 4 + 2];
    if (Math.sqrt(dr * dr + dg * dg + db * db) > BACKGROUND_TOLERANCE) return;
    if (colorDistance(data, idx * 4, bgColor) > globalCap) return;
    mask[idx] = 1;
    queue[tail++] = idx;
  };

  for (let x = 0; x < width; x++) {
    if (colorDistance(data, (x) * 4, bgColor) <= BACKGROUND_TOLERANCE) { mask[x] = 1; queue[tail++] = x; }
    const bottomIdx = (height - 1) * width + x;
    if (colorDistance(data, bottomIdx * 4, bgColor) <= BACKGROUND_TOLERANCE) { mask[bottomIdx] = 1; queue[tail++] = bottomIdx; }
  }
  for (let y = 0; y < height; y++) {
    const leftIdx = y * width;
    if (colorDistance(data, leftIdx * 4, bgColor) <= BACKGROUND_TOLERANCE) { mask[leftIdx] = 1; queue[tail++] = leftIdx; }
    const rightIdx = y * width + (width - 1);
    if (colorDistance(data, rightIdx * 4, bgColor) <= BACKGROUND_TOLERANCE) { mask[rightIdx] = 1; queue[tail++] = rightIdx; }
  }

  while (head < tail) {
    const idx = queue[head++];
    const x = idx % width;
    const y = (idx - x) / width;
    tryEnqueue(x + 1, y, idx);
    tryEnqueue(x - 1, y, idx);
    tryEnqueue(x, y + 1, idx);
    tryEnqueue(x, y - 1, idx);
  }

  return mask;
}

/** Labels 4-connected foreground regions. Returns { labels: Int32Array, components: Map<id, {area, minX,minY,maxX,maxY}> }. */
function labelComponents(bgMask, width, height) {
  const labels = new Int32Array(width * height);
  const components = new Map();
  const queue = new Int32Array(width * height);
  let nextLabel = 0;

  for (let start = 0; start < width * height; start++) {
    if (bgMask[start] === 1 || labels[start] !== 0) continue;
    nextLabel++;
    let head = 0, tail = 0;
    queue[tail++] = start;
    labels[start] = nextLabel;
    let area = 0;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    while (head < tail) {
      const idx = queue[head++];
      const x = idx % width;
      const y = (idx - x) / width;
      area++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      const neighbors = [
        [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1],
      ];
      for (const [nx, ny] of neighbors) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const nIdx = ny * width + nx;
        if (bgMask[nIdx] === 1 || labels[nIdx] !== 0) continue;
        labels[nIdx] = nextLabel;
        queue[tail++] = nIdx;
      }
    }

    if (area < MIN_COMPONENT_AREA) {
      // too small to matter — fold back into background so it doesn't clutter the report
      for (let i = 0; i < width * height; i++) if (labels[i] === nextLabel) labels[i] = 0;
      nextLabel--;
      continue;
    }
    components.set(nextLabel, { area, minX, minY, maxX: maxX + 1, maxY: maxY + 1 });
  }

  return { labels, components };
}

function componentIdColor(id) {
  const hue = (id * 47) % 360;
  return hslToRgb(hue / 360, 0.65, 0.55);
}

function hslToRgb(h, s, l) {
  const k = (n) => (n + h * 12) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

async function runReport(sourcePath, outDir) {
  const image = await loadImage(sourcePath);
  const { width, height, data } = getImageData(image);
  const bgColor = sampleBackgroundColor(data, width, height);
  console.log(`Source: ${width}x${height}, sampled background rgb(${bgColor.map((v) => v.toFixed(0)).join(",")})`);

  const bgMask = floodFillBackground(data, width, height, bgColor);
  const { labels, components } = labelComponents(bgMask, width, height);

  await mkdir(outDir, { recursive: true });

  const vizCanvas = createCanvas(width, height);
  const vizCtx = vizCanvas.getContext("2d");
  const viz = vizCtx.createImageData(width, height);
  for (let i = 0; i < width * height; i++) {
    const label = labels[i];
    const [r, g, b] = label === 0 ? [0, 0, 0] : componentIdColor(label);
    viz.data[i * 4] = r;
    viz.data[i * 4 + 1] = g;
    viz.data[i * 4 + 2] = b;
    viz.data[i * 4 + 3] = 255;
  }
  vizCtx.putImageData(viz, 0, 0);
  const vizPath = path.join(outDir, "components.png");
  await writeFile(vizPath, vizCanvas.toBuffer("image/png"));

  const sorted = [...components.entries()].sort((a, b) => b[1].area - a[1].area);
  console.log(`\n${sorted.length} components (min area ${MIN_COMPONENT_AREA}px), largest first:\n`);
  for (const [id, c] of sorted) {
    const rect = {
      x: +(c.minX / width).toFixed(4),
      y: +(c.minY / height).toFixed(4),
      width: +((c.maxX - c.minX) / width).toFixed(4),
      height: +((c.maxY - c.minY) / height).toFixed(4),
    };
    console.log(
      `#${id}\tarea=${c.area}\tpx bbox=(${c.minX},${c.minY})-(${c.maxX},${c.maxY})\trect=${JSON.stringify(rect)}`
    );
  }
  console.log(`\nWrote ${vizPath} — open it beside ${sourcePath} to see which component id is which shape.`);
}

async function runExtract(sourcePath, mappingPath, outDir) {
  const image = await loadImage(sourcePath);
  const { width, height, data } = getImageData(image);
  const bgColor = sampleBackgroundColor(data, width, height);
  const bgMask = floodFillBackground(data, width, height, bgColor);
  const { labels, components } = labelComponents(bgMask, width, height);

  const mapping = JSON.parse(await readFile(mappingPath, "utf8"));
  await mkdir(outDir, { recursive: true });

  for (const [layerId, componentIds] of Object.entries(mapping)) {
    const idSet = new Set(componentIds);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const cid of componentIds) {
      const c = components.get(cid);
      if (!c) {
        console.warn(`  ! component #${cid} for "${layerId}" not found — skipping it`);
        continue;
      }
      minX = Math.min(minX, c.minX);
      minY = Math.min(minY, c.minY);
      maxX = Math.max(maxX, c.maxX);
      maxY = Math.max(maxY, c.maxY);
    }
    if (!Number.isFinite(minX)) {
      console.warn(`✗ ${layerId}: no valid components, skipped`);
      continue;
    }

    const cropW = maxX - minX;
    const cropH = maxY - minY;
    const cropCanvas = createCanvas(cropW, cropH);
    const cropCtx = cropCanvas.getContext("2d");
    const cropImage = cropCtx.createImageData(cropW, cropH);

    for (let y = 0; y < cropH; y++) {
      for (let x = 0; x < cropW; x++) {
        const srcIdx = (y + minY) * width + (x + minX);
        const destIdx = (y * cropW + x) * 4;
        const inLayer = idSet.has(labels[srcIdx]);
        cropImage.data[destIdx] = data[srcIdx * 4];
        cropImage.data[destIdx + 1] = data[srcIdx * 4 + 1];
        cropImage.data[destIdx + 2] = data[srcIdx * 4 + 2];
        cropImage.data[destIdx + 3] = inLayer ? 255 : 0;
      }
    }
    cropCtx.putImageData(cropImage, 0, 0);

    const outPath = path.join(outDir, `${layerId}.png`);
    await writeFile(outPath, cropCanvas.toBuffer("image/png"));

    const rect = {
      x: +(minX / width).toFixed(4),
      y: +(minY / height).toFixed(4),
      width: +(cropW / width).toFixed(4),
      height: +(cropH / height).toFixed(4),
    };
    console.log(`✓ ${layerId}: ${outPath}  rect=${JSON.stringify(rect)}`);
  }
}

/**
 * Local per-element background removal. `report`/`extract`'s whole-image
 * flood fill only works cleanly when the background stays reachable from
 * the border everywhere — in a busy composition where large shapes abut
 * each other, big pockets of background can end up walled off from the
 * border entirely, and the whole-image approach mislabels them as one
 * giant foreground blob. Cropping to one element's own small bounding
 * box first sidesteps that: the box's own edges are mostly clean
 * background, giving the flood fill a reliable seed *local* to that one
 * element, regardless of what's happening elsewhere in the painting.
 *
 * boxesPath JSON: { "fish": {"x":0.38,"y":0.9,"width":0.2,"height":0.1}, ... }
 * — the same fractional {x,y,width,height} shape as the artwork config's
 * `layers[].rect`, given generously (a little background padding on all
 * sides helps the local flood fill; it gets trimmed away automatically).
 */
/** 1 = transparent, 0 = keep. Chroma-based: for elements that read as "the one greyscale/white shape amid saturated color neighbors" (this painting's mosaic-patterned figures, and the white whale-form), no single border color to key off — but saturation itself cleanly separates them from every surrounding color. */
function saturationRemoveMask(data, width, height, maxSaturation) {
  const mask = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    const saturation = Math.max(r, g, b) - Math.min(r, g, b);
    mask[i] = saturation > maxSaturation ? 1 : 0;
  }
  return mask;
}

async function runExtractBoxes(sourcePath, boxesPath, outDir) {
  const image = await loadImage(sourcePath);
  const full = getImageData(image);
  const boxes = JSON.parse(await readFile(boxesPath, "utf8"));
  await mkdir(outDir, { recursive: true });

  for (const [layerId, spec] of Object.entries(boxes)) {
    const rect = spec.rect ?? spec;
    const px = Math.round(rect.x * full.width);
    const py = Math.round(rect.y * full.height);
    const pw = Math.round(rect.width * full.width);
    const ph = Math.round(rect.height * full.height);

    const boxData = new Uint8ClampedArray(pw * ph * 4);
    for (let y = 0; y < ph; y++) {
      for (let x = 0; x < pw; x++) {
        const srcIdx = ((y + py) * full.width + (x + px)) * 4;
        const destIdx = (y * pw + x) * 4;
        boxData[destIdx] = full.data[srcIdx];
        boxData[destIdx + 1] = full.data[srcIdx + 1];
        boxData[destIdx + 2] = full.data[srcIdx + 2];
        boxData[destIdx + 3] = 255;
      }
    }

    const bgMask =
      spec.mode === "keepLowSaturation"
        ? saturationRemoveMask(boxData, pw, ph, spec.maxSaturation ?? 40)
        : floodFillBackground(boxData, pw, ph, sampleBackgroundColor(boxData, pw, ph));

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let y = 0; y < ph; y++) {
      for (let x = 0; x < pw; x++) {
        if (bgMask[y * pw + x] === 1) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    if (!Number.isFinite(minX)) {
      console.warn(`✗ ${layerId}: nothing but background found in this box — widen it or check the rect`);
      continue;
    }
    maxX += 1;
    maxY += 1;

    const tightW = maxX - minX;
    const tightH = maxY - minY;
    const outCanvas = createCanvas(tightW, tightH);
    const outCtx = outCanvas.getContext("2d");
    const outImage = outCtx.createImageData(tightW, tightH);
    for (let y = 0; y < tightH; y++) {
      for (let x = 0; x < tightW; x++) {
        const boxIdx = (y + minY) * pw + (x + minX);
        const destIdx = (y * tightW + x) * 4;
        outImage.data[destIdx] = boxData[boxIdx * 4];
        outImage.data[destIdx + 1] = boxData[boxIdx * 4 + 1];
        outImage.data[destIdx + 2] = boxData[boxIdx * 4 + 2];
        outImage.data[destIdx + 3] = bgMask[boxIdx] === 1 ? 0 : 255;
      }
    }
    outCtx.putImageData(outImage, 0, 0);

    const outPath = path.join(outDir, `${layerId}.png`);
    await writeFile(outPath, outCanvas.toBuffer("image/png"));

    const tightRect = {
      x: +((px + minX) / full.width).toFixed(4),
      y: +((py + minY) / full.height).toFixed(4),
      width: +(tightW / full.width).toFixed(4),
      height: +(tightH / full.height).toFixed(4),
    };
    console.log(`✓ ${layerId}: ${outPath}  rect=${JSON.stringify(tightRect)}`);
  }
}

const [, , mode, ...rest] = process.argv;

if (mode === "report") {
  const [sourcePath, outDir = "layer-report"] = rest;
  if (!sourcePath) {
    console.error("Usage: node scripts/extract-layers.mjs report <source.jpg> [outDir]");
    process.exit(1);
  }
  await runReport(sourcePath, outDir);
} else if (mode === "extract") {
  const [sourcePath, mappingPath, outDir] = rest;
  if (!sourcePath || !mappingPath || !outDir) {
    console.error("Usage: node scripts/extract-layers.mjs extract <source.jpg> <mapping.json> <outDir>");
    process.exit(1);
  }
  await runExtract(sourcePath, mappingPath, outDir);
} else if (mode === "boxes") {
  const [sourcePath, boxesPath, outDir] = rest;
  if (!sourcePath || !boxesPath || !outDir) {
    console.error("Usage: node scripts/extract-layers.mjs boxes <source.jpg> <boxes.json> <outDir>");
    process.exit(1);
  }
  await runExtractBoxes(sourcePath, boxesPath, outDir);
} else {
  console.error(
    "Usage:\n  node scripts/extract-layers.mjs report <source.jpg> [outDir]\n  node scripts/extract-layers.mjs extract <source.jpg> <mapping.json> <outDir>\n  node scripts/extract-layers.mjs boxes <source.jpg> <boxes.json> <outDir>"
  );
  process.exit(1);
}
