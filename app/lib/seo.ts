import type { MetaDescriptor } from "react-router";
import { DEFAULT_SITE_URL } from "./config";
import { site } from "~/content/site";

type Match = { id: string; loaderData?: unknown } | undefined;

/** Reads the public site URL that the root loader exposes. */
export function siteUrlFrom(matches: Match[]) {
  const root = matches.find((m) => m?.id === "root")?.loaderData as
    | { siteUrl?: string }
    | undefined;
  return root?.siteUrl ?? DEFAULT_SITE_URL;
}

export function absolute(siteUrl: string, pathOrUrl: string) {
  return /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${siteUrl}${pathOrUrl}`;
}

export function pageMeta(opts: {
  siteUrl: string;
  title: string;
  description: string;
  path: string;
  /** Path of the machine-readable version, e.g. "/faq.md". */
  markdownPath?: string;
  image?: string;
  type?: "website" | "product" | "article";
  noindex?: boolean;
  jsonLd?: object[];
}): MetaDescriptor[] {
  const url = absolute(opts.siteUrl, opts.path);
  const image = absolute(opts.siteUrl, opts.image ?? site.ogImage);
  const meta: MetaDescriptor[] = [
    { title: opts.title },
    { name: "description", content: opts.description },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:site_name", content: site.name },
    { property: "og:type", content: opts.type ?? "website" },
    { property: "og:title", content: opts.title },
    { property: "og:description", content: opts.description },
    { property: "og:url", content: url },
    { property: "og:image", content: image },
    { property: "og:locale", content: "en_US" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: opts.title },
    { name: "twitter:description", content: opts.description },
    { name: "twitter:image", content: image },
  ];
  if (opts.noindex) meta.push({ name: "robots", content: "noindex, follow" });
  if (opts.markdownPath) {
    meta.push({
      tagName: "link",
      rel: "alternate",
      type: "text/markdown",
      href: absolute(opts.siteUrl, opts.markdownPath),
      title: "Machine-readable version",
    });
  }
  for (const ld of opts.jsonLd ?? []) meta.push({ "script:ld+json": ld });
  return meta;
}

export function organizationLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Bakery",
    "@id": `${siteUrl}/#organization`,
    name: site.name,
    description: site.description,
    url: siteUrl,
    logo: absolute(siteUrl, site.logo),
    image: absolute(siteUrl, site.ogImage),
    email: site.email,
    telephone: site.phone,
    priceRange: "€",
    servesCuisine: "Desserts",
    address: {
      "@type": "PostalAddress",
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    areaServed: { "@type": "City", name: "Amsterdam" },
    sameAs: [site.socials.instagram, site.socials.tiktok],
  };
}

export function websiteLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbLd(siteUrl: string, items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absolute(siteUrl, item.path),
    })),
  };
}
