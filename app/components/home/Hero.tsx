// Home page hero: headline and calls to action on the left; on desktop two
// columns of jar cards roll up and down on the right (sliding out from under
// the ticker below), on phones one row rolls sideways.
import { ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";
import { Link } from "react-router";
import { home } from "~/content/site";
import { track } from "~/lib/analytics";
import { effectivePrice, type Product } from "~/lib/catalog";
import { productImage, stopSkeleton } from "~/lib/images";
import { formatMoney } from "~/lib/money";
import { cakeHref, fromPrice, HOME_LIST, useHydrated, WordCycle, type HomeData } from "./kit";

// The rolling rows need their items twice (or more) to loop seamlessly. The
// server sends them once, which keeps the HTML small for the first paint; the
// loop copies are added right after hydration.

/** One column of the moving jar wall. */
function JarColumn({ cakes, reverse, duration }: { cakes: Product[]; reverse?: boolean; duration: string }) {
  const hydrated = useHydrated();
  const items = hydrated ? [...cakes, ...cakes] : cakes;
  return (
    <div className="h-full overflow-hidden">
      <div className={reverse ? "marquee-y-reverse" : "marquee-y"} style={{ "--marquee-duration": duration } as CSSProperties}>
        {items.map((c, i) => (
          <div key={`${c.id}-${i}`} className="relative mb-4 aspect-square overflow-hidden rounded-[2rem] bg-peach">
            <img src={productImage(c.images[0] ?? "", 320)} alt="" width={320} height={320} loading="lazy" className="photo-blend size-full object-cover" />
            <span className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-peach">
              <span className="truncate">{c.title}</span>
              <span className="shrink-0 font-medium text-lavender">{formatMoney(effectivePrice(c), c.currency)}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A row of jar cards that rolls sideways forever. The second copy is only
 *  there for the loop, so it is hidden from screen readers and the keyboard. */
function JarRow({ items, reverse = false, duration }: { items: Product[]; reverse?: boolean; duration: string }) {
  // Each copy must be wider than the widest screen (~240px a card), or the
  // loop shows a gap; short lists are repeated until it is.
  const hydrated = useHydrated();
  const repeat = hydrated ? Math.max(1, Math.ceil(10 / Math.max(1, items.length))) : 1;
  const filled = Array.from({ length: repeat }, () => items).flat();
  const row = (copy: boolean) => (
    <ul aria-hidden={copy || undefined} className="flex shrink-0 gap-4 pr-4">
      {filled.map((c, i) => (
        <li key={`${c.id}-${i}`} aria-hidden={(!copy && i >= items.length) || undefined} className="w-44 shrink-0 sm:w-56">
          <Link
            to={cakeHref(c)}
            prefetch="intent"
            tabIndex={copy || i >= items.length ? -1 : undefined}
            onClick={() => track.selectItem(HOME_LIST, c)}
            className="group block overflow-hidden rounded-[1.75rem] bg-peach p-2 text-primary transition-transform duration-300 hover:-translate-y-1 hover:-rotate-1"
          >
            <span className="skeleton block aspect-square overflow-hidden rounded-[1.4rem] bg-background">
              {/* One fixed size (2x the card) instead of a srcset: there are many of these. */}
              <img
                ref={stopSkeleton}
                src={productImage(c.images[0] ?? "", 448)}
                alt={copy || i >= items.length ? "" : c.title}
                width={224}
                height={224}
                loading="lazy"
                className="photo-blend absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </span>
            <span className="flex items-center justify-between gap-2 px-2 pb-1 pt-2 text-sm font-bold">
              <span className="truncate">{c.title}</span>
              <span className="shrink-0 font-semibold text-plum">{formatMoney(effectivePrice(c), c.currency)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="marquee overflow-hidden" style={{ "--marquee-duration": duration } as CSSProperties}>
      <div className="marquee-track" style={reverse ? { animationDirection: "reverse" } : undefined}>
        {row(false)}
        {hydrated && row(true)}
      </div>
    </div>
  );
}

export function Hero({ cakes, birthday }: Pick<HomeData, "cakes" | "birthday">) {
  const hydrated = useHydrated();
  const from = fromPrice(cakes);
  const rolling = [...cakes, ...(birthday ? [birthday] : [])];
  return (
    <section className="relative overflow-hidden bg-primary pt-16 text-peach">
      <div className="pointer-events-none absolute -right-40 -top-40 size-[36rem] rounded-full bg-plum/40 blur-3xl" aria-hidden="true" />
      <div className="container relative grid max-w-7xl gap-10 lg:h-[min(calc(100svh-4rem),50rem)] lg:min-h-[38rem] lg:grid-cols-[1.15fr_1fr]">
        <div className="flex flex-col items-start justify-center gap-6 py-10 md:py-14">
          <p className="rise-in inline-flex items-center gap-2 rounded-full border border-peach/25 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-lavender">
            {home.eyebrow}
          </p>
          <h1 className="text-[clamp(2.75rem,6.5vw,5.5rem)] font-bold leading-[0.95] tracking-[-0.04em]">
            <span className="rise-in block" style={{ "--i": 1 } as CSSProperties}>
              {home.headline[0]}{" "}
            </span>
            <span className="rise-in block text-lavender/90" style={{ "--i": 2 } as CSSProperties}>
              {home.headline[1]}
            </span>
            <span className="sr-only"> Premium mini cakes, delivered in Amsterdam.</span>
          </h1>
          <p className="rise-in text-lg text-lavender md:text-xl" style={{ "--i": 3 } as CSSProperties}>
            {home.plan.lead}{" "}
            <WordCycle words={home.plan.words} label={home.plan.summary} className="font-semibold text-peach" />
            <br />
            {home.plan.tail}
          </p>
          <div className="rise-in flex flex-wrap gap-3" style={{ "--i": 4 } as CSSProperties}>
            <a href="#flavours" className="group inline-flex h-13 items-center gap-2 rounded-full bg-peach px-7 font-bold text-primary transition-transform hover:scale-[1.03]">
              See the cakes{from && <span className="font-medium opacity-80">· from {from}</span>}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </a>
            {birthday && (
              <Link
                to={cakeHref(birthday)}
                prefetch="intent"
                className="inline-flex h-13 items-center gap-2 rounded-full border-2 border-peach/40 px-6 font-semibold transition-colors hover:border-peach hover:bg-peach/10"
              >
                🎉 Birthday Special · {formatMoney(effectivePrice(birthday), birthday.currency)}
              </Link>
            )}
          </div>
        </div>

        {/* Desktop: two columns of jars rolling up and down, sliding out from under the ticker (decorative; the gallery below lists every cake) */}
        <div
          aria-hidden="true"
          className="rise-in hidden h-full grid-cols-2 gap-4 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_12%)] lg:grid"
          style={{ "--i": 3 } as CSSProperties}
        >
          {/* Decorative and desktop-only, so it's left out of the server HTML
              (its box keeps its size, so nothing moves when it appears). */}
          {hydrated && (
            <>
              <JarColumn cakes={rolling} duration="38s" />
              <JarColumn cakes={[...rolling].reverse()} duration="46s" reverse />
            </>
          )}
        </div>
      </div>

      {/* Phones: one row of jar cards rolling sideways */}
      <div
        className="rise-in pb-10 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] lg:hidden"
        style={{ "--i": 4 } as CSSProperties}
        aria-label="Our cakes"
        role="region"
      >
        <JarRow items={rolling} duration={`${Math.max(24, rolling.length * 7)}s`} />
      </div>
    </section>
  );
}
