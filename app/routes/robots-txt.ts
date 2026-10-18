import { siteUrl } from "~/lib/site-url.server";

export function loader() {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin/",
    "Disallow: /api/",
    "Disallow: /auth/",
    "Disallow: /cart",
    "Disallow: /checkout",
    "Disallow: /orders/",
    "Disallow: /profile",
    "Disallow: /search",
    "Disallow: /p/",
    "",
    `Sitemap: ${siteUrl()}/sitemap.xml`,
    "",
  ].join("\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
