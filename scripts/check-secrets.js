import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

// Reports paths/line numbers/rule names only; never emits matching values.
const excluded = new Set([".git", "node_modules", "dist", "dist-ssr", ".vite"]);
const binary =
  /\.(?:png|webp|jpg|jpeg|gif|ico|woff2?|ttf|mp[34]|ogg|wav|zip|gz|pdf)$/i;
const rules = [
  [
    "GitHub token",
    /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,})\b/g,
  ],
  ["AWS access key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ["Google API key", /\bAIza[\w-]{35}\b/g],
  ["OpenAI-style key", /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{24,}\b/g],
  ["Private key", /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g],
  ["Credential in URL", /https?:\/\/[^\s/:"'<>]+:[^\s@"'<>]+@/g],
  [
    "Assigned credential",
    /\b(?:[a-z][a-z0-9]*_)*(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|secret[_-]?access[_-]?key|token|secret|password|passwd)\b["']?\s*[:=]\s*["']([^"'\r\n]{8,})["']/gi,
  ],
  [
    "Unquoted env credential",
    /^\s*(?:[A-Z][A-Z0-9]*_)*(?:API_KEY|TOKEN|SECRET|PASSWORD|PASSWD|SECRET_ACCESS_KEY)\s*=\s*([^\s#"']{8,})/gim,
  ],
  ["Bearer credential", /\bBearer\s+[A-Za-z0-9._-]{24,}\b/g],
];
const placeholder = (value) =>
  /^(?:<[^>]+>|YOUR_[A-Z_]+|process\.env\.|\$\{|example|placeholder|REDACTED)/i.test(
    value,
  );
async function walk(dir = ".") {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!excluded.has(entry.name)) files.push(...(await walk(file)));
    } else files.push(file.replaceAll("\\", "/").replace(/^\.\//, ""));
  }
  return files;
}
const tracked = new Set(
  execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
    .split("\0")
    .filter(Boolean),
);
const files = await walk(),
  findings = [],
  privateFiles = [];
let scanned = 0,
  skippedBinary = 0;
for (const file of files) {
  if (binary.test(file)) {
    skippedBinary++;
    continue;
  }
  if (
    /(?:^|\/)(?:\.env(?:\..+)?|\.npmrc|auth\.json|credentials[^/]*|secrets[^/]*|service-account[^/]*\.json)$|\.(?:pem|key|p12|pfx|keystore|jks)$/i.test(
      file,
    ) &&
    !file.endsWith(".env.example")
  )
    privateFiles.push({ file, tracked: tracked.has(file) });
  const info = await stat(file);
  if (info.size > 10 * 1024 * 1024) {
    findings.push({
      file,
      rule: "Large text file requires manual secret review",
    });
    continue;
  }
  const text = await readFile(file, "utf8");
  if (text.includes("\0")) {
    skippedBinary++;
    continue;
  }
  scanned++;
  for (const [rule, pattern] of rules) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      if (
        (rule === "Assigned credential" ||
          rule === "Unquoted env credential") &&
        placeholder(match[1])
      )
        continue;
      findings.push({
        file,
        line: text.slice(0, match.index).split("\n").length,
        rule,
        tracked: tracked.has(file),
      });
    }
  }
}
const summary = {
  scannedTextFiles: scanned,
  skippedBinaryFiles: skippedBinary,
  privateFiles,
  findings,
};
console.log(JSON.stringify(summary, null, 2));
if (findings.length || privateFiles.some((f) => f.tracked))
  process.exitCode = 1;
