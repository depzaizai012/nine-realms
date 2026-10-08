import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ASSET_CATALOG } from "../src/data/assets/catalog.js";
import { MANIFEST, stageAssets } from "../src/data/assets/manifest.js";

const errors = [];
const configured = (key) => {
  try {
    return !!execFileSync("git", ["config", "--get", key], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return false;
  }
};
async function exact(relative) {
  let dir = process.cwd();
  for (const part of relative.split("/").filter(Boolean)) {
    let entries;
    try {
      entries = await readdir(dir);
    } catch {
      return false;
    }
    if (!entries.includes(part)) return false;
    dir = path.join(dir, part);
  }
  return true;
}
async function list(dir) {
  const files = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const file = `${dir}/${e.name}`;
    if (e.isDirectory()) files.push(...(await list(file)));
    else files.push(file);
  }
  return files;
}
const urls = [
  ...new Set([
    ...Object.values(MANIFEST),
    ...Object.values(ASSET_CATALOG)
      .flatMap((a) => [a.url, a.original])
      .filter(Boolean),
  ]),
];
for (const url of urls) {
  if (!url.startsWith("/assets/")) {
    errors.push(`Unexpected asset URL: ${url}`);
    continue;
  }
  for (const prefix of ["public", "dist"])
    if (!(await exact(prefix + decodeURIComponent(url))))
      errors.push(`Missing/case-mismatched ${prefix}${url}`);
}
const sourceFiles = await list("src");
for (const file of sourceFiles.filter((f) => /\.(js|css)$/.test(f))) {
  const text = await readFile(file, "utf8");
  const pattern = file.endsWith(".js")
    ? /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["']([^"']+)["']/g
    : /@import\s*(?:url\(\s*)?["']([^"']+)["']/g;
  for (const match of text.matchAll(pattern)) {
    if (!match[1].startsWith(".")) continue;
    const target = path.posix.normalize(
      path.posix.join(path.posix.dirname(file), match[1]),
    );
    if (!(await exact(target)))
      errors.push(`Import case/path mismatch: ${file} -> ${match[1]}`);
  }
}
const publicFiles = await list("public"),
  folded = new Map();
for (const file of publicFiles) {
  const lower = file.toLowerCase();
  if (folded.has(lower) && folded.get(lower) !== file)
    errors.push(`Case collision: ${file}`);
  folded.set(lower, file);
}
const pkg = JSON.parse(await readFile("package.json", "utf8")),
  lock = JSON.parse(await readFile("package-lock.json", "utf8")),
  config = JSON.parse(await readFile("vercel.json", "utf8"));
if (
  JSON.stringify(pkg.devDependencies) !==
  JSON.stringify(lock.packages[""].devDependencies)
)
  errors.push("Package/lock dependency mismatch");
if (pkg.engines.node !== lock.packages[""].engines?.node)
  errors.push("Package/lock engine mismatch");
if (config.framework !== "vite" || config.outputDirectory !== "dist")
  errors.push("Vercel framework/output mismatch");
const route = new RegExp("^" + config.rewrites[0].source + "$");
for (const url of ["/", "/town", "/battle/1-1"])
  if (!route.test(url)) errors.push(`SPA route excluded: ${url}`);
for (const url of ["/assets/missing.png", "/assets/index.js", "/missing.png"])
  if (route.test(url))
    errors.push(`Missing asset incorrectly gets SPA HTML: ${url}`);
const gitFiles = [...(await list("public")), ...sourceFiles];
let largest = { file: null, bytes: 0 };
for (const file of gitFiles) {
  const bytes = (await stat(file)).size;
  if (bytes > largest.bytes) largest = { file, bytes };
  if (bytes >= 100 * 1024 * 1024) errors.push(`GitHub oversized file: ${file}`);
}
console.log(
  JSON.stringify(
    {
      framework: "Vite",
      node: pkg.engines.node,
      lockfile: "package-lock.json",
      assetUrlsChecked: urls.length,
      stageAssets: stageAssets().length,
      sourceFilesChecked: sourceFiles.length,
      gitIdentity: {
        nameConfigured: configured("user.name"),
        emailConfigured: configured("user.email"),
      },
      largestProjectFile: largest,
      errors,
    },
    null,
    2,
  ),
);
if (errors.length) process.exitCode = 1;
