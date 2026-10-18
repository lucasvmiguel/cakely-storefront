import { EUR, type Currency } from "./money";

/**
 * Storefront-specific data that Hostinger doesn't store, keyed by SKU.
 * `slug` keeps the URLs that are already indexed by search engines
 * (e.g. /products/coconut) instead of Hostinger's generated slugs.
 */
const SKU_EXTRAS: Record<
  string,
  { slug: string; flavour?: string; weightGrams?: number }
> = {
  "1001": { slug: "chocofudge-brigadeiro", flavour: "Chocolate", weightGrams: 250 },
  "1002": { slug: "coconut", flavour: "Coconut", weightGrams: 250 },
  "1003": { slug: "cookies-cream", flavour: "Cookies", weightGrams: 250 },
  "1005": { slug: "lemon", flavour: "Lemon", weightGrams: 250 },
  "1006": { slug: "dulce-de-leche", flavour: "Caramelized Milk", weightGrams: 250 },
  "1007": { slug: "birthday-special" },
};

export const BIRTHDAY_SLUG = "birthday-special";

export type Product = {
  id: string;
  slug: string;
  sku: string | null;
  title: string;
  subtitle: string;
  descriptionHtml: string;
  images: string[];
  variantId: string;
  price: number;
  salePrice: number | null;
  currency: Currency;
  available: boolean;
  flavour: string | null;
  /** Price per kilogram in minor units, when the jar weight is known. */
  pricePerKg: number | null;
  updatedAt: string | null;
};

// Shapes returned by the Hostinger Storefront V2 API (only the fields we use).
export type ApiProduct = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  thumbnail: string | null;
  slug: string | null;
  url_handle?: string | null;
  updated_at?: string | null;
  is_available?: boolean;
  purchasable?: boolean;
  images?: { url: string; order: number; type: string }[];
  variants: {
    id: string;
    sku: string | null;
    is_available?: boolean;
    prices: {
      amount: number;
      sale_amount: number | null;
      currency?: Partial<Currency> & { code: string };
    }[];
  }[];
  seo_settings?: { slug?: string | null; description?: string | null } | null;
};

export function normalizeProduct(p: ApiProduct): Product | null {
  const variant = p.variants?.[0];
  const price = variant?.prices?.[0];
  if (!variant || !price) return null;

  const extras = (variant.sku && SKU_EXTRAS[variant.sku]) || null;
  const currency: Currency = {
    ...EUR,
    ...(price.currency as Partial<Currency>),
  };
  const images = (p.images ?? [])
    .filter((i) => i.type === "image")
    .sort((a, b) => a.order - b.order)
    .map((i) => i.url);
  if (!images.length && p.thumbnail) images.push(p.thumbnail);

  const effective = price.sale_amount ?? price.amount;

  return {
    id: p.id,
    slug: extras?.slug ?? p.seo_settings?.slug ?? p.slug ?? p.id,
    sku: variant.sku,
    title: p.title,
    subtitle: p.subtitle ?? "",
    descriptionHtml: p.description ?? "",
    images,
    variantId: variant.id,
    price: price.amount,
    salePrice: price.sale_amount,
    currency,
    available:
      (p.is_available ?? true) &&
      (p.purchasable ?? true) &&
      (variant.is_available ?? true),
    flavour: extras?.flavour ?? null,
    pricePerKg: extras?.weightGrams
      ? Math.round((effective * 1000) / extras.weightGrams)
      : null,
    updatedAt: p.updated_at ?? null,
  };
}

export function effectivePrice(p: Pick<Product, "price" | "salePrice">) {
  return p.salePrice ?? p.price;
}

/** Converts Hostinger's description HTML into plain paragraphs. */
export function htmlToText(html: string) {
  return html
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
