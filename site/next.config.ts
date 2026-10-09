import path from 'node:path';
import type { NextConfig } from 'next';

// Static export: `next build` writes plain HTML/CSS/JS to out/. Videos and images are plain files in public/.
const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: { root: path.resolve('.') },   // the repo root has its own lockfile; this app's root is site/
};

export default config;
