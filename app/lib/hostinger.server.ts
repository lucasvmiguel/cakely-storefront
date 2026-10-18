import {
  normalizeProduct,
  type ApiProduct,
  type Product,
} from "./catalog";
import { DEFAULT_SALES_CHANNEL_ID, HOSTINGER_API } from "./config";

export const SALES_CHANNEL_ID =
  process.env.SALES_CHANNEL_ID || DEFAULT_SALES_CHANNEL_ID;

const CACHE_TTL_MS = Number(process.env.CATALOG_CACHE_SECONDS ?? 60) * 1000;

let cache: { at: number; products: Product[] } | null = null;
let inflight: Promise<Product[]> | null = null;

async function fetchProducts(): Promise<Product[]> {
  const url = `${HOSTINGER_API}/channels/${SALES_CHANNEL_ID}/products?limit=100&sort_by=order&order=ASC`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`Hostinger catalog request failed: ${res.status}`);
  }
  const body = (await res.json()) as { data: ApiProduct[] };
  // Keep a stable order that matches the original storefront (by SKU).
  return body.data
    .map(normalizeProduct)
    .filter((p): p is Product => p !== null)
    .sort((a, b) => (Number(a.sku) || Infinity) - (Number(b.sku) || Infinity));
}

/**
 * Returns the live catalog for the sales channel, cached in memory for a short
 * time so every page render doesn't hit Hostinger. If Hostinger is briefly
 * unreachable we keep serving the last good copy.
 */
export async function getProducts(): Promise<Product[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.products;
  inflight ??= fetchProducts()
    .then((products) => {
      cache = { at: Date.now(), products };
      return products;
    })
    .catch((error) => {
      if (cache) {
        console.error(error);
        return cache.products;
      }
      throw error;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export async function getProductBySlug(slug: string) {
  const products = await getProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

/** Other products to show under "Customers who bought this also bought". */
export async function getRelated(product: Product, limit = 4) {
  const products = await getProducts();
  return products
    .filter((p) => p.id !== product.id && p.available)
    .slice(0, limit);
}
