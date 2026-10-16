# Validation

All required commands passed: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run ci`. The final CI run used Node 20.20.2 and passed 194 tests in 34 files, including design-token synchronization.

The browser check used frozen real Singapore responses and verified independent selectors/retrieval, a single-lap view, the sourced T3 window, two speed/four pedal series, a real dark/mobile PNG download, desktop/mobile rendering, no page errors and no horizontal overflow. Run `node scripts/check-lap-comparison-browser.mjs` with Vite running to repeat it.

The generator validates all eight v2 publication bundles, SVG XML and native PNG output. A separate check of saved files confirmed 40 SVGs and 40 PNGs, identical A/B distance/speed axes and image dimensions in all four variants, exact 3x PNG resolution, and every raw SHA-256 hash.

Recorded endpoints and complete independent FIA per-lap/sector timing verification remain unavailable. The figures preserve gaps and approximate distance. Claims of uninterrupted coverage, exact braking-position differences, validated corner time losses or proven car instability remain unsupported; see the Greek report and provenance manifest.
