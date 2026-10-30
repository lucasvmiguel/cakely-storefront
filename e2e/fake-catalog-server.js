// Serves the test catalog in place of the Hostinger Storefront API, for the
// storefront server's own (server-side) catalog requests during the tests.
import { readFileSync } from "node:fs";
import { createServer } from "node:http";

const catalog = readFileSync(new URL("./fixtures/catalog.json", import.meta.url), "utf8");
const PORT = Number(process.env.PORT || 4174);

createServer((req, res) => {
  const { pathname } = new URL(req.url ?? "/", "http://localhost");
  if (pathname === "/health") {
    res.end("ok");
  } else if (/^\/v2\/channels\/[^/]+\/products$/.test(pathname)) {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(catalog);
  } else {
    res.writeHead(404).end();
  }
}).listen(PORT, "127.0.0.1");
