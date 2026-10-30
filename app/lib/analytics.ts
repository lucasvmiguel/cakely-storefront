// Google Analytics 4 + Meta Pixel. Both scripts load only after the visitor
// accepts cookies; until then every track() call is a no-op.
import { effectivePrice, type Product } from "./catalog";
import { readConsent } from "./consent";
import { toDecimal } from "./money";

export type AnalyticsIds = { gaId: string | null; pixelId: string | null };

type Item = { product: Product; quantity: number };

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean };
    _fbq?: unknown;
  }
}

let ids: AnalyticsIds = { gaId: null, pixelId: null };
let started = false;
// Events fired before the trackers start (e.g. a child component's effect runs
// before the root's), sent once the visitor's consent is known to be "accepted".
let queue: (() => void)[] = [];

function send(fn: () => void) {
  if (started) fn();
  else if (readConsent() !== "declined" && queue.length < 50) queue.push(fn);
}

function loadScript(src: string) {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

const DEBUG_KEY = "cakely-ga-debug";

/**
 * On in development, or after visiting any page with `?ga_debug=1` (remembered
 * for the tab, so a whole test order counts; `?ga_debug=0` turns it off).
 */
function debugMode() {
  if (import.meta.env.DEV) return true;
  try {
    const param = new URLSearchParams(window.location.search).get("ga_debug");
    if (param === "1") sessionStorage.setItem(DEBUG_KEY, "1");
    if (param === "0") sessionStorage.removeItem(DEBUG_KEY);
    return sessionStorage.getItem(DEBUG_KEY) === "1";
  } catch {
    return false;
  }
}

/** Loads both trackers. Safe to call more than once. */
export function startAnalytics(config: AnalyticsIds) {
  if (started || typeof window === "undefined") return;
  started = true;
  ids = config;

  if (ids.gaId) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // gtag.js expects the `arguments` object itself, not an array.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    window.gtag("js", new Date());
    // Page views are sent manually on every client-side navigation. Debug mode
    // shows the events live in GA's DebugView and keeps them out of reports.
    window.gtag("config", ids.gaId, { send_page_view: false, ...(debugMode() && { debug_mode: true }) });
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${ids.gaId}`);
  }

  if (ids.pixelId && !window.fbq) {
    const fbq = function (...args: unknown[]) {
      const f = fbq as unknown as { callMethod?: (...a: unknown[]) => void; queue: unknown[] };
      if (f.callMethod) f.callMethod(...args);
      else f.queue.push(args);
    } as NonNullable<Window["fbq"]> & { push?: unknown; version?: string };
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.push = fbq;
    window.fbq = fbq;
    window._fbq = fbq;
    loadScript("https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", ids.pixelId);
  }

  const pending = queue;
  queue = [];
  pending.forEach((fn) => fn());
}

/** The visitor declined cookies: drop anything waiting to be sent. */
export function discardQueuedEvents() {
  queue = [];
}

const ga = (event: string, params: Record<string, unknown>) =>
  send(() => {
    if (ids.gaId) window.gtag?.("event", event, params);
  });
const meta = (event: string, params?: Record<string, unknown>, options?: Record<string, unknown>) =>
  send(() => {
    if (ids.pixelId) window.fbq?.("track", event, params ?? {}, options ?? {});
  });

const itemId = (p: Product) => p.sku ?? p.id;

function gaItems(items: Item[], listName?: string) {
  return items.map(({ product: p, quantity }) => ({
    item_id: itemId(p),
    item_name: p.title,
    item_brand: "Cakely",
    item_category: "Cakes in a jar",
    item_variant: p.flavour ?? undefined,
    item_list_name: listName,
    price: Number(toDecimal(effectivePrice(p), p.currency)),
    quantity,
  }));
}

function totals(items: Item[]) {
  const amount = items.reduce((sum, i) => sum + effectivePrice(i.product) * i.quantity, 0);
  const currency = items[0]?.product.currency;
  return {
    value: Number(toDecimal(amount, currency)),
    currency: (currency?.code ?? "eur").toUpperCase(),
  };
}

function metaContents(items: Item[]) {
  return {
    content_ids: items.map((i) => itemId(i.product)),
    contents: items.map((i) => ({ id: itemId(i.product), quantity: i.quantity })),
    content_type: "product",
    num_items: items.reduce((n, i) => n + i.quantity, 0),
  };
}

export const track = {
  pageView(path: string, title: string) {
    ga("page_view", { page_path: path, page_title: title, page_location: window.location.href });
    meta("PageView");
  },

  /** A list of product cards was shown, e.g. "Home" or "Search results". */
  viewItemList(listName: string, products: Product[]) {
    if (!products.length) return;
    const items = products.map((product) => ({ product, quantity: 1 }));
    ga("view_item_list", {
      item_list_name: listName,
      items: gaItems(items, listName).map((item, index) => ({ ...item, index })),
    });
  },

  /** A product card in a list was clicked. */
  selectItem(listName: string, product: Product) {
    ga("select_item", { item_list_name: listName, items: gaItems([{ product, quantity: 1 }], listName) });
  },

  viewItem(product: Product) {
    const items = [{ product, quantity: 1 }];
    ga("view_item", { ...totals(items), items: gaItems(items) });
    meta("ViewContent", { ...totals(items), ...metaContents(items), content_name: product.title });
  },

  addToCart(product: Product, quantity = 1, listName?: string) {
    const items = [{ product, quantity }];
    ga("add_to_cart", { ...totals(items), items: gaItems(items, listName) });
    meta("AddToCart", { ...totals(items), ...metaContents(items), content_name: product.title });
  },

  viewCart(items: Item[]) {
    if (!items.length) return;
    ga("view_cart", { ...totals(items), items: gaItems(items) });
  },

  search(term: string) {
    ga("search", { search_term: term });
    meta("Search", { search_string: term });
  },

  beginCheckout(items: Item[]) {
    ga("begin_checkout", { ...totals(items), items: gaItems(items) });
    meta("InitiateCheckout", { ...totals(items), ...metaContents(items) });
  },

  /**
   * `value` (the order total, delivery included) and `shipping` are in minor
   * units, from the Hostinger cart.
   */
  purchase(order: { id: string; items: Item[]; value: number; shipping: number; coupon?: string }) {
    const currency = order.items[0]?.product.currency;
    const value = Number(toDecimal(order.value, currency));
    const code = (currency?.code ?? "eur").toUpperCase();
    ga("purchase", {
      transaction_id: order.id,
      affiliation: "Cakely online",
      value,
      shipping: Number(toDecimal(order.shipping, currency)),
      currency: code,
      coupon: order.coupon,
      items: gaItems(order.items),
    });
    // eventID lets Meta de-duplicate the event.
    meta("Purchase", { value, currency: code, ...metaContents(order.items) }, { eventID: order.id });
  },
};
