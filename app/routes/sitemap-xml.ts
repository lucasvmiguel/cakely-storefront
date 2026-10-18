import { getProducts } from "~/lib/hostinger.server";
import { siteUrl } from "~/lib/site-url.server";

type Entry = { path: string; lastmod?: string | null; changefreq: string; priority: string };

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function loader() {
  const base = siteUrl();
  const products = await getProducts();
  const newest = products
    .map((p) => p.updatedAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  const entries: Entry[] = [
    { path: "/", lastmod: newest, changefreq: "daily", priority: "1.0" },
    ...products.map((p) => ({
      path: `/products/${p.slug}`,
      lastmod: p.updatedAt,
      changefreq: "weekly",
      priority: "0.9",
    })),
    { path: "/faq", changefreq: "monthly", priority: "0.5" },
    { path: "/return-policy", changefreq: "monthly", priority: "0.5" },
    { path: "/terms", changefreq: "yearly", priority: "0.3" },
    { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map((e) =>
      [
        "  <url>",
        `    <loc>${escape(base + e.path)}</loc>`,
        e.lastmod ? `    <lastmod>${e.lastmod.slice(0, 10)}</lastmod>` : null,
        `    <changefreq>${e.changefreq}</changefreq>`,
        `    <priority>${e.priority}</priority>`,
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n"),
    ),
    "</urlset>",
    "",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
