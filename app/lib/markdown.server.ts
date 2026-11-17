import { faq } from "~/content/faq";
import { policies } from "~/content/policies";
import { home, site } from "~/content/site";
import { BIRTHDAY_SLUG, effectivePrice, htmlToText, type Product } from "./catalog";
import { formatMoney } from "./money";
import { absolute } from "./seo";

// Machine-readable (Markdown) versions of every public page, for LLMs and AI
// tools. Served at the page URL + ".md" (e.g. /products/coconut.md).

function productSummary(siteUrl: string, p: Product) {
  return [
    `### [${p.title}](${siteUrl}/products/${p.slug}.md)`,
    "",
    p.images[0] ? `![${p.title}](${p.images[0]})\n` : "",
    `- **Price:** ${formatMoney(effectivePrice(p), p.currency)}`,
    `- **Availability:** ${p.available ? "In stock" : "Out of stock"}`,
    "",
  ].join("\n");
}

function contactBlock() {
  return [
    "## Contact",
    "",
    `- **Email:** ${site.email}`,
    `- **Phone:** ${site.phone}`,
    `- **WhatsApp:** ${site.socials.whatsapp}`,
    `- **Address:** ${site.address.display}`,
    `- **Customer support:** ${site.supportHours}`,
    "",
    "## Follow Us",
    "",
    `- [Instagram](${site.socials.instagram})`,
    `- [TikTok](${site.socials.tiktok})`,
    "",
  ].join("\n");
}

export function homeMarkdown(siteUrl: string, products: Product[]) {
  // Same as the page: cakes in stock, then the Birthday Special.
  const miniCakes = products.filter((p) => p.slug !== BIRTHDAY_SLUG && p.available);
  const birthday = products.find((p) => p.slug === BIRTHDAY_SLUG && p.available);
  const parts = [
    `# ${site.name}: ${home.headline.join(" ")}`,
    "",
    site.description,
    "",
    `![${site.name}](${absolute(siteUrl, site.logo)})`,
    "",
    `${home.plan.lead} ${home.plan.summary}`,
    "",
    contactBlock(),
    `## ${home.flavours.title.replace(/\.$/, "")}`,
    "",
    ...miniCakes.map((p) => productSummary(siteUrl, p)),
  ];
  if (birthday) {
    const price = formatMoney(effectivePrice(birthday), birthday.currency);
    parts.push(
      `## ${home.birthday.eyebrow}: ${home.birthday.title.join(" ")}`,
      "",
      home.birthday.body(price),
      "You choose the ten flavours on the home page; they are sent with the order.",
      "",
      `[${birthday.title}](${siteUrl}/products/${birthday.slug}.md)`,
      "",
    );
  }
  parts.push(
    `## ${home.howTo.title.replace(/\.$/, "")}`,
    "",
    ...home.howTo.steps.flatMap((s, i) => [`### ${i + 1}. ${s.title}`, "", s.body, ""]),
    `## ${home.about.title}`,
    "",
    home.about.body,
    "",
    morePages(siteUrl),
  );
  return parts.join("\n");
}

export function productMarkdown(siteUrl: string, p: Product) {
  const price = effectivePrice(p);
  const details = [
    `- **Price:** ${formatMoney(price, p.currency)}`,
    p.salePrice != null ? `- **Regular price:** ${formatMoney(p.price, p.currency)}` : null,
    p.pricePerKg ? `- **Unit price:** ${formatMoney(p.pricePerKg, p.currency)} per kg` : null,
    `- **Availability:** ${p.available ? "In stock" : "Out of stock"}`,
    p.sku ? `- **SKU:** ${p.sku}` : null,
    `- **Delivery:** Amsterdam only, minimum order ${formatMoney(2000, p.currency)}`,
  ].filter(Boolean);

  return [
    `# ${p.title}`,
    "",
    p.subtitle,
    "",
    ...p.images.map((u) => `![${p.title}](${u})`),
    "",
    `URL: ${siteUrl}/products/${p.slug}`,
    "",
    "## Details",
    "",
    ...details,
    "",
    "## Description",
    "",
    htmlToText(p.descriptionHtml),
    "",
    ...(p.flavour ? ["## Characteristics", "", `- **Flavour:** ${p.flavour}`, ""] : []),
    morePages(siteUrl),
  ].join("\n");
}

export function faqMarkdown(siteUrl: string) {
  return [
    "# Frequently Asked Questions",
    "",
    `## ${faq.category}`,
    "",
    ...faq.items.flatMap((i) => [`### Q: ${i.q}`, `**A:** ${i.a}`, ""]),
    "## Still need help?",
    "",
    `Email us at ${site.email} or call ${site.phone}.`,
    "",
    morePages(siteUrl),
  ].join("\n");
}

export function policyMarkdown(siteUrl: string, slug: string) {
  // Own keys only: "/constructor.md" or "/__proto__.md" must 404, not crash.
  if (!Object.hasOwn(policies, slug)) return null;
  const p = policies[slug];
  return [
    `# ${p.title} — ${site.name}`,
    "",
    p.lastUpdated ? `Last updated: ${p.lastUpdated}\n` : p.description + "\n",
    p.layout === "centered" ? `## ${p.heading}\n` : "",
    // Make site-relative links absolute so they work outside the site.
    p.body.replace(/\]\(\//g, `](${siteUrl}/`),
    "",
    "---",
    "",
    ...(p.related?.length
      ? ["Related pages:", ...p.related.map((r) => `- [${r.label}](${siteUrl}/${r.slug}.md)`), ""]
      : []),
    morePages(siteUrl),
  ].join("\n");
}

export function collectionsMarkdown(siteUrl: string, products: Product[]) {
  return [
    `# All products — ${site.name}`,
    "",
    `${products.length} products available.`,
    "",
    ...products.map((p) => productSummary(siteUrl, p)),
  ].join("\n");
}

function morePages(siteUrl: string) {
  return [
    "---",
    "",
    "More pages:",
    `- [Home](${siteUrl}/home.md)`,
    `- [All products](${siteUrl}/collections.md)`,
    `- [FAQ](${siteUrl}/faq.md)`,
    `- [Return Policy](${siteUrl}/return-policy.md)`,
    "",
  ].join("\n");
}

/** https://llmstxt.org — an index of the site for LLMs. */
export function llmsTxt(siteUrl: string, products: Product[]) {
  return [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    "Cakely sells handmade mini cakes, delivered exclusively in Amsterdam (Netherlands). Delivery happens on Saturdays and Sundays; the minimum order is €20. Every page on this site is also available as Markdown by adding `.md` to its URL.",
    "",
    "## Products",
    "",
    ...products.map(
      (p) =>
        `- [${p.title}](${siteUrl}/products/${p.slug}.md): ${p.subtitle || htmlToText(p.descriptionHtml).split("\n")[0]} — ${formatMoney(effectivePrice(p), p.currency)}`,
    ),
    "",
    "## Pages",
    "",
    `- [Home](${siteUrl}/home.md): About Cakely, our cakes and how to order`,
    `- [All products](${siteUrl}/collections.md): Full product list with prices`,
    `- [FAQ](${siteUrl}/faq.md): Delivery, payment and allergens`,
    "",
    "## Policies",
    "",
    `- [Return Policy](${siteUrl}/return-policy.md)`,
    `- [Terms of Service](${siteUrl}/terms.md)`,
    `- [Privacy Policy](${siteUrl}/privacy.md)`,
    "",
    "## Contact",
    "",
    `- Email: ${site.email}`,
    `- Phone / WhatsApp: ${site.phone}`,
    `- Instagram: ${site.socials.instagram}`,
    "",
  ].join("\n");
}
