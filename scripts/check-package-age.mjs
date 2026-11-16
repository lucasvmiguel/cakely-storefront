#!/usr/bin/env node
// Fails if any package in package-lock.json was published to the npm registry
// less than MIN_AGE_DAYS ago. This is the enforced half of the supply-chain
// cooldown in .npmrc (min-release-age): .npmrc stops npm from picking fresh
// versions locally, this stops them from merging no matter how they got in.
//
// Usage: node scripts/check-package-age.mjs [--days N]

import { readFile } from "node:fs/promises";

const daysArg = process.argv.indexOf("--days");
const MIN_AGE_DAYS = daysArg > -1 ? Number(process.argv[daysArg + 1]) : 7;
const REGISTRY = "https://registry.npmjs.org";
const CONCURRENCY = 16;

const lock = JSON.parse(await readFile(new URL("../package-lock.json", import.meta.url), "utf8"));

// Collect name@version for every registry package in the lockfile.
const wanted = new Map(); // name -> Set(version)
for (const [path, meta] of Object.entries(lock.packages ?? {})) {
  if (!path || meta.link || !meta.version) continue;
  if (meta.resolved && !meta.resolved.startsWith(REGISTRY)) continue;
  const name = meta.name ?? path.slice(path.lastIndexOf("node_modules/") + "node_modules/".length);
  if (!wanted.has(name)) wanted.set(name, new Set());
  wanted.get(name).add(meta.version);
}

const cutoff = Date.now() - MIN_AGE_DAYS * 24 * 60 * 60 * 1000;
const tooNew = [];
const failed = [];

async function check(name) {
  const res = await fetch(`${REGISTRY}/${name.replace("/", "%2f")}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  const { time = {} } = await res.json();
  for (const version of wanted.get(name)) {
    const published = Date.parse(time[version]);
    if (Number.isNaN(published)) failed.push(`${name}@${version}: no publish time`);
    else if (published > cutoff) tooNew.push(`${name}@${version} (published ${time[version]})`);
  }
}

const names = [...wanted.keys()];
for (let i = 0; i < names.length; i += CONCURRENCY) {
  await Promise.all(
    names.slice(i, i + CONCURRENCY).map((n) => check(n).catch((e) => failed.push(e.message))),
  );
}

if (failed.length) {
  console.error(`Could not verify ${failed.length} package(s):\n  ${failed.join("\n  ")}`);
}
if (tooNew.length) {
  console.error(
    `${tooNew.length} package(s) are younger than ${MIN_AGE_DAYS} days:\n  ${tooNew.join("\n  ")}`,
  );
}
if (failed.length || tooNew.length) process.exit(1);
console.log(`OK: all ${names.length} packages in package-lock.json are at least ${MIN_AGE_DAYS} days old.`);
