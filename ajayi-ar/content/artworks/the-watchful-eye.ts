import type { ArtworkConfig } from "@/lib/types";

/**
 * Real artwork. Metadata sourced directly from the artist's own page
 * (https://planet-b.tech/artworks/the-watchful-eye) — not a guess.
 *
 * Source photo cropped to just inside the outer wood frame (same
 * approach as aje — see public/artworks/the-watchful-eye/source-full.jpg
 * for the original uncropped shot).
 *
 * This is a photographed 3D found-object assemblage, not a flat
 * painting — flagged before starting that cutting pieces out and
 * animating them independently risks looking like cardboard cutouts
 * sliding against their own baked-in shadows, and that this composition
 * is dense enough (a busy collage almost wall-to-wall) that
 * scripts/extract-layers.mjs's whole-image `report` mode can't separate
 * it at all (it merges into two giant blobs — see
 * content/artworks/the-watchful-eye.boxes.json's git history/comments
 * for why `boxes` mode was used instead). Artist direction: same
 * energetic, independently-moving treatment as `aje` anyway.
 *
 * Two real extraction difficulties worth flagging honestly:
 *  - The top-right quadrant (mouse, led-circuit-board, the yellow/red
 *    bottle-cap flower near them) sits against patterned fabric, not
 *    the blue mat — there's no single clean background to key off, so
 *    those three layers carry more visible fabric noise at their edges
 *    than the ones sitting on the blue mat (watch, the bottle-cap ring,
 *    the LED strip board), which came out clean.
 *  - The watch and mouse are themselves mostly grey/silver/white, which
 *    is why they use `mode: "keepLowSaturation"` (matching aje's
 *    patterned figures) instead of background removal — a plain
 *    background-color removal treated the whole pale watch as
 *    background and erased almost all of it on the first attempt.
 *
 * Also fixed a real performance bug in scripts/extract-layers.mjs while
 * processing this photo: pruning a too-small stray component rescanned
 * the *entire* image every time, which is fine for aje's clean flat
 * painting (few stray components) but hung for minutes on this much
 * more textured photo (thousands of them). Now resets only that
 * component's own pixels.
 */
