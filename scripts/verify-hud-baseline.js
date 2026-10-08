import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const baseline = JSON.parse(
  await readFile("tests/artifacts/hud-baseline.json", "utf8"),
);
const checks = await Promise.all(
  Object.entries(baseline.protectedFiles).map(async ([file, hash]) => ({
    file,
    unchanged:
      createHash("sha256")
        .update(await readFile(file))
        .digest("hex") === hash,
  })),
);
await writeFile(
  "tests/artifacts/hud-protected-files.json",
  JSON.stringify(checks, null, 2),
);
console.log(checks);
if (checks.some((c) => !c.unchanged)) process.exitCode = 1;
