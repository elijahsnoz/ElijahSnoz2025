import type { ArtworkConfig } from "@/lib/types";

/**
 * Real artwork. Source photo cropped to just the canvas (frame and
 * gallery wall excluded — see public/artworks/aje/source-gallery-full.png
 * for the original installation shot). All 26 sprite layers below were
 * cut automatically by scripts/extract-layers.mjs from that source;
 * content/artworks/aje.boxes.json is the input that produced them.
 *
 * Animation amplitudes are deliberately large — per artist direction,
 * this should read as "clearly, energetically alive," not the barely-
 * perceptible motion a first pass used. Most layers combine two
 * behaviors (e.g. sway + bob) for richer motion than any single
 * behavior gives alone; see lib/scene/behaviors.ts.
 *
 * `meaning` on each layer is a first-draft interpretive caption shown
 * in a popup when a visitor taps that symbol (see SymbolCaption.tsx) —
 * written from the painting's visual content and the title "Ajé," not
 * from the artist's own explanation of each symbol. Elijah should treat
 * these as a starting point to edit into his own words, especially
 * given how much specific cultural weight "Ajé" carries in Yoruba
 * cosmology (a term for feminine spiritual power/àṣẹ, distinct from its
 * English-adjacent misreading as "witch," and also a name associated
 * with wealth/commerce) — that reading is his to confirm, not mine to
 * assert.
 *
 * Known limitation: a few boxes for elements packed tightly against
 * their neighbors (figure-right/plants-right, orange-bar/figure-left)
 * pick up a faint trace of the neighboring shape at their edges —
 * more noticeable now that motion is larger. Worth a manual touch-up
 * if it reads as a visible ghost on a real device.
 *
 * Pending: ambient audio file still not supplied.
 */