export const theWatchfulEye: ArtworkConfig = {
  id: "the-watchful-eye",
  slug: "the-watchful-eye",
  title: "The Watchful Eye",
  artist: "Elijah Snoz (Ajayi VII)",
  year: 2026,
  medium: "Discarded items assemblage",
  dimensions: "61 × 61 cm",
  description:
    "An eye crafted from waste materials and electronic components, representing environmental awareness and humanity's relationship with the natural world.",
  statement:
    "An eye created from discarded plastics, electronic components and reclaimed materials to represent awareness and humanity's relationship with nature. The damaged watch within the piece symbolises the urgency of addressing environmental issues before it is too late — transforming waste into art to show that discarded materials still have value and can be renewed.",
  image: {
    src: "/artworks/the-watchful-eye/source.png",
    width: 2454,
    height: 2431,
  },
  target: {
    mindFile: "/targets/the-watchful-eye.mind",
  },
  layers: [
    {
      id: "eye-pupil",
      kind: "sprite",
      label: "The Eye",
      asset: "/layers/the-watchful-eye/eye-pupil.png",
      rect: { x: 0.2152, y: 0.1802, width: 0.1548, height: 0.1501 },
      depth: 0.012,
      animation: [
        { type: "glowFlicker", minOpacity: 0.45, maxOpacity: 1, periodSeconds: 3.5, jitter: 0.3 },
        { type: "breathe", scaleAmplitude: 0.04, periodSeconds: 3.5 },
      ],
      reducedMotion: { type: "still" },
      meaning: "The eye — awareness and consciousness. Nothing here goes unwatched.",
    },
    {
      id: "watch",
      kind: "sprite",
      label: "The Damaged Watch",
      asset: "/layers/the-watchful-eye/watch.png",
      rect: { x: 0.0, y: 0.8001, width: 0.2001, height: 0.1999 },
      depth: 0.011,
      animation: [
        { type: "sway", amplitudeDeg: 5, periodSeconds: 3 },
        { type: "pulse", minOpacity: 0.55, maxOpacity: 1, periodSeconds: 3 },
      ],
      reducedMotion: { type: "still" },
      meaning: "The damaged watch — the urgency of addressing environmental issues before it is too late.",
    },
    {
      id: "mouse",
      kind: "sprite",
      label: "Discarded Mouse",
      asset: "/layers/the-watchful-eye/mouse.png",
      rect: { x: 0.78, y: 0.13, width: 0.22, height: 0.2201 },
      depth: 0.009,
      animation: [
        { type: "sway", amplitudeDeg: 6, periodSeconds: 3.4 },
        { type: "bob", amplitudeMeters: 0.01, periodSeconds: 3.4 },
      ],
      reducedMotion: { type: "still" },
      meaning: "A discarded mouse — the everyday technology we throw away without a second thought.",
    },
    {
      id: "led-circuit-board",
      kind: "sprite",
      label: "Circuit Board",
      asset: "/layers/the-watchful-eye/led-circuit-board.png",
      rect: { x: 0.6601, y: 0.13, width: 0.1601, height: 0.19 },
      depth: 0.009,
      animation: { type: "glowFlicker", minOpacity: 0.4, maxOpacity: 1, periodSeconds: 2.8, jitter: 0.35 },
      reducedMotion: { type: "still" },
      meaning: "A salvaged circuit board — the discarded electronics this whole piece is built from.",
    },
    {
      id: "pinwheel-yellow-green",
      kind: "sprite",
      label: "Bottle-Cap Flower",
      asset: "/layers/the-watchful-eye/pinwheel-yellow-green.png",
      rect: { x: 0.5799, y: 0.3102, width: 0.1402, height: 0.13 },
      depth: 0.009,
      animation: { type: "breathe", scaleAmplitude: 0.04, periodSeconds: 4 },
      reducedMotion: { type: "still" },
      meaning: "Bottle caps arranged into a flower — waste renewed into something that grows.",
    },
    {
      id: "pinwheel-red-yellow",
      kind: "sprite",
      label: "Bottle-Cap Flower",
      asset: "/layers/the-watchful-eye/pinwheel-red-yellow.png",
      rect: { x: 0.8301, y: 0.3102, width: 0.1597, height: 0.1399 },
      depth: 0.009,
      animation: { type: "breathe", scaleAmplitude: 0.04, periodSeconds: 4.6 },
      reducedMotion: { type: "still" },
      meaning: "Bottle caps arranged into a flower — waste renewed into something that grows.",
    },
    {
      id: "pinwheel-blue",
      kind: "sprite",
      label: "Bottle-Cap Flowers",
      asset: "/layers/the-watchful-eye/pinwheel-blue.png",
      rect: { x: 0.8598, y: 0.4401, width: 0.1385, height: 0.1399 },
      depth: 0.008,
      animation: { type: "breathe", scaleAmplitude: 0.035, periodSeconds: 5 },
      reducedMotion: { type: "still" },
      meaning: "More bottle caps, arranged into flowers — a small garden made of what was thrown away.",
    },
    {
      id: "chain",
      kind: "sprite",
      label: "Salvaged Chain",
      asset: "/layers/the-watchful-eye/chain.png",
      rect: { x: 0.6601, y: 0.3801, width: 0.28, height: 0.1999 },
      depth: 0.008,
      animation: { type: "sway", amplitudeDeg: 4, periodSeconds: 3.8 },
      reducedMotion: { type: "still" },
      meaning: "A length of salvaged chain — what once held things together, repurposed.",
    },
    {
      id: "yellow-block",
      kind: "sprite",
      label: "Salvaged Toy Engine",
      asset: "/layers/the-watchful-eye/yellow-block.png",
      rect: { x: 0.7999, y: 0.4599, width: 0.198, height: 0.1399 },
      depth: 0.008,
      animation: [
        { type: "breathe", scaleAmplitude: 0.03, periodSeconds: 4.4 },
        { type: "sway", amplitudeDeg: 3, periodSeconds: 4.4 },
      ],
      reducedMotion: { type: "still" },
      meaning: "A salvaged toy engine — machinery once discarded, now built into something whole.",
    },
    {
      id: "pinwheel-pink",
      kind: "sprite",
      label: "Bottle-Cap Flower",
      asset: "/layers/the-watchful-eye/pinwheel-pink.png",
      rect: { x: 0.7999, y: 0.5599, width: 0.1736, height: 0.1802 },
      depth: 0.008,
      animation: { type: "breathe", scaleAmplitude: 0.04, periodSeconds: 4.2 },
      reducedMotion: { type: "still" },
      meaning: "Bottle caps arranged into a flower — waste renewed into something that grows.",
    },
    {
      id: "bottle-cap-ring",
      kind: "sprite",
      label: "Bottle-Cap Ring",
      asset: "/layers/the-watchful-eye/bottle-cap-ring.png",
      rect: { x: 0.2001, y: 0.5401, width: 0.4401, height: 0.3599 },
      depth: 0.006,
      animation: [
        { type: "breathe", scaleAmplitude: 0.025, periodSeconds: 5.5 },
        { type: "glowFlicker", minOpacity: 0.6, maxOpacity: 1, periodSeconds: 3, jitter: 0.2 },
      ],
      reducedMotion: { type: "still" },
      meaning: "A ring of bottle caps circling a lit disc — a small sun built from what was thrown away.",
    },
    {
      id: "led-strip-board",
      kind: "sprite",
      label: "Signed Circuit Board",
      asset: "/layers/the-watchful-eye/led-strip-board.png",
      rect: { x: 0.5, y: 0.7199, width: 0.4943, height: 0.2398 },
      depth: 0.01,
      animation: { type: "glowFlicker", minOpacity: 0.5, maxOpacity: 1, periodSeconds: 2.6, jitter: 0.3 },
      reducedMotion: { type: "still" },
      meaning: "The circuit board signed \"Ajayi VII\" — the maker's own hand, wired into the piece.",
    },
    {
      id: "spiral-symbol",
      kind: "sprite",
      label: "Spiral",
      asset: "/layers/the-watchful-eye/spiral-symbol.png",
      rect: { x: 0.0073, y: 0.0202, width: 0.1426, height: 0.13 },
      depth: 0.007,
      animation: { type: "breathe", scaleAmplitude: 0.03, periodSeconds: 4.2 },
      reducedMotion: { type: "still" },
      meaning: "A hand-drawn spiral — growth and renewal, a cycle instead of a straight line.",
    },
  ],
  audio: {
    enabled: false, // TODO: flip to true once /audio/the-watchful-eye-ambient.mp3 exists
    defaultOn: false,
    source: "/audio/the-watchful-eye-ambient.mp3",
    volume: 0.5,
    loop: true,
  },
  ar: {
    physicalWidthMeters: 0.61,
    maxTrack: 1,
    filterMinCF: 0.0001,
    filterBeta: 0.001,
    missTolerance: 5,
    warmupTolerance: 2,
  },
};
