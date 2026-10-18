// On-site checkout against the Hostinger Storefront API (runs in the browser;
// the API is public with open CORS). Flow:
//   create cart → set address + shipping → (discount code) → payment session
//   → complete → order.
import type { CartLine } from "./cart";
import { HOSTINGER_API } from "./config";

const PRIVATE_API = HOSTINGER_API.replace(/\/v2$/, "");

export type HostingerCart = {
  id: string;
  email: string | null;
  total: number;
  shipping_total: number;
  discount_total: number;
  items: { variant_id: string | null; quantity: number; unit_price: number | null }[];
  discounts: { code: string | null; amount: number | null }[] | null;
  shipping_methods: { shipping_option_id: string | null; name: string | null; amount: number | null }[] | null;
};

export type ShippingOption = { id: string; name: string | null; amount: number | null };

export type Address = {
  first_name: string;
  last_name: string;
  phone: string;
  address_1: string;
  apartment?: string;
  address_2?: string;
  city: string;
  postal_code: string;
  country_code: string;
};

export type Order = { id: string };

export class CheckoutError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | null,
  ) {
    super(message);
  }
}

async function call<T>(url: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  const headers: Record<string, string> = { accept: "application/json" };
  if (init.body) headers["content-type"] = "application/json";
  if (init.token) headers.authorization = `Bearer ${init.token}`;
  const res = await fetch(url, { ...init, headers });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new CheckoutError(body?.message ?? `Request failed (${res.status})`, res.status, body?.code ?? null);
  }
  return body as T;
}

export type Session = { cartId: string; token: string };

export async function createCart(salesChannelId: string, lines: CartLine[]) {
  const origin = window.location.origin;
  const body = await call<{ data: HostingerCart; cart_token: string }>(
    `${HOSTINGER_API}/channels/${salesChannelId}/carts`,
    {
      method: "POST",
      body: JSON.stringify({
        items: lines.map((l) => ({ variant_id: l.variantId, quantity: l.quantity })),
        success_url: `${origin}/checkout/success`,
        cancel_url: `${origin}/checkout`,
        locale: "en",
        time_zone: "Europe/Amsterdam",
      }),
    },
  );
  return { session: { cartId: body.data.id, token: body.cart_token }, cart: body.data };
}

export async function getCart(s: Session) {
  return (await call<{ data: HostingerCart }>(`${HOSTINGER_API}/carts/${s.cartId}`, { token: s.token })).data;
}

export async function updateCart(
  s: Session,
  patch: { email?: string; shipping_address?: Partial<Address>; billing_address?: Partial<Address> },
) {
  return (
    await call<{ data: HostingerCart }>(`${HOSTINGER_API}/carts/${s.cartId}`, {
      method: "PATCH",
      token: s.token,
      body: JSON.stringify(patch),
    })
  ).data;
}

export async function shippingOptions(s: Session) {
  return (await call<{ data: ShippingOption[] }>(`${HOSTINGER_API}/carts/${s.cartId}/shipping-options`, { token: s.token }))
    .data;
}

export async function setShippingMethod(s: Session, optionId: string) {
  return (
    await call<{ data: HostingerCart }>(`${HOSTINGER_API}/carts/${s.cartId}/shipping-method`, {
      method: "PUT",
      token: s.token,
      body: JSON.stringify({ option_id: optionId }),
    })
  ).data;
}

/**
 * Applies discount codes (an empty list removes them). The documented API has
 * no discount endpoint, so this uses the one Hostinger's own hosted checkout
 * calls. It isn't part of the public API and could change.
 */
export async function setDiscountCodes(s: Session, codes: string[]) {
  await call(`${PRIVATE_API}/store/carts/${s.token}`, {
    method: "POST",
    body: JSON.stringify({ discounts: codes.map((code) => ({ code })) }),
  });
  return getCart(s);
}

/** Starts the payment and places the order. */
export async function placeOrder(s: Session, providerId: string): Promise<Order> {
  const session = await call<{
    data: { status: string; data: { url?: string | null; payment_intent_client_secret?: string | null } | null };
  }>(`${HOSTINGER_API}/carts/${s.cartId}/payment-session`, {
    method: "POST",
    token: s.token,
    body: JSON.stringify({ provider_id: providerId }),
  });
  if (session.data.data?.payment_intent_client_secret) {
    // Card payments need Stripe's payment form, which this checkout doesn't
    // include yet (see README).
    throw new CheckoutError("This payment method isn't supported here yet.", 400, "unsupported_provider");
  }
  const done = await call<{ data: HostingerCart; order?: { id?: string } }>(
    `${HOSTINGER_API}/carts/${s.cartId}/complete`,
    { method: "POST", token: s.token, body: "{}" },
  );
  return { id: done.order?.id ?? s.cartId };
}
