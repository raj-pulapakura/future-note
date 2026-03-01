import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleApiRequest } from "./backend/api/router.js";
import { loadRuntimeConfig } from "./backend/config/runtime.js";
import { createStorageAdapter } from "./backend/storage/create-storage-adapter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");

const runtimeConfig = loadRuntimeConfig(process.env);
const storage = createStorageAdapter(runtimeConfig);

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

function safePathFromUrl(urlPath) {
  const normalized = path.normalize(urlPath).replace(/^\.+[\\/]/, "");
  return normalized === path.sep ? "index.html" : normalized;
}

async function serveStatic(req, res) {
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Method Not Allowed\n");
    return;
  }

  const parsed = new URL(req.url, "http://localhost");
  const requestPath = parsed.pathname === "/" ? "/index.html" : parsed.pathname;
  const relativePath = safePathFromUrl(requestPath);
  const absolutePath = path.join(publicDir, relativePath);

  try {
    const stat = await fs.stat(absolutePath);
    const finalPath = stat.isDirectory() ? path.join(absolutePath, "index.html") : absolutePath;
    const ext = path.extname(finalPath).toLowerCase();
    const mimeType = MIME_TYPES[ext] ?? "application/octet-stream";
    const body = await fs.readFile(finalPath);

    res.writeHead(200, { "Content-Type": mimeType });
    if (req.method === "HEAD") {
      res.end();
      return;
    }

    res.end(body);
  } catch {
    const fallback = await fs.readFile(path.join(publicDir, "index.html"));
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(fallback);
  }
}

const server = http.createServer(async (req, res) => {
  const handled = await handleApiRequest(req, res, {
    storage,
    publicBaseUrl: runtimeConfig.publicBaseUrl,
  });
  if (handled) {
    return;
  }

  await serveStatic(req, res);
});

const port = Number(process.env.PORT ?? 4173);
server.listen(port, () => {
  console.log(
    `Future Note listening on http://localhost:${port} (storage=${runtimeConfig.storage.adapter})`
  );
});
