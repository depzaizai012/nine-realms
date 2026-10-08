import sharp from "sharp";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
const names = [
  "HUD_HERO_FRAME_NORMAL",
  "HUD_HERO_FRAME_ULT_READY",
  "HUD_HERO_ULT_GLOW_OVERLAY",
  "HUD_HERO_BAR_BG",
  "HUD_STATUS_ICON_SLOT",
  "HUD_STATUS_BAR_BG",
];
const result = {};
for (const name of names) {
  const file = `public/assets/ui/${name}.png`;
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let left = info.width,
    top = info.height,
    right = 0,
    bottom = 0;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 80) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
  result[name] = {
    width: info.width,
    height: info.height,
    bounds: { left, top, right, bottom },
  };
}
console.log(result);
const protectedFiles = [
  "src/core/match3/engine.js",
  "src/core/battle/engine.js",
  "src/core/battle/battleController.js",
  "src/core/vfx/battleVfxController.js",
  "src/core/vfx/heroActionVfxController.js",
  "src/core/vfx/boardVfxController.js",
  "src/components/enemy/enemyView.js",
  "src/data/enemies/index.js",
  "src/data/heroes/index.js",
  "src/data/stages/index.js",
];
await mkdir("tests/artifacts", { recursive: true });
const hashes = Object.fromEntries(
  await Promise.all(
    protectedFiles.map(async (file) => [
      file,
      createHash("sha256")
        .update(await readFile(file))
        .digest("hex"),
    ]),
  ),
);
await writeFile(
  "tests/artifacts/hud-baseline.json",
  JSON.stringify({ assets: result, protectedFiles: hashes }, null, 2),
);
