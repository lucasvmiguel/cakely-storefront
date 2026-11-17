// Floating basket bar, shown on every page once something is in the basket
// (except the basket and checkout themselves). It replaces the old "Added to
// basket" toast: the total updates the moment a cake is added, and screen
// readers hear the new total. It can be closed; it then stays hidden (for the
// tab, across pages) until the basket changes again.
import { ShoppingBag, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useRouteLoaderData } from "react-router";
import { useCart } from "~/lib/cart";
import { effectivePrice, type Product } from "~/lib/catalog";
import { MIN_ORDER_AMOUNT } from "~/lib/config";
import { formatMoney } from "~/lib/money";

const HIDDEN_ON = ["/cart", "/checkout"];
const DISMISSED_KEY = "cakely-basket-bar-closed";

function readDismissed() {
  try {
    return sessionStorage.getItem(DISMISSED_KEY);
  } catch {
    return null;
  }
}

function saveDismissed(value: string) {
  try {
    sessionStorage.setItem(DISMISSED_KEY, value);
  } catch {
    // Storage unavailable: the bar stays closed for this page view only.
  }
}

/** Basket total and progress to the minimum order, from the live catalog. */
export function useBasketSummary() {
  const { lines, count, ready } = useCart();
  const root = useRouteLoaderData("root") as { products?: Product[] } | undefined;
  const products = root?.products ?? [];
  const total = lines.reduce((sum, l) => {
    const p = products.find((x) => x.variantId === l.variantId);
    return p ? sum + effectivePrice(p) * l.quantity : sum;
  }, 0);
  return { ready, count, total, missing: Math.max(0, MIN_ORDER_AMOUNT - total), currency: products[0]?.currency };
}

export function BasketBar() {
  const { ready, count, total, missing, currency } = useBasketSummary();
  const { pathname } = useLocation();
  // The basket as it was when the bar was closed; a different basket shows it again.
  const signature = `${count}:${total}`;
  const [dismissed, setDismissed] = useState<string | null>(null);
  useEffect(() => setDismissed(readDismissed()), []);
  const close = () => {
    setDismissed(signature);
    saveDismissed(signature);
  };
  // Not needed where the basket is already the page.
  const show = count > 0 && dismissed !== signature && !HIDDEN_ON.some((p) => pathname.startsWith(p));
  const progress = Math.min(1, total / MIN_ORDER_AMOUNT);
  const summary = `${count} ${count === 1 ? "cake" : "cakes"} · ${formatMoney(total, currency)}`;

  // Announce changes, not the basket that was already there on page load.
  const [announcement, setAnnouncement] = useState("");
  const lastCount = useRef<number | null>(null);
  useEffect(() => {
    if (!ready) return;
    if (lastCount.current != null && lastCount.current !== count) {
      setAnnouncement(count > 0 ? `Basket updated: ${summary}` : "Basket is empty");
    }
    lastCount.current = count;
  }, [ready, count, summary]);

  return (
    <>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <div
        aria-hidden={!show}
        inert={!show}
        className={`fixed inset-x-0 bottom-6 z-30 flex justify-center pl-4 pr-24 transition-all duration-500 md:px-4 ${
          show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-24 opacity-0"
        }`}
      >
        <div className="flex w-full max-w-xl items-center gap-2 rounded-full bg-primary py-2 pl-4 pr-1.5 sm:gap-3 text-primary-foreground shadow-2xl shadow-primary/30 sm:pl-5">
          <ShoppingBag className="hidden size-5 shrink-0 sm:block" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{summary}</p>
            {missing > 0 ? (
              <div className="mt-1 flex items-center gap-2">
                <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
                  <span
                    className="block h-full origin-left rounded-full bg-peach transition-transform duration-500"
                    style={{ transform: `scaleX(${progress})` }}
                  />
                </span>
                <span className="shrink-0 text-xs text-white/80">
                  {formatMoney(missing, currency)} to go<span className="hidden sm:inline"> for the €20 minimum</span>
                </span>
              </div>
            ) : (
              <p className="text-xs text-white/80">Ready for checkout</p>
            )}
          </div>
          <Link
            to={missing > 0 ? "/cart" : "/checkout"}
            className="inline-flex h-11 shrink-0 items-center rounded-full bg-peach px-4 text-sm font-bold text-primary transition-transform hover:scale-[1.03] sm:px-5"
          >
            {missing > 0 ? "Basket" : "Checkout"}
          </Link>
          <button
            type="button"
            onClick={close}
            aria-label="Hide basket bar"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </>
  );
}
