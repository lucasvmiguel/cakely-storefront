import { readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { constants as zlib, brotliCompress } from "node:zlib";
import compression from "compression";
import express from "express";
import morgan from "morgan";

// Short-circuit the type-checking of the built output.
const BUILD_PATH = "./build/server/index.js";
const DEVELOPMENT = process.env.NODE_ENV === "development";
const PORT = Number.parseInt(process.env.PORT || "3000");

const app = express();

// Pages are rendered per request, so they get a fast Brotli level (5 is
// smaller than the default 4 at the same cost). Built CSS/JS gets the best
// level once, below.
app.use(compression({ brotli: { params: { [zlib.BROTLI_PARAM_QUALITY]: 5 } } }));
app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  });
  next();
});

if (DEVELOPMENT) {
  console.log("Starting development server");
  const viteDevServer = await import("vite").then((vite) =>
    vite.createServer({
      server: { middlewareMode: true },
    }),
  );
  app.use(viteDevServer.middlewares);
  app.use(async (req, res, next) => {
    try {
      const source = await viteDevServer.ssrLoadModule("./server/app.ts");
      return await source.app(req, res, next);
    } catch (error) {
      if (typeof error === "object" && error instanceof Error) {
        viteDevServer.ssrFixStacktrace(error);
      }
      next(error);
    }
  });
} else {
  console.log("Starting production server");
  app.use("/assets", precompressedAssets("build/client/assets"));
  app.use(
    "/assets",
    express.static("build/client/assets", { immutable: true, maxAge: "1y" }),
  );
  app.use(morgan("tiny"));
  // Fonts never change; images keep their file names, so after replacing one
  // give it a new name (or visitors may see the old one for up to 30 days).
  app.use("/fonts", express.static("build/client/fonts", { immutable: true, maxAge: "1y" }));
  app.use("/images", express.static("build/client/images", { maxAge: "30d" }));
  app.use(express.static("build/client", { maxAge: "1h" }));
  app.use(await import(BUILD_PATH).then((mod) => mod.app));
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

/**
 * Serves the built CSS and JS with maximum Brotli compression. Their names are
 * content hashes, so each file is compressed once, in the background when the
 * server starts (it takes tens of milliseconds a file, too slow for a
 * request), and kept in memory. Until a file is ready, and for clients that
 * don't accept Brotli, requests fall through to express.static, which the
 * compression middleware compresses as usual.
 *
 * @param {string} dir
 * @returns {import("express").RequestHandler}
 */
function precompressedAssets(dir) {
  /** @type {Record<string, string>} */
  const types = { ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8" };
  /** @type {Map<string, Buffer>} */
  const ready = new Map();
  const brotli = promisify(brotliCompress);
  (async () => {
    for (const name of readdirSync(dir).filter((f) => f.endsWith(".css") || f.endsWith(".js"))) {
      const body = await brotli(await readFile(`${dir}/${name}`), {
        params: { [zlib.BROTLI_PARAM_QUALITY]: zlib.BROTLI_MAX_QUALITY },
      });
      ready.set(name, body);
    }
  })().catch((error) => console.error("Precompressing assets failed; serving them as usual.", error));

  return (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    const body = ready.get(req.path.slice(1));
    if (!body || !acceptsBrotli(req.get("Accept-Encoding"))) return next();
    res.set({
      "Content-Type": types[req.path.slice(req.path.lastIndexOf("."))],
      "Content-Encoding": "br",
      "Cache-Control": "public, max-age=31536000, immutable",
      Vary: "Accept-Encoding",
    });
    res.send(body);
  };
}

/**
 * True when an Accept-Encoding header allows Brotli: "br" listed with a
 * non-zero q (so "br;q=0", which refuses it, is false).
 *
 * @param {string | undefined} header
 */
function acceptsBrotli(header) {
  return (header ?? "").split(",").some((part) => {
    const [coding, ...params] = part.trim().toLowerCase().split(";");
    if (coding.trim() !== "br") return false;
    const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
    return !q || Number(q.slice(2)) > 0;
  });
}
