import type { NextConfig } from "next";
import path from "path";

// Deployed as its own Vercel project and stitched into elijahsnoz.me via
// root-level rewrites (see ../vercel.json), the same "multi-zone" pattern
// used by ai-music-lab. AJAYI_AR_ASSET_PREFIX must be this app's own
// deployment URL so its /_next/* assets load directly from that origin
// instead of colliding with ai-music-lab's /_next/* rewrite on the root
// domain.
const assetPrefix = process.env.AJAYI_AR_ASSET_PREFIX || undefined;

const nextConfig: NextConfig = {
  assetPrefix,
  turbopack: {
    root: path.join(__dirname),
    resolveAlias: {
      // mind-ar's dist bundle statically references require("fs") inside a
      // dead (tfjs Node-only) code path — see lib/empty-fs.js.
      fs: { browser: "./lib/empty-fs.js" },
    },
  },
};

export default nextConfig;