export const aje: ArtworkConfig = {
  id: "aje",
  slug: "aje",
  title: "Ajé",
  artist: "Elijah Snoz (Ajayi VII)",
  year: 2026,
  medium: "Acrylic on canvas",
  dimensions: "3 × 4 ft (91 × 122 cm)",
  description:
    "A deep-blue cosmology of sun, rain and stars, land and water, where a central winged form releases a column of water held between two patterned figures — fish, boat and plant life gathered below.",
  statement:
    "The painting exists in two dimensions: physical and digital. What you see on the wall has always been alive — this is only the first time it has been allowed to move.",
  image: {
    src: "/artworks/aje/source.png",
    width: 837,
    height: 966,
  },
  target: {
    mindFile: "/targets/aje.mind",
  },
  layers: [
    // --- water, the major animated element ---
    {
      id: "central-water",
      kind: "water",
      label: "Central Water Column",
      rect: { x: 0.4, y: 0.44, width: 0.16, height: 0.46 },
      depth: 0.014,
      color: [0.42, 0.48, 0.86],
      waveAmplitude: 0.03,
      waveSpeed: 0.7,
      shimmerOpacity: 0.65,
      meaning: "The water that falls without ceasing — the source everything else in the painting gathers around.",
    },
    {
      id: "rain",
      kind: "particles-rain",
      label: "Rain",
      rect: { x: 0.09, y: 0.1, width: 0.2, height: 0.14 },
      depth: 0.013,
      count: 36,
      color: [0.7, 0.82, 1],
      size: 0.004,
      speed: 0.9,
      opacity: 0.55,
    },

    // --- the central winged form ("whale") ---
    {
      id: "whale-form",
      kind: "sprite",
      label: "Central Winged Form",
      asset: "/layers/aje/whale-form.png",
      rect: { x: 0.2903, y: 0.2795, width: 0.4397, height: 0.1698 },
      depth: 0.006,
      animation: [
        { type: "breathe", scaleAmplitude: 0.045, periodSeconds: 3.5 },
        { type: "sway", amplitudeDeg: 3, periodSeconds: 4.2 },
      ],
      reducedMotion: { type: "still" },
      meaning: "The great winged form at the center — the source from which the water is set free.",
    },

    // --- water creatures & vessels ---
    {
      id: "fish",
      kind: "sprite",
      label: "Fish",
      asset: "/layers/aje/fish.png",
      rect: { x: 0.3596, y: 0.8602, width: 0.2198, height: 0.1304 },
      depth: 0.011,
      animation: [
        { type: "swim", distanceMeters: 0.045, periodSeconds: 3, wagDeg: 14 },
        { type: "bob", amplitudeMeters: 0.012, periodSeconds: 2.4 },
      ],
      reducedMotion: { type: "still" },
      meaning: "The fish — abundance moving quietly beneath the surface.",
    },
    {
      id: "boat",
      kind: "sprite",
      label: "Sailboat",
      asset: "/layers/aje/boat.png",
      rect: { x: 0.0, y: 0.7505, width: 0.1995, height: 0.1998 },
      depth: 0.011,
      animation: [
        { type: "bob", amplitudeMeters: 0.022, periodSeconds: 2.6 },
        { type: "sway", amplitudeDeg: 4, periodSeconds: 2.6 },
      ],
      reducedMotion: { type: "still" },
      meaning: "The boat — a journey still being made, carried by what it floats on.",
    },
    {
      id: "vase",
      kind: "sprite",
      label: "Vessel",
      asset: "/layers/aje/vase.png",
      rect: { x: 0.8196, y: 0.7826, width: 0.1601, height: 0.1967 },
      depth: 0.007,
      animation: { type: "breathe", scaleAmplitude: 0.03, periodSeconds: 4.5 },
      reducedMotion: { type: "still" },
      meaning: "A vessel on the shore — a place to hold what the water leaves behind.",
    },

    // --- sky ---
    {
      id: "sun",
      kind: "sprite",
      label: "Sun",
      asset: "/layers/aje/sun.png",
      rect: { x: 0.0, y: 0.0052, width: 0.19, height: 0.1553 },
      depth: 0.009,
      animation: [
        { type: "pulse", minOpacity: 0.55, maxOpacity: 1, periodSeconds: 2.5 },
        { type: "breathe", scaleAmplitude: 0.05, periodSeconds: 2.5 },
      ],
      reducedMotion: { type: "still" },
      meaning: "The sun — life, warmth, the presence that never truly leaves the sky.",
    },
    {
      id: "cloud",
      kind: "sprite",
      label: "Cloud",
      asset: "/layers/aje/cloud.png",
      rect: { x: 0.08, y: 0.0, width: 0.27, height: 0.1304 },
      depth: 0.009,
      animation: { type: "drift", distanceMeters: 0.06, periodSeconds: 7, axis: "x" },
      reducedMotion: { type: "still" },
      meaning: "The cloud — memory of rain, the sky holding what it hasn't yet released.",
    },
    {
      id: "sky-dot",
      kind: "sprite",
      label: "Sky Orb",
      asset: "/layers/aje/sky-dot.png",
      rect: { x: 0.2903, y: 0.0083, width: 0.0896, height: 0.0714 },
      depth: 0.009,
      animation: { type: "pulse", minOpacity: 0.5, maxOpacity: 1, periodSeconds: 3 },
      reducedMotion: { type: "still" },
      meaning: "A small orb of fire — a distant sign, or an ember carried on the wind.",
    },
    {
      id: "star",
      kind: "sprite",
      label: "Star",
      asset: "/layers/aje/star.png",
      rect: { x: 0.5305, y: 0.0, width: 0.0956, height: 0.1097 },
      depth: 0.009,
      animation: [
        { type: "glowFlicker", minOpacity: 0.4, maxOpacity: 1, periodSeconds: 2.5, jitter: 0.3 },
        { type: "sway", amplitudeDeg: 6, periodSeconds: 3 },
      ],
      reducedMotion: { type: "still" },
      meaning: "The star — a fixed point to steer by, watching from far above.",
    },
    {
      id: "triangle",
      kind: "sprite",
      label: "Triangle",
      asset: "/layers/aje/triangle.png",
      rect: { x: 0.8399, y: 0.001, width: 0.141, height: 0.119 },
      depth: 0.008,
      animation: { type: "breathe", scaleAmplitude: 0.04, periodSeconds: 3.6 },
      reducedMotion: { type: "still" },
      meaning: "The triangle — ascension and balance, a marker set between earth and sky.",
    },
    {
      id: "green-circle-top",
      kind: "sprite",
      label: "Circle",
      asset: "/layers/aje/green-circle-top.png",
      rect: { x: 0.865, y: 0.0797, width: 0.1051, height: 0.1097 },
      depth: 0.008,
      animation: { type: "pulse", minOpacity: 0.5, maxOpacity: 1, periodSeconds: 3.2 },
      reducedMotion: { type: "still" },
      meaning: "A perfect circle — wholeness, the world returning always to itself.",
    },
    {
      id: "grey-sphere",
      kind: "sprite",
      label: "Woven Sphere",
      asset: "/layers/aje/grey-sphere.png",
      rect: { x: 0.5699, y: 0.1004, width: 0.1565, height: 0.1698 },
      depth: 0.008,
      animation: [
        { type: "breathe", scaleAmplitude: 0.035, periodSeconds: 4 },
        { type: "sway", amplitudeDeg: 3, periodSeconds: 5 },
      ],
      reducedMotion: { type: "still" },
      meaning: "A woven sphere — the world as a thing made by hand, thread over thread.",
    },

    // --- symbolic figures & marks ---
    {
      id: "eye",
      kind: "sprite",
      label: "Eye",
      asset: "/layers/aje/eye.png",
      rect: { x: 0.0024, y: 0.177, width: 0.0621, height: 0.0735 },
      depth: 0.008,
      animation: { type: "glowFlicker", minOpacity: 0.35, maxOpacity: 1, periodSeconds: 3.5, jitter: 0.25 },
      reducedMotion: { type: "still" },
      meaning: "The eye — watchfulness. Nothing here goes unseen.",
    },
    {
      id: "bird",
      kind: "sprite",
      label: "Bird",
      asset: "/layers/aje/bird.png",
      rect: { x: 0.0597, y: 0.1097, width: 0.1697, height: 0.1097 },
      depth: 0.008,
      animation: [
        { type: "sway", amplitudeDeg: 10, periodSeconds: 2.8 },
        { type: "bob", amplitudeMeters: 0.01, periodSeconds: 2.8 },
      ],
      reducedMotion: { type: "still" },
      meaning: "The bird — a messenger moving freely between the visible and the unseen.",
    },
    {
      id: "teardrop",
      kind: "sprite",
      label: "Teardrop",
      asset: "/layers/aje/teardrop.png",
      rect: { x: 0.0072, y: 0.2153, width: 0.0824, height: 0.1253 },
      depth: 0.008,
      animation: { type: "bob", amplitudeMeters: 0.018, periodSeconds: 3.2 },
      reducedMotion: { type: "still" },
      meaning: "A single tear — grief held gently, without needing to fall.",
    },
    {
      id: "figure-vessel-bearer",
      kind: "sprite",
      label: "Seated Figure with Vessel",
      asset: "/layers/aje/figure-vessel-bearer.png",
      rect: { x: 0.3596, y: 0.1201, width: 0.2103, height: 0.2101 },
      depth: 0.005,
      animation: [
        { type: "sway", amplitudeDeg: 5, periodSeconds: 4.5 },
        { type: "breathe", scaleAmplitude: 0.02, periodSeconds: 4.5 },
      ],
      reducedMotion: { type: "still" },
      meaning: "A seated figure holding a vessel — keeper of what nourishes.",
    },
    {
      id: "figure-left",
      kind: "sprite",
      label: "Patterned Figure (left)",
      asset: "/layers/aje/figure-left.png",
      rect: { x: 0.0203, y: 0.3002, width: 0.2103, height: 0.2505 },
      depth: 0.005,
      animation: [
        { type: "sway", amplitudeDeg: 6, periodSeconds: 4 },
        { type: "bob", amplitudeMeters: 0.008, periodSeconds: 4 },
      ],
      reducedMotion: { type: "still" },
      meaning: "A patterned figure drawing the water toward the land — a guardian of the flow.",
    },
    {
      id: "figure-right",
      kind: "sprite",
      label: "Patterned Figure (right)",
      asset: "/layers/aje/figure-right.png",
      rect: { x: 0.7204, y: 0.3095, width: 0.2401, height: 0.3199 },
      depth: 0.005,
      animation: [
        { type: "sway", amplitudeDeg: 6, periodSeconds: 3.6 },
        { type: "bob", amplitudeMeters: 0.008, periodSeconds: 3.6 },
      ],
      reducedMotion: { type: "still" },
      meaning: "A patterned figure receiving the water in an open hand — one who accepts what is given.",
    },

    // --- plants ---
    {
      id: "plants-left",
      kind: "sprite",
      label: "Plants (left)",
      asset: "/layers/aje/plants-left.png",
      rect: { x: 0.2401, y: 0.53, width: 0.1004, height: 0.1605 },
      depth: 0.007,
      animation: { type: "sway", amplitudeDeg: 12, periodSeconds: 2.6 },
      reducedMotion: { type: "still" },
      meaning: "Green life taking root where the water reaches — growth as proof of care.",
    },
    {
      id: "plants-right",
      kind: "sprite",
      label: "Plants (right)",
      asset: "/layers/aje/plants-right.png",
      rect: { x: 0.5998, y: 0.5, width: 0.1004, height: 0.1801 },
      depth: 0.007,
      animation: { type: "sway", amplitudeDeg: 12, periodSeconds: 2.9 },
      reducedMotion: { type: "still" },
      meaning: "Green life taking root where the water reaches — growth as proof of care.",
    },

    // --- abstract land forms: big, slow breathing, lowest depth (furthest back) ---
    {
      id: "land-brown-left",
      kind: "sprite",
      label: "Land Form (brown, left)",
      asset: "/layers/aje/land-brown-left.png",
      rect: { x: 0.1004, y: 0.03, width: 0.2198, height: 0.3199 },
      depth: 0.002,
      animation: { type: "breathe", scaleAmplitude: 0.025, periodSeconds: 6 },
      reducedMotion: { type: "still" },
      meaning: "Land taking shape from a sea of blue — the ground beneath every story here.",
    },
    {
      id: "land-blue-center",
      kind: "sprite",
      label: "Land Form (blue, center)",
      asset: "/layers/aje/land-blue-center.png",
      rect: { x: 0.27, y: 0.0, width: 0.2605, height: 0.3499 },
      depth: 0.002,
      animation: { type: "breathe", scaleAmplitude: 0.025, periodSeconds: 7 },
      reducedMotion: { type: "still" },
      meaning: "Where land and water share a color — the line between them is not as fixed as it looks.",
    },
    {
      id: "land-green-center",
      kind: "sprite",
      label: "Land Form (green, center)",
      asset: "/layers/aje/land-green-center.png",
      rect: { x: 0.4504, y: 0.0, width: 0.2306, height: 0.3302 },
      depth: 0.003,
      animation: { type: "breathe", scaleAmplitude: 0.025, periodSeconds: 6.5 },
      reducedMotion: { type: "still" },
      meaning: "Fertile ground beside the water's edge — where the green things begin.",
    },
    {
      id: "land-brown-right",
      kind: "sprite",
      label: "Land Form (brown, right)",
      asset: "/layers/aje/land-brown-right.png",
      rect: { x: 0.6201, y: 0.0, width: 0.3596, height: 0.3302 },
      depth: 0.001,
      animation: { type: "breathe", scaleAmplitude: 0.025, periodSeconds: 5.5 },
      reducedMotion: { type: "still" },
      meaning: "Land taking shape from a sea of blue — the ground beneath every story here.",
    },
    {
      id: "land-red-ribbon",
      kind: "sprite",
      label: "Land Form (red ribbon)",
      asset: "/layers/aje/land-red-ribbon.png",
      rect: { x: 0.6201, y: 0.2101, width: 0.3704, height: 0.1905 },
      depth: 0.004,
      animation: [
        { type: "breathe", scaleAmplitude: 0.03, periodSeconds: 5 },
        { type: "drift", distanceMeters: 0.02, periodSeconds: 5, axis: "x" },
      ],
      reducedMotion: { type: "still" },
      meaning: "A red current through the land — memory, or a wound the earth still carries.",
    },
    {
      id: "orange-bar",
      kind: "sprite",
      label: "Land Form (orange bar)",
      asset: "/layers/aje/orange-bar.png",
      rect: { x: 0.0, y: 0.3499, width: 0.1004, height: 0.3002 },
      depth: 0.002,
      animation: { type: "breathe", scaleAmplitude: 0.025, periodSeconds: 6.8 },
      reducedMotion: { type: "still" },
      meaning: "A standing form of warm color — a marker planted in the ground, holding its place.",
    },
    {
      id: "orange-circle",
      kind: "sprite",
      label: "Land Form (orange circle)",
      asset: "/layers/aje/orange-circle.png",
      rect: { x: 0.0, y: 0.5797, width: 0.1004, height: 0.1304 },
      depth: 0.003,
      animation: { type: "pulse", minOpacity: 0.55, maxOpacity: 1, periodSeconds: 3.4 },
      reducedMotion: { type: "still" },
      meaning: "A small sun brought down to earth — warmth kept close, within reach.",
    },
  ],
  audio: {
    // TODO: flip to true once /audio/aje-ambient.mp3 actually exists — until
    // then this correctly hides the Sound control rather than showing one
    // that can never turn on.
    enabled: false,
    defaultOn: false,
    source: "/audio/aje-ambient.mp3",
    volume: 0.5,
    loop: true,
  },
  ar: {
    physicalWidthMeters: 0.9144, // 3 ft
    maxTrack: 1,
    filterMinCF: 0.0001,
    filterBeta: 0.001,
    missTolerance: 5,
    warmupTolerance: 2,
  },
};
