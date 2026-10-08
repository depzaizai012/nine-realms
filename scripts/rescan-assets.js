import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
async function scan(dir) {
  const files = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...(await scan(file)));
    else if (/\.(png|webp)$/i.test(e.name))
      files.push(file.replaceAll("\\", "/"));
  }
  return files.sort();
}
const files = await scan("public/assets"),
  catalog = {},
  inventory = [];
for (const file of files.filter((f) => !f.includes("/optimized/"))) {
  const bytes = await readFile(file),
    name = path.basename(file, ".png"),
    meta = await sharp(bytes).metadata();
  const url = "/" + file.replace(/^public\//, "");
  const derivative = `public/assets/optimized/${name}.webp`;
  let unchanged = false;
  try {
    const hash = execFileSync("git", ["rev-parse", `HEAD:${file}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    unchanged =
      createHash("sha1")
        .update(`blob ${bytes.length}\0`)
        .update(bytes)
        .digest("hex") === hash;
  } catch {}
  let selected = url;
  if (unchanged && files.includes(derivative))
    selected = "/" + derivative.replace(/^public\//, "");
  const entry = {
    original: url,
    url: selected,
    width: meta.width,
    height: meta.height,
  };
  if (file.includes("/enemies/") || file.includes("/bosses/")) {
    const { data, info } = await sharp(bytes)
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
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
        }
    entry.bounds = { left, top, right, bottom };
  }
  catalog[name] = entry;
  inventory.push({
    file,
    url: selected,
    bytes: bytes.length,
    changedSinceCheckpoint: !unchanged,
    modifiedAt: (await stat(file)).mtime.toISOString(),
  });
}
// Keep existing orphan derivatives as compatibility fallbacks; do not generate copies.
for (const file of files.filter((f) => f.includes("/optimized/"))) {
  const key = path.basename(file, ".webp");
  if (!catalog[key])
    catalog[key] = {
      original: null,
      url: "/" + file.replace(/^public\//, ""),
      legacyDerivative: true,
    };
}
await writeFile(
  "src/data/assets/catalog.js",
  "// Generated from current on-disk files by scripts/rescan-assets.js. No images modified.\nexport const ASSET_CATALOG = " +
    JSON.stringify(catalog, null, 2) +
    ";\n",
);
await writeFile(
  "tests/artifacts/current-asset-inventory.json",
  JSON.stringify(
    {
      originals: inventory.length,
      totalRasterFiles: files.length,
      registeredKeys: Object.keys(catalog).length,
      unassigned: inventory
        .filter((e) => /[0-9a-f]{8}-[0-9a-f-]{27,}/i.test(e.file))
        .map((e) => e.file),
      assets: inventory,
    },
    null,
    2,
  ),
);
console.log({
  originals: inventory.length,
  totalRasterFiles: files.length,
  registeredKeys: Object.keys(catalog).length,
});
