#!/usr/bin/env node
/**
 * Compiles a source photo of a physical painting into a MindAR .mind
 * target file — the feature-point data MindAR matches the live camera
 * feed against. Runs entirely in Node (no browser needed) using mind-ar's
 * own OfflineCompiler, which is the same compiler their hosted web tool
 * (https://hiukim.github.io/mind-ar-js-doc/tools/compile/) runs client-side.
 *
 * Usage:
 *   node scripts/compile-target.mjs <source-image> <output.mind>
 *   npm run compile-target -- images/aje-source.jpg public/targets/aje.mind
 *
 * Tips for a reliable target image (matters more than any code here):
 *   - Use the flattest, most evenly lit photo of the physical painting you have.
 *   - High texture/detail helps tracking; avoid motion blur or glare.
 *   - Square-on shot (not at an angle) — MindAR estimates the pose from this.
 */
import { loadImage } from "canvas";
import { writeFile } from "node:fs/promises";
import { OfflineCompiler } from "mind-ar/src/image-target/offline-compiler.js";

const [, , inputPath, outputPath] = process.argv;

if (!inputPath || !outputPath) {
  console.error("Usage: node scripts/compile-target.mjs <source-image> <output.mind>");
  process.exit(1);
}

const image = await loadImage(inputPath);
console.log(`Loaded ${inputPath} (${image.width}x${image.height})`);

const compiler = new OfflineCompiler();
await compiler.compileImageTargets([image], (percent) => {
  process.stdout.write(`\rCompiling... ${percent.toFixed(1)}%`);
});
process.stdout.write("\n");

const buffer = compiler.exportData();
await writeFile(outputPath, buffer);
console.log(`Wrote ${outputPath} (${buffer.length} bytes)`);
