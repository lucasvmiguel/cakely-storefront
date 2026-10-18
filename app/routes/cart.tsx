import { Lock, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/cart";
import { useRootData } from "~/lib/root-data";
import { effectivePrice, type Product } from "~/lib/catalog";
import { startCheckout, useCart } from "~/lib/cart";
import { MIN_ORDER_AMOUNT } from "~/lib/config";
import { EUR, formatMoney } from "~/lib/money";
import { pageMeta, siteUrlFrom } from "~/lib/seo";

export function meta({ matches }: Route.MetaArgs) {
  return pageMeta({
    siteUrl: siteUrlFrom(matches),
    title: "Shopping Basket | Cakely",
    description: "Review the cakes in your basket and check out securely.",
    path: "/cart",
    noindex: true,
  });
}

export default function Cart() {
  const root = useRootData();
  const { lines, ready, setQuantity, remove } = useCart();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const byVariant = new Map<string, Product>((root?.products ?? []).map((p) => [p.variantId, p]));
  const items = lines
    .map((l) => ({ line: l, product: byVariant.get(l.variantId) }))
    .filter((i): i is { line: typeof i.line; product: Product } => !!i.product);
  const currency = items[0]?.product.currency ?? EUR;
  const subtotal = items.reduce((sum, i) => sum + effectivePrice(i.product) * i.line.quantity, 0);
  const belowMinimum = subtotal < MIN_ORDER_AMOUNT;
  const unavailable = items.some((i) => !i.product.available);

  async function checkout() {
    if (!root || belowMinimum || unavailable) return;
    setStatus("loading");
    setError(null);
    try {
      const url = await startCheckout(
        root.salesChannelId,
        items.map((i) => i.line),
      );
      window.location.assign(url);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    }
  }

  if (!ready) return <div className="min-h-[60vh]" />;

  if (!items.length) {
    return (
      <section className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <ShoppingCart className="size-7 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Your basket is empty</h1>
        <p className="text-muted-foreground">Looks like you haven't added anything yet.</p>
        <Link to="/search" className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Continue Shopping
        </Link>
      </section>
    );
  }

  return (
    <section className="container py-10 md:py-16">
      <h1 className="text-3xl font-bold">Shopping Basket</h1>
      <p className="mt-1 text-muted-foreground">Review your items and complete your purchase securely</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="h-fit divide-y rounded-xl border">
          {items.map(({ line, product: p }) => (
            <li key={line.variantId} className="flex gap-4 p-4">
              <Link to={`/products/${p.slug}`} className="size-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                {p.images[0] && <img src={p.images[0]} alt={p.title} className="size-full object-cover" />}
              </Link>
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/products/${p.slug}`} className="font-medium hover:underline">
                    {p.title}
                  </Link>
                  <span className="font-semibold">{formatMoney(effectivePrice(p) * line.quantity, p.currency)}</span>
                </div>
                <p className="text-sm text-muted-foreground">{formatMoney(effectivePrice(p), p.currency)} each</p>
                <p className={`text-xs ${p.available ? "text-green-700" : "text-red-600"}`}>
                  {p.available ? "In Stock" : "Sold out — please remove it to continue"}
                </p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-md border">
                    <button
                      type="button"
                      aria-label={`Decrease ${p.title} quantity`}
                      onClick={() => setQuantity(line.variantId, line.quantity - 1)}
                      className="flex size-8 items-center justify-center hover:bg-muted"
                    >
                      {line.quantity === 1 ? <Trash2 className="size-3.5" /> : <Minus className="size-3.5" />}
                    </button>
                    <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label={`Increase ${p.title} quantity`}
                      onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                      className="flex size-8 items-center justify-center hover:bg-muted"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <button type="button" onClick={() => remove(line.variantId)} className="text-sm text-muted-foreground underline-offset-2 hover:underline">
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-xl border p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold">Order Summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium">{formatMoney(subtotal, currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="text-muted-foreground">Calculated at checkout</dd>
            </div>
          </dl>
          <hr className="my-4" />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatMoney(subtotal, currency)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Coupons will be applied at checkout.</p>

          {belowMinimum && (
            <div className="mt-4 rounded-md bg-peach px-3 py-2 text-sm">
              Minimum order is {formatMoney(MIN_ORDER_AMOUNT, currency)}. Add{" "}
              <strong>{formatMoney(MIN_ORDER_AMOUNT - subtotal, currency)}</strong> more to check out.
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                <div className="h-full bg-primary" style={{ width: `${Math.min(100, (subtotal / MIN_ORDER_AMOUNT) * 100)}%` }} />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={checkout}
            disabled={belowMinimum || unavailable || status === "loading" || !root}
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "loading" ? "Redirecting to checkout…" : "Proceed to Checkout"}
          </button>
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3" /> Secure checkout
          </p>
          <Link to="/search" className="mt-4 block text-center text-sm underline-offset-2 hover:underline">
            Continue Shopping
          </Link>
        </aside>
      </div>
    </section>
  );
}
