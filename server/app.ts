import { createRequestHandler } from "@react-router/express";
import express from "express";

export const app = express();

// Every page has a machine-readable twin at the same URL + ".md"
// (e.g. /products/coconut.md). Route those to the markdown resource route.
app.use((req, _res, next) => {
  if ((req.method === "GET" || req.method === "HEAD") && req.path.endsWith(".md")) {
    const query = req.url.slice(req.path.length);
    // React Router builds the request URL from originalUrl, so rewrite both.
    req.url = req.originalUrl = `/__md${req.path.slice(0, -3)}${query}`;
  }
  next();
});

app.use(
  createRequestHandler({
    build: () => import("virtual:react-router/server-build"),
  }),
);
