import http from "node:http";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
const root = path.resolve("dist"),
  config = JSON.parse(await readFile("vercel.json", "utf8"));
const rewrite = new RegExp("^" + config.rewrites[0].source + "$");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
};
async function exact(relative) {
  let dir = root;
  for (const part of relative.split("/").filter(Boolean)) {
    const names = await readdir(dir).catch(() => []);
    if (!names.includes(part)) return false;
    dir = path.join(dir, part);
  }
  return (await stat(dir).catch(() => null))?.isFile();
}
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    // Local test helper only (bound to loopback, not deployed by Vercel).
    if (req.method === "POST" && pathname === "/__test_shutdown") {
      res.on("finish", stop);
      res.writeHead(200, { "Content-Type": "text/plain" }).end("Stopped");
      return;
    }
    if (pathname.includes("..") || pathname.includes("\\")) {
      res.writeHead(400).end();
      return;
    }
    let relative = pathname.slice(1);
    if (!(await exact(relative))) {
      if (!rewrite.test(pathname)) {
        res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
        return;
      }
      relative = "index.html";
    }
    const bytes = await readFile(path.join(root, relative));
    res.writeHead(200, {
      "Content-Type":
        types[path.extname(relative)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(req.method === "HEAD" ? undefined : bytes);
  } catch {
    res.writeHead(500).end();
  }
});
server.listen(4178, "127.0.0.1", () =>
  console.log("Production routing preview: http://127.0.0.1:4178"),
);
const stop = () => {
  server.closeAllConnections();
  server.close(() => process.exit(0));
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
