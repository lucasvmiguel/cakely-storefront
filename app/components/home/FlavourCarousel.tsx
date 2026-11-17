// "The flavours": one colour panel per cake, side by side. Phones swipe; on
// desktop arrow buttons (or the arrow keys, once focused) move one panel at a
// time. Ends with a Birthday Special panel pointing at the birthday builder.
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { home } from "~/content/site";
import { track } from "~/lib/analytics";
import { effectivePrice, htmlToText } from "~/lib/catalog";
import { formatMoney } from "~/lib/money";
import { CakePhoto, cakeHref, HOME_LIST, QuickAdd, type HomeData } from "./kit";

const panelTones = [
  { bg: "bg-peach", text: "text-primary", tile: "bg-background", tone: "dark" as const },
  { bg: "bg-lavender", text: "text-primary", tile: "bg-background", tone: "dark" as const },
  { bg: "bg-plum", text: "text-peach", tile: "bg-peach", tone: "light" as const },
  { bg: "bg-background", text: "text-primary", tile: "bg-peach", tone: "dark" as const },
];

function useCarousel() {
  const ref = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({ atStart: el.scrollLeft < 8, atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  /** Moves one panel left (-1) or right (1). */
  const go = (dir: 1 | -1) => {
    const el = ref.current;
    const panel = el?.firstElementChild as HTMLElement | null;
    if (!el || !panel) return;
    const step = panel.getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap || "0");
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * step, behavior: smooth ? "smooth" : "auto" });
  };

  return { ref, go, ...edges };
}

const arrow =
  "absolute top-1/2 z-10 hidden size-14 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-peach shadow-xl shadow-primary/30 transition-[transform,opacity] hover:scale-110 disabled:pointer-events-none disabled:opacity-0 md:flex";

export function FlavourCarousel({ cakes, birthday, partyHref = "#build" }: Pick<HomeData, "cakes" | "birthday"> & { partyHref?: string }) {
  const bdayPrice = birthday ? formatMoney(effectivePrice(birthday), birthday.currency) : null;
  const panels = cakes.length + (birthday ? 1 : 0);
  const { ref, go, atStart, atEnd } = useCarousel();

  return (
    <section id="flavours" aria-labelledby="flavours-title" className="scroll-mt-16 bg-peach">
      {/* Phones get a visible title and a swipe hint; on desktop the panels speak for themselves. */}
      <div className="px-4 pb-4 pt-12 md:sr-only">
        <h2 id="flavours-title" className="text-4xl font-bold tracking-tight">
          {home.flavours.title}
        </h2>
        <p className="mt-1 text-primary/70" aria-hidden="true">
          Swipe to see them all →
        </p>
      </div>
      <div className="relative">
        <ul
          ref={ref}
          tabIndex={0}
          aria-label="Our cakes"
          className="snap-row scroll-px-4 gap-3 px-4 pb-12 pt-2 outline-none focus-visible:ring-4 focus-visible:ring-primary/30 lg:scroll-p-0 lg:gap-0 lg:p-0"
        >
          {cakes.map((cake, i) => {
            const t = panelTones[i % panelTones.length];
            return (
              <li
                key={cake.id}
                className={`flex min-h-[34rem] w-[84vw] shrink-0 items-center rounded-[2rem] border-2 border-primary shadow-lg shadow-primary/10 md:w-[78vw] lg:h-[min(80svh,46rem)] lg:w-[76vw] lg:rounded-none lg:border-0 lg:shadow-none ${t.bg} ${t.text}`}
              >
                <div className="grid w-full items-center gap-6 px-5 py-8 md:grid-cols-2 md:px-14 md:py-12 lg:gap-14">
                  <div className={`skeleton aspect-square overflow-hidden rounded-[2.5rem] ${t.tile}`}>
                    <CakePhoto product={cake} sizes="(min-width: 1024px) 36vw, 80vw" className="absolute inset-0 size-full object-cover" />
                  </div>
                  <div className="flex flex-col items-start gap-4">
                    <span className="text-sm font-semibold uppercase tracking-[0.25em] opacity-70">
                      {String(i + 1).padStart(2, "0")} / {String(panels).padStart(2, "0")}
                    </span>
                    <h3 className="text-[clamp(2.5rem,5.5vw,5.5rem)] font-bold leading-[0.9] tracking-[-0.045em]">
                      <Link to={cakeHref(cake)} prefetch="intent" onClick={() => track.selectItem(HOME_LIST, cake)} className="hover:underline">
                        {cake.title}
                      </Link>
                    </h3>
                    {(cake.subtitle || cake.descriptionHtml) && (
                      <p className="line-clamp-3 max-w-md text-lg opacity-80">{cake.subtitle || htmlToText(cake.descriptionHtml)}</p>
                    )}
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-bold">{formatMoney(effectivePrice(cake), cake.currency)}</span>
                      <QuickAdd product={cake} tone={t.tone} className="min-w-32" />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
          {birthday && (
            <li className="flex min-h-[34rem] w-[84vw] shrink-0 items-center rounded-[2rem] border-2 border-primary bg-primary text-peach shadow-lg shadow-primary/10 md:w-[78vw] lg:h-[min(80svh,46rem)] lg:w-[76vw] lg:rounded-none lg:border-0 lg:shadow-none">
              <div className="flex w-full flex-col items-start gap-5 px-6 py-12 md:px-14">
                <span className="text-sm font-semibold uppercase tracking-[0.25em] text-lavender">
                  {String(panels).padStart(2, "0")} / {String(panels).padStart(2, "0")} · or all of them
                </span>
                <h3 className="text-[clamp(2.5rem,6vw,6rem)] font-bold leading-[0.9] tracking-[-0.045em]">Can't choose? Get ten.</h3>
                <p className="max-w-md text-lg text-lavender">The Birthday Special: 10 mini cakes, mixed flavours, {bdayPrice}.</p>
                <a href={partyHref} className="inline-flex h-12 items-center gap-2 rounded-full bg-peach px-6 font-bold text-primary">
                  See the party box <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </div>
            </li>
          )}
        </ul>
        <button type="button" aria-label="Previous cake" disabled={atStart} onClick={() => go(-1)} className={`${arrow} left-6`}>
          <ArrowLeft className="size-6" aria-hidden="true" />
        </button>
        <button type="button" aria-label="Next cake" disabled={atEnd} onClick={() => go(1)} className={`${arrow} right-6`}>
          <ArrowRight className="size-6" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
