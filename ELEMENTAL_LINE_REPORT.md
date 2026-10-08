# Elemental line gem integration

Assets are in public/assets/gems/ (asset/gems/ is absent). All twelve exact-case filenames are present, distinct by SHA-256, transparent PNGs at 1254 x 1254. Source files are not resized, rotated or renamed.

| Element | LINE_HORIZONTAL | LINE_VERTICAL |
| --- | --- | --- |
| WOOD | GEM_WOOD_LINE_H.png | GEM_WOOD_LINE_V.png |
| FIRE | GEM_FIRE_LINE_H.png | GEM_FIRE_LINE_V.png |
| WATER | GEM_WATER_LINE_H.png | GEM_WATER_LINE_V.png |
| EARTH | GEM_EARTH_LINE_H.png | GEM_EARTH_LINE_V.png |
| LIGHT | GEM_LIGHT_LINE_H.png | GEM_LIGHT_LINE_V.png |
| DARK | GEM_DARK_LINE_H.png | GEM_DARK_LINE_V.png |

The board renders the selected elemental PNG directly in its existing base-image box. Existing object-fit, cell sizes, alignment and board geometry remain unchanged. The old generic special image overlay, 90-degree rotation and CSS directional sweep are removed from line presentation. The existing 2.5-second charged animation now runs on the base image, with reduced-motion support. All twelve images are preloaded (46 stage assets total).

Modified runtime files: src/components/board/boardView.js, src/data/assets/catalog.js, src/data/assets/manifest.js, src/styles/battle.css. No engines, rules, RNG, combat, hero/enemy logic, hazards, Bomb or Prism behavior changed. The two already-pending generic PNG deletions are preserved; existing generic WebP derivatives remain available as legacy catalog entries.

Validation: production build and exact-case deployment audit passed (144 asset URLs); 28 unit tests and 2 production tests passed. Browser suite: 31 passed on the initial run; the one obsolete overlay-animation assertion was updated for the new base-image rendering and its targeted rerun passed, covering all 32 tests. New browser coverage verifies all twelve mappings, loaded originals, zero rotation, no duplicate overlay, charged animation, reduced motion, image fit at 360/390/412 px and no failed image requests. Existing touch and row/column clearing tests passed. New screenshots: tests/artifacts/elemental-lines-360.png, elemental-lines-390.png, elemental-lines-412.png. Other generated test evidence was restored from a pre-test backup to avoid unrelated changes.

Publication uses a normal push to main; Vercel deploys through the existing Git integration. No manual deployment is performed.
