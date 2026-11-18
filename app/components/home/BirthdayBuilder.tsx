// "Build your birthday box": pick the 10 cakes that go in a Birthday Special.
// The mix is saved next to the basket (lib/birthday-mix) and sent with the
// order. Boxes added elsewhere without a mix are mixed by the bakery.
import { Minus, PartyPopper, Plus, Shuffle } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router";
import { home } from "~/content/site";
import { track } from "~/lib/analytics";
import { BIRTHDAY_SIZE, useBirthdayMixes, type Mix } from "~/lib/birthday-mix";
import { useCart } from "~/lib/cart";
import { effectivePrice, type Product } from "~/lib/catalog";
import { productImage } from "~/lib/images";
import { formatMoney } from "~/lib/money";
import { CakePhoto, cakeHref, HOME_LIST, type HomeData } from "./kit";

function shuffle<T>(items: T[]) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Ten picks spread as evenly as possible over the flavours, in random order. */
function surprisePicks(cakes: Product[]) {
  const flavours = shuffle(cakes);
  return shuffle(Array.from({ length: BIRTHDAY_SIZE }, (_, i) => flavours[i % flavours.length].variantId));
}

const toMix = (picks: string[]): Mix => {
  const mix: Mix = {};
  for (const id of picks) mix[id] = (mix[id] ?? 0) + 1;
  return mix;
};

