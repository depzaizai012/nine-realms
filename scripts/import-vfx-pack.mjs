import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scanVfxPacks } from "./scan-vfx-packs.mjs";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packsRoot = path.join(repo, "public/assets/vfx/packs");

async function run() {
  const source = process.argv[2];
  if (!source) throw new Error("Usage: npm run vfx:import -- /path/to/extracted-licensed-pack");
  const dir = path.resolve(source);
  const metadata = JSON.parse(await fs.readFile(path.join(dir, "vfx-pack.json"), "utf8"));
  const name = metadata.id;
  if (typeof name !== "string" || !/^[a-z0-9][a-z0-9_-]{0,55}$/.test(name)) {
    throw new Error("vfx-pack.json must contain an id such as 'cc0-magic-01'.");
  }
  if (!["CC0-1.0","MIT"].includes(metadata.license) ||
      !/^https:\/\//.test(metadata.sourceUrl || "") ||
      typeof metadata.licenseEvidence !== "string" || !metadata.licenseEvidence) {
    throw new Error("Pack needs verified license, sourceUrl and licenseEvidence. Check the original license first.");
  }
  const destination = path.join(packsRoot, name);
  if (await fs.stat(destination).then(()=>true,()=>false)) {
    throw new Error("Pack exists; refusing to overwrite " + destination);
  }
  await fs.mkdir(packsRoot, { recursive: true });
  await fs.cp(dir, destination, { recursive: true, errorOnExist: true, force: false, dereference: false, filter: async (file) => {
    const stat = await fs.lstat(file);
    if (stat.isSymbolicLink()) throw new Error("Symlinks are not allowed: " + file);
    return true;
  }});
  const results = await scanVfxPacks();
  console.log(`Imported ${name}. Total available effects: ${results.length}.\nOpen /dev/vfx-studio on npm run dev.`);
}
run().catch(error => { console.error(error); process.exitCode = 1; });
