// Building blocks shared by the home page sections.
import { Minus, Plus } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { InstagramIcon, TikTokIcon } from "~/components/icons";
import { home, site } from "~/content/site";
import { track } from "~/lib/analytics";
import { useCart } from "~/lib/cart";
import { effectivePrice, type Product } from "~/lib/catalog";
import { productImage, productSrcSet, stopSkeleton } from "~/lib/images";
import { formatMoney } from "~/lib/money";
import type { GoogleReviews } from "~/lib/google-reviews.server";

export type HomeData = {
  /** The mini cakes in stock. */
  cakes: Product[];
  birthday: Product | null;
  reviews: GoogleReviews | null;
  /** First date a new order can be delivered (ISO). */
  firstDelivery: string;
};

export const HOME_LIST = "Home";

/** False on the server and in the first client render, true after hydration.
 *  For extra markup that only matters once JavaScript runs (loop copies). */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

export const cakeHref = (p: Product) => `/products/${p.slug}`;

/** Lowest mini cake price, for "from €6.50". */
export function fromPrice(cakes: Product[]) {
  const prices = cakes.filter((c) => c.available).map(effectivePrice);
  if (!prices.length) return null;
  return formatMoney(Math.min(...prices), cakes[0].currency);
}

/** Square product photo from the catalog CDN. */
export function CakePhoto({
  product,
  sizes,
  priority = false,
  blend = true,
  className = "",
}: {
  product: Product;
  sizes: string;
  priority?: boolean;
  /** Melt the grey studio background into the tile colour (see .photo-blend). */
  blend?: boolean;
  className?: string;
}) {
  const src = product.images[0];
  if (!src) return null;
  return (
    <img
      ref={stopSkeleton}
      src={productImage(src, 640)}
      srcSet={productSrcSet(src)}
      sizes={sizes}
      alt={product.title}
      width={640}
      height={640}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      {...(priority ? { fetchPriority: "high" as const } : {})}
      className={`${blend ? "photo-blend" : ""} ${className}`}
    />
  );
}

/** "Add" button that turns into a − 2 + stepper once the cake is in the basket. */
export function QuickAdd({
  product,
  tone = "dark",
  className = "",
}: {
  product: Product;
  tone?: "dark" | "light";
  className?: string;
}) {
  const { lines, add, setQuantity } = useCart();
  const qty = lines.find((l) => l.variantId === product.variantId)?.quantity ?? 0;
  const solid = tone === "dark" ? "bg-primary text-primary-foreground" : "bg-peach text-primary";

  if (!product.available) {
    return (
      <span className={`inline-flex h-11 items-center justify-center rounded-full border border-current/20 px-4 text-sm font-medium opacity-70 ${className}`}>
        Back soon
      </span>
    );
  }
  if (qty === 0) {
    return (
      <button
        type="button"
        onClick={() => {
          add(product.variantId);
          track.addToCart(product, 1, HOME_LIST);
        }}
        className={`relative z-20 inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-transform hover:scale-[1.03] active:scale-95 ${solid} ${className}`}
      >
        <Plus className="size-4" aria-hidden="true" />
        Add<span className="sr-only"> {product.title} to basket</span>
      </button>
    );
  }
  return (
    <div
      role="group"
      aria-label={`${product.title} in basket`}
      className={`relative z-20 inline-flex h-11 items-center justify-between gap-1 rounded-full p-1 ${solid} ${className}`}
    >
      <button
        type="button"
        aria-label={`Remove one ${product.title}`}
        onClick={() => setQuantity(product.variantId, qty - 1)}
        className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-white/15"
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <span className="min-w-6 text-center text-sm font-bold tabular-nums" aria-live="polite">
        {qty}
      </span>
      <button
        type="button"
        aria-label={`Add one more ${product.title}`}
        onClick={() => {
          add(product.variantId);
          track.addToCart(product, 1, HOME_LIST);
        }}
        className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-white/15"
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

/** Cycles through words in place. The cell is as wide as the longest word, so
 *  nothing shifts; screen readers get the static `label` instead. */
export function WordCycle({ words, label, className = "" }: { words: string[]; label: string; className?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((n) => (n + 1) % words.length), 2200);
    return () => clearInterval(id);
  }, [words.length]);
  return (
    <>
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" className={`inline-grid overflow-hidden align-bottom ${className}`}>
        {words.map((w, n) => (
          <span key={w} className={`col-start-1 row-start-1 whitespace-nowrap ${n === i ? "word-in" : "invisible"}`}>
            {w}
          </span>
        ))}
      </span>
    </>
  );
}

export function Marquee({
  items,
  className = "",
  duration = "30s",
  reverse = false,
}: {
  items: string[];
  className?: string;
  duration?: string;
  /** Scroll left to right instead. */
  reverse?: boolean;
}) {
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((t) => (
        <li key={t} className="flex items-center whitespace-nowrap">
          <span className="px-6">{t}</span>
          <span aria-hidden="true">✦</span>
        </li>
      ))}
    </ul>
  );
  return (
    <div className={`marquee overflow-hidden ${className}`} style={{ "--marquee-duration": duration } as CSSProperties}>
      <div className="marquee-track" style={reverse ? { animationDirection: "reverse" } : undefined}>
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

/** The sign-off band above the footer. */
export function SignOff({ className = "" }: { className?: string }) {
  return (
    <section aria-labelledby="signoff-title" className={`overflow-hidden bg-primary text-peach ${className}`}>
      <div className="container flex flex-col items-center gap-8 py-20 text-center md:py-28">
        <h2 id="signoff-title" className="reveal flex flex-col items-center leading-none">
          <span className="font-display text-[clamp(3.5rem,16vw,11rem)] uppercase leading-[0.9]">cakely</span>{" "}
          <span className="mt-2 text-xl font-medium text-lavender md:text-3xl">{home.signoff.tagline}</span>
        </h2>
        <div className="reveal flex flex-col items-center gap-4">
          <p className="text-sm uppercase tracking-[0.25em] text-lavender/80">{home.signoff.socialsLead}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={site.socials.instagram}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-peach px-6 font-semibold text-primary transition-transform hover:-rotate-2 hover:scale-105"
            >
              <InstagramIcon className="size-5" />
              Instagram <span className="font-normal opacity-80">{home.signoff.handle}</span>
            </a>
            <a
              href={site.socials.tiktok}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-peach px-6 font-semibold transition-transform hover:rotate-2 hover:scale-105"
            >
              <TikTokIcon className="size-5" />
              TikTok <span className="font-normal opacity-80">{home.signoff.handle}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
