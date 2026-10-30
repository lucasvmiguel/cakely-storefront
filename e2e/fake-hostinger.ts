// A fake Hostinger Storefront API for the checkout, which runs in the browser.
// Every request to api-ecommerce.hostinger.com is answered here, so the tests
// never create a real cart or order. All other outside requests (analytics,
// image CDN) are blocked.
import { readFileSync } from "node:fs";
import type { BrowserContext, Route } from "@playwright/test";

type ApiProduct = {
  variants: { id: string; is_available: boolean; prices: { amount: number; sale_amount: number | null }[] }[];
};

const catalog: { data: ApiProduct[] } = JSON.parse(
  readFileSync(new URL("./fixtures/catalog.json", import.meta.url), "utf8"),
);

export const SHIPPING_OPTION = { id: "so_local", name: "Amsterdam delivery", amount: 390 };
/** Valid discount codes and their percentage off the items. */
export const DISCOUNT_CODES: Record<string, number> = { WELCOME10: 10 };

type Address = Record<string, string | null | undefined>;

type FakeCart = {
  id: string;
  token: string;
  items: { variant_id: string; quantity: number; unit_price: number }[];
  email: string | null;
  shipping_address: Address | null;
  billing_address: Address | null;
  shipping_option_id: string | null;
  codes: string[];
  provider_id: string | null;
  completed: boolean;
};

export type FakeOrder = {
  id: string;
  items: { variant_id: string; quantity: number }[];
  email: string | null;
  shipping_address: Address | null;
  billing_address: Address | null;
  shipping_option_id: string | null;
  codes: string[];
  provider_id: string | null;
  subtotal: number;
  shipping_total: number;
  discount_total: number;
  total: number;
};

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "accept, authorization, content-type",
  "access-control-allow-methods": "GET, POST, PUT, PATCH, OPTIONS",
};

export class FakeHostinger {
  readonly carts = new Map<string, FakeCart>();
  readonly orders: FakeOrder[] = [];
  /** Make the next order attempts fail with a server error. */
  failComplete = false;
  private next = 1;

  async install(context: BrowserContext) {
    // Routes registered later take priority, so this catch-all goes first.
    await context.route(
      (url) => !["127.0.0.1", "localhost"].includes(url.hostname),
      (route) => route.abort(),
    );
    await context.route("https://api-ecommerce.hostinger.com/**", (route) => this.handle(route));
  }

  private totals(cart: FakeCart) {
    const subtotal = cart.items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
    const shipping_total = cart.shipping_option_id ? SHIPPING_OPTION.amount : 0;
    const discount_total = cart.codes.reduce((sum, c) => sum + Math.round((subtotal * DISCOUNT_CODES[c]) / 100), 0);
    return { subtotal, shipping_total, discount_total, total: subtotal + shipping_total - discount_total };
  }

  private view(cart: FakeCart) {
    const { total, shipping_total, discount_total } = this.totals(cart);
    return {
      id: cart.id,
      email: cart.email,
      total,
      shipping_total,
      discount_total,
      items: cart.items,
      discounts: cart.codes.map((code) => ({ code, amount: null })),
      shipping_methods: cart.shipping_option_id
        ? [{ shipping_option_id: cart.shipping_option_id, name: SHIPPING_OPTION.name, amount: SHIPPING_OPTION.amount }]
        : [],
    };
  }

  private async handle(route: Route) {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    const reply = (status: number, body: unknown) =>
      route.fulfill({ status, headers: CORS, contentType: "application/json", body: JSON.stringify(body) });

    const path = new URL(req.url()).pathname;
    const body = req.postData() ? JSON.parse(req.postData()!) : {};
    let m: RegExpMatchArray | null;

    if (req.method() === "POST" && /^\/v2\/channels\/[^/]+\/carts$/.test(path)) {
      const requested = body.items as { variant_id: string; quantity: number }[];
      const variants = catalog.data.flatMap((p) => p.variants);
      const items = [];
      for (const i of requested) {
        const variant = variants.find((v) => v.id === i.variant_id);
        if (!variant?.is_available) return reply(400, { message: `Variant ${i.variant_id} is not available` });
        const price = variant.prices[0];
        items.push({ ...i, unit_price: price.sale_amount ?? price.amount });
      }
      const n = this.next++;
      const cart: FakeCart = {
        id: `cart_${n}`,
        token: `token_${n}`,
        items,
        email: null,
        shipping_address: null,
        billing_address: null,
        shipping_option_id: null,
        codes: [],
        provider_id: null,
        completed: false,
      };
      this.carts.set(cart.id, cart);
      return reply(201, { data: this.view(cart), cart_token: cart.token });
    }

    // The discount endpoint is keyed by the cart token, without auth.
    if ((m = path.match(/^\/store\/carts\/([^/]+)$/)) && req.method() === "POST") {
      const cart = [...this.carts.values()].find((c) => c.token === m![1]);
      if (!cart) return reply(404, { message: "Cart not found" });
      const codes = (body.discounts as { code: string }[]).map((d) => d.code);
      if (codes.some((c) => !(c in DISCOUNT_CODES))) return reply(404, { message: "Discount not found" });
      cart.codes = codes;
      return reply(200, { data: this.view(cart) });
    }

    if (!(m = path.match(/^\/v2\/carts\/([^/]+)(\/.*)?$/))) return reply(404, { message: "Not found" });
    const cart = this.carts.get(m[1]);
    if (!cart) return reply(404, { message: "Cart not found" });
    if (req.headers()["authorization"] !== `Bearer ${cart.token}`) return reply(401, { message: "Unauthorized" });
    if (cart.completed) return reply(409, { message: "Cart already completed" });
    const action = `${req.method()} ${m[2] ?? ""}`;

    switch (action) {
      case "GET ":
        return reply(200, { data: this.view(cart) });
      case "PATCH ":
        if (body.email !== undefined) cart.email = body.email;
        if (body.shipping_address) cart.shipping_address = { ...cart.shipping_address, ...body.shipping_address };
        if (body.billing_address) cart.billing_address = { ...cart.billing_address, ...body.billing_address };
        return reply(200, { data: this.view(cart) });
      case "GET /shipping-options":
        return reply(200, { data: [SHIPPING_OPTION] });
      case "PUT /shipping-method":
        if (body.option_id !== SHIPPING_OPTION.id) return reply(400, { message: "Unknown shipping option" });
        cart.shipping_option_id = body.option_id;
        return reply(200, { data: this.view(cart) });
      case "POST /payment-session":
        cart.provider_id = body.provider_id;
        return reply(200, { data: { status: "pending", data: { url: null } } });
      case "POST /complete": {
        if (this.failComplete) return reply(500, { message: "Internal error" });
        const a = cart.shipping_address;
        if (!cart.email || !a?.first_name || !a.address_1 || !a.postal_code || !a.phone || !cart.shipping_option_id) {
          return reply(400, { message: "Missing customer information", code: "customer_information_missing" });
        }
        cart.completed = true;
        const order: FakeOrder = {
          id: `order_${this.orders.length + 1}`,
          items: cart.items.map(({ variant_id, quantity }) => ({ variant_id, quantity })),
          email: cart.email,
          shipping_address: cart.shipping_address,
          billing_address: cart.billing_address,
          shipping_option_id: cart.shipping_option_id,
          codes: cart.codes,
          provider_id: cart.provider_id,
          ...this.totals(cart),
        };
        this.orders.push(order);
        return reply(200, { data: this.view(cart), order: { id: order.id } });
      }
    }
    return reply(404, { message: `No fake for ${action}` });
  }
}
