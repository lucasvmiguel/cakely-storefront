// Product feed for Google Merchant Center (RSS 2.0 with the g: namespace).
// Merchant Center fetches it daily as a product source, so every product in
// the Hostinger catalog is listed even before Google's crawler finds its page.
import { site } from "~/content/site";
import { htmlToText } from "~/lib/catalog";
import { HANDLING_DAYS } from "~/lib/delivery";
import { getProducts } from "~/lib/hostinger.server";
import { EUR, toDecimal } from "~/lib/money";
import { absolute } from "~/lib/seo";
import { siteUrl } from "~/lib/site-url.server";

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const tag = (name: string, value: string | number | null | undefined) =>
  value == null || value === "" ? null : `      <g:${name}>${escape(String(value))}</g:${name}>`;

export async function loader() {
  const base = siteUrl();
  const products = await getProducts();

  const items = products.map((p) => {
    const link = `${base}/products/${p.slug}`;
    const currency = p.currency.code.toUpperCase();
    const [image, ...extraImages] = p.images.map((src) => absolute(base, src));
    return [
      "    <item>",
      // Same id as the crawled listings (the SKU), so they merge instead of duplicating.
      tag("id", p.sku ?? p.id),
      tag("title", p.title),
      tag("description", (htmlToText(p.descriptionHtml) || p.subtitle).slice(0, 5000)),
      tag("link", link),
      tag("image_link", image),
      ...extraImages.slice(0, 10).map((src) => tag("additional_image_link", src)),
      tag("availability", p.available ? "in_stock" : "out_of_stock"),
      tag("price", `${toDecimal(p.price, p.currency)} ${currency}`),
      p.salePrice != null && p.salePrice < p.price
        ? tag("sale_price", `${toDecimal(p.salePrice, p.currency)} ${currency}`)
        : null,
      tag("condition", "new"),
      tag("brand", site.name),
      tag("identifier_exists", "no"),
      tag("product_type", "Cakes in a jar"),
      p.flavour ? tag("custom_label_0", p.flavour) : null,
      "      <g:shipping>",
      "        <g:country>NL</g:country>",
      `        <g:price>${toDecimal(site.shippingPrice, EUR)} EUR</g:price>`,
      `        <g:min_handling_time>${HANDLING_DAYS.min}</g:min_handling_time>`,
      `        <g:max_handling_time>${HANDLING_DAYS.max}</g:max_handling_time>`,
      "        <g:min_transit_time>0</g:min_transit_time>",
      "        <g:max_transit_time>0</g:max_transit_time>",
      "      </g:shipping>",
      "    </item>",
    ]
      .filter(Boolean)
      .join("\n");
  });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    "  <channel>",
    `    <title>${escape(site.name)}</title>`,
    `    <link>${escape(base)}</link>`,
    `    <description>${escape(site.description)}</description>`,
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
