import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimeDir = path.join(project, "public/assets/vfx/runtime");
const required = ["effekseer.js", "effekseer-webgl.js", "effekseer-webgl.wasm"];
async function run() {
  const source = process.argv[2];
  if (!source) throw new Error("Usage: npm run vfx:runtime -- /path/to/extracted/EffekseerForWeb");
  const dir = path.resolve(source);
  for (const filename of required) {
    if (!(await fs.stat(path.join(dir, filename)).then(x=>x.isFile(),()=>false))) {
      throw new Error(`Runtime missing ${filename}. Extract an official EffekseerForWeb distribution first.`);
    }
  }
  await fs.mkdir(runtimeDir, { recursive: true });
  for (const filename of required) await fs.copyFile(path.join(dir, filename), path.join(runtimeDir, filename));
  await fs.writeFile(path.join(runtimeDir,"UPSTREAM.txt"),
    "EffekseerForWeb runtime: https://github.com/effekseer/EffekseerForWeb\nLicense: MIT\nKeep original MIT copyright and license.\n");
  console.log("WebGL runtime installed. Remember to preserve upstream MIT license text.");
}
run().catch(error => { console.error(error); process.exitCode = 1; });
