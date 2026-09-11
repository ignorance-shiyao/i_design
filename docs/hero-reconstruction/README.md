# TDesign-inspired documentation refresh

## Implemented

- New homepage hierarchy: sculptural hero, resource navigation, platform entries, live component gallery, repository setup.
- Generated reference image integrated at `public/images/component-sculpture.png`. It is a **static raster image**, not a 3D canvas.
- Flat documentation surfaces, compact header, searchable document navigation and component catalogue.
- Existing framework routes, theme controls and component implementations remain available.

## Reference and provenance

- Layout reference: https://tdesign.tencent.com/ (observed 2026-09-11). No TDesign logo, code or proprietary imagery was copied.
- Reconstruction workflow: https://github.com/img2threejs/img2threejs (v2.0.0 checkout).
- Image: generated with ChatGPT image generation for this task. Prompt intent: a pale studio architectural sculpture composed of a porcelain portal, inclined translucent blue torus, staggered plinths, ascending chart bars, UI panel, staircase and spheres; empty left-hand area for live headings; no text or logos. Full prompt is recorded in `prompt.txt`.

## Validation and limitations

`npm run build` passes, including Vue/TypeScript checks. The image is served using Vite BASE_URL for GitHub Pages subdirectory compatibility.

Browser screenshot checks are **not complete**. The available cloud browser rejects localhost with `ERR_BLOCKED_BY_CLIENT`; the local Chromium download timed out. Desktop/mobile/dark-theme layouts and document filtering still require browser verification.

## img2threejs reconstruction status

Image analysis, suitability and reference admission are recorded. Local evidence search and an initial assessment are saved. `state.json` records the remaining stages; no build or fidelity gate has been marked passed.

There is no generated Three.js factory yet. The skill requires strict spec validation before geometry generation and rendered comparisons before advancing each pass. Do not label this branch as image-to-3D complete. Next: finish the detail inventory and sculpt spec; use an accessible browser preview for blockout/structure/form/material/light/interaction reviews; only replace the static hero once these gates pass. Keep the raster as the loading and WebGL-failure fallback.