function Slots({ jars, size = "lg" }: { jars: Product[]; size?: "sm" | "lg" }) {
  return (
    <ul className={`grid grid-cols-5 ${size === "lg" ? "gap-2" : "gap-1.5"}`} aria-hidden="true">
      {Array.from({ length: BIRTHDAY_SIZE }, (_, i) => {
        const p = jars[i];
        return p ? (
          <li key={`${p.id}-${i}`} className="pop-in aspect-square overflow-hidden rounded-full bg-peach" style={{ "--i": 0 } as CSSProperties}>
            <img src={productImage(p.images[0] ?? "", 120)} alt="" width={120} height={120} className="photo-blend size-full object-cover" />
          </li>
        ) : (
          <li key={`empty-${i}`} className="flex aspect-square items-center justify-center rounded-full border-2 border-dashed border-current/25 opacity-60">
            <span className="text-[0.65rem] font-bold">{i + 1}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function BirthdayBuilder({ cakes, birthday }: Pick<HomeData, "cakes" | "birthday">) {
  const { lines, add } = useCart();
  const [mixes, saveMixes] = useBirthdayMixes();
  // Variant ids in the order they were picked, so jars fill the box in turn.
  const [picks, setPicks] = useState<string[]>([]);
  const timers = useRef<number[]>([]);
  const stopFilling = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => stopFilling, []);

  if (!birthday || cakes.length === 0) return null;

  const mix = toMix(picks);
  const count = picks.length;
  const left = BIRTHDAY_SIZE - count;
  const jars = picks.map((id) => cakes.find((c) => c.variantId === id)).filter((c): c is Product => !!c);
  const price = formatMoney(effectivePrice(birthday), birthday.currency);
  const inBasket = lines.find((l) => l.variantId === birthday.variantId)?.quantity ?? 0;

  const change = (c: Product, delta: number) => {
    stopFilling();
    setPicks((p) => {
      if (delta > 0) return p.length >= BIRTHDAY_SIZE ? p : [...p, c.variantId];
      const at = p.lastIndexOf(c.variantId);
      return at < 0 ? p : [...p.slice(0, at), ...p.slice(at + 1)];
    });
  };

  // Empties the box, then drops the new jars in one by one so it's clear the
  // whole box was shuffled (all at once for reduced motion).
  const surprise = () => {
    stopFilling();
    const next = surprisePicks(cakes);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setPicks(next);
    setPicks([]);
    next.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => setPicks(next.slice(0, i + 1)), 250 + i * 90));
    });
  };

  const startOver = () => {
    stopFilling();
    setPicks([]);
  };

  const addBox = () => {
    // Line the mixes up with the boxes already in the basket first, so this
    // mix belongs to the box being added.
    const aligned = Array.from({ length: inBasket }, (_, i) => mixes[i] ?? {});
    saveMixes([...aligned, mix]);
    add(birthday.variantId);
    track.addToCart(birthday, 1, HOME_LIST);
    setPicks([]);
  };

  return (
    <section
      id="build"
      aria-labelledby="party-title"
      className="scroll-mt-20 bg-lavender"
    >
      <div className="container grid max-w-7xl gap-10 pb-20 pt-10 md:pt-16 lg:grid-cols-[1.35fr_1fr] lg:gap-14">
        <div>
          <p className="reveal mb-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-peach">
            <PartyPopper className="size-4" aria-hidden="true" /> {home.birthday.eyebrow}<span className="hidden sm:inline"> · our best seller</span>
          </p>
          <h2 id="party-title" className="reveal mb-4 text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[0.95] tracking-[-0.045em]">
            {home.birthday.title[0]}
            <br />
            <span className="text-plum">{home.birthday.title[1]}</span>
          </h2>
          <p className="reveal mb-6 max-w-lg text-lg text-primary/80">
            {home.birthday.body(price)}
          </p>

          <p className="mb-3 text-sm font-semibold text-plum" aria-hidden="true">
            {count} / {BIRTHDAY_SIZE} picked
          </p>
          <ul className="flex flex-col gap-3" aria-label="Flavours for your birthday box">
            {cakes.map((cake) => {
              const n = mix[cake.variantId] ?? 0;
              return (
                <li key={cake.id} className="reveal grid grid-cols-[4.5rem_1fr_auto] items-center gap-4 rounded-3xl bg-background p-3 sm:grid-cols-[5.5rem_1fr_auto]">
                  <div className="skeleton aspect-square overflow-hidden rounded-2xl bg-peach">
                    <CakePhoto product={cake} sizes="88px" className="absolute inset-0 size-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold leading-tight">
                      <Link to={cakeHref(cake)} prefetch="intent" onClick={() => track.selectItem(HOME_LIST, cake)} className="hover:underline">
                        {cake.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-primary/75">{n > 0 ? `${n} in your box` : "Not in your box yet"}</p>
                  </div>
                  <div role="group" aria-label={`${cake.title} in your birthday box`} className="flex items-center gap-1 rounded-full bg-lavender p-1">
                    <button
                      type="button"
                      aria-label={`One less ${cake.title}`}
                      disabled={n === 0}
                      onClick={() => change(cake, -1)}
                      className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-background disabled:opacity-30"
                    >
                      <Minus className="size-4" aria-hidden="true" />
                    </button>
                    <span className="min-w-6 text-center font-bold tabular-nums">{n}</span>
                    <button
                      type="button"
                      aria-label={`One more ${cake.title}`}
                      disabled={left === 0}
                      onClick={() => change(cake, 1)}
                      className="flex size-9 items-center justify-center rounded-full bg-primary text-peach transition-transform hover:scale-105 disabled:opacity-30"
                    >
                      <Plus className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <aside aria-label="Your birthday box">
          <div className="rounded-[2rem] bg-primary p-5 text-peach shadow-2xl shadow-primary/25 md:p-6 lg:sticky lg:top-24">
            <div className="mb-4 flex items-baseline justify-between gap-2">
              <h3 className="text-xl font-bold">Your birthday box</h3>
              <span className="text-sm text-lavender" aria-live="polite">
                {count} / {BIRTHDAY_SIZE}
              </span>
            </div>
            <Slots jars={jars} />
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={surprise}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-peach/15 px-4 text-sm font-semibold transition-colors hover:bg-peach/25"
              >
                <Shuffle className="size-4" aria-hidden="true" /> Surprise me
              </button>
              {count > 0 && (
                <button type="button" onClick={startOver} className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-lavender hover:text-peach">
                  Start over
                </button>
              )}
            </div>
            <div className="mt-5 border-t border-peach/15 pt-4">
              <div className="mb-3 flex items-baseline justify-end">
                <span className="text-2xl font-bold">{price}</span>
              </div>
              <p className="mb-4 min-h-5 text-sm text-lavender" aria-live="polite">
                {left === BIRTHDAY_SIZE ? "" : left > 0 ? `${left} more to go.` : "Your box is full. Ready for the party!"}
              </p>
              <button
                type="button"
                disabled={left > 0 || !birthday.available}
                onClick={addBox}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-peach font-bold text-primary transition-transform enabled:hover:scale-[1.02] disabled:opacity-40"
              >
                <Plus className="size-4" aria-hidden="true" /> Add birthday box · {price}
              </button>
            </div>

          </div>
        </aside>
      </div>
    </section>
  );
}
