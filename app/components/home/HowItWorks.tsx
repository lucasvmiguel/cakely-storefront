// "How it works": three colour cards that stack on top of each other as you
// scroll, each with a small picture (the jars, the next delivery weekend,
// the delivery ticket).
import { ArrowRight, Bike, CalendarDays, Check, MapPin, Plus } from "lucide-react";
import { home } from "~/content/site";
import type { Product } from "~/lib/catalog";
import { productImage } from "~/lib/images";

const stepColors = ["bg-peach text-primary", "bg-lavender text-primary", "bg-primary text-peach"];

/** The picture on each step card. */
function StepVisual({ step, cakes, firstDelivery }: { step: number; cakes: Product[]; firstDelivery?: string }) {
  if (step === 0) {
    const three = cakes.slice(0, 3);
    if (!three.length) return null;
    return (
      <div className="flex items-center" aria-hidden="true">
        {three.map((c, i) => (
          <span
            key={c.id}
            className="-ml-5 size-16 overflow-hidden rounded-full border-[3px] border-peach bg-background shadow-lg first:ml-0 md:-ml-6 md:size-28 md:border-4"
            style={{ transform: `rotate(${(i - 1) * 8}deg) translateY(${i === 1 ? -10 : 0}px)` }}
          >
            <img src={productImage(c.images[0] ?? "", 224)} alt="" width={112} height={112} loading="lazy" className="photo-blend size-full object-cover" />
          </span>
        ))}
        <span className="-ml-3 flex size-9 items-center justify-center rounded-full bg-primary text-peach shadow-lg md:-ml-4 md:size-12">
          <Plus className="size-4 md:size-5" />
        </span>
      </div>
    );
  }
  if (step === 1) {
    const sat = firstDelivery ? new Date(`${firstDelivery}T00:00:00Z`) : null;
    const days = sat
      ? [sat, new Date(sat.getTime() + 86_400_000)].map((d) => ({
          day: d.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" }),
          date: d.toLocaleDateString("en-GB", { day: "numeric", timeZone: "UTC" }),
          month: d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }),
        }))
      : [
          { day: "Sat", date: "", month: "" },
          { day: "Sun", date: "", month: "" },
        ];
    return (
      <div className="flex flex-col items-center gap-2" aria-hidden="true">
        <div className="flex gap-2 md:gap-3">
          {days.map((d, i) => (
            <span
              key={d.day}
              className={`relative flex w-16 flex-col items-center rounded-2xl bg-background px-2 py-2 shadow-lg md:w-24 md:px-3 md:py-3 ${i === 0 ? "-rotate-3" : "rotate-3"}`}
            >
              <span className="text-[0.65rem] font-bold uppercase tracking-widest text-plum md:text-xs">{d.day}</span>
              <span className="text-2xl font-bold leading-tight md:text-4xl">{d.date || <CalendarDays className="my-1 size-8" />}</span>
              <span className="text-xs text-primary/75">{d.month}</span>
              {i === 0 && (
                <span className="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full bg-primary text-peach">
                  <Check className="size-4" />
                </span>
              )}
            </span>
          ))}
        </div>
        {firstDelivery && <span className="hidden text-xs font-semibold uppercase tracking-widest opacity-90 md:block">Next free weekend</span>}
      </div>
    );
  }
  // A delivery ticket in the calendar's style: Cakely → your door.
  return (
    <div className="relative rotate-3 rounded-2xl bg-background p-3 text-primary shadow-lg md:p-4" aria-hidden="true">
      <span className="text-[0.65rem] font-bold uppercase tracking-widest text-plum md:text-xs">Out for delivery</span>
      <div className="mt-2 flex items-center gap-2">
        <span className="size-2.5 shrink-0 rounded-full bg-primary md:size-3" />
        <span className="h-0 w-14 border-t-2 border-dashed border-primary/40 md:w-24" />
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-peach md:size-9">
          <MapPin className="size-4 md:size-5" />
        </span>
      </div>
      <div className="mt-1 flex justify-between text-[0.65rem] font-semibold md:text-xs">
        <span>Cakely</span>
        <span>Your door</span>
      </div>
      <span className="float absolute -left-3 -top-4 flex size-9 items-center justify-center rounded-full bg-peach text-primary shadow-md md:-left-4 md:-top-5 md:size-11">
        <Bike className="size-5 md:size-6" />
      </span>
    </div>
  );
}

export function HowItWorks({
  ctaHref = "#menu",
  cakes = [],
  firstDelivery,
}: {
  ctaHref?: string;
  /** For the step pictures on desktop. */
  cakes?: Product[];
  firstDelivery?: string;
}) {
  return (
    <section aria-labelledby="how-title" className="bg-background pb-20 md:pb-28">
      <div className="container max-w-5xl">
        <h2 id="how-title" className="reveal mb-10 text-center text-4xl font-bold tracking-tight md:text-6xl">
          {home.howTo.title}
        </h2>
        <ol className="flex flex-col gap-6">
          {home.howTo.steps.map((s, i) => (
            <li
              key={s.title}
              className={`sticky grid min-h-64 grid-cols-[auto_1fr] items-center gap-x-4 gap-y-6 rounded-[2rem] p-7 shadow-[0_-8px_30px_rgba(42,20,88,0.08)] md:min-h-72 md:grid-cols-[auto_1fr_auto] md:gap-10 md:p-12 ${stepColors[i]}`}
              style={{ top: `calc(6rem + ${i * 1.5}rem)` }}
            >
              <span className="text-6xl font-bold leading-none tracking-tighter md:text-9xl" aria-hidden="true">
                0{i + 1}
              </span>
              <div className="col-span-2 row-start-2 max-w-sm md:col-span-1 md:col-start-2 md:row-start-1">
                <h3 className="mb-2 text-2xl font-bold md:text-3xl">
                  <span className="sr-only">Step {i + 1}: </span>
                  {s.title}
                </h3>
                <p className="opacity-80">{s.body}</p>
              </div>
              <div className="col-start-2 row-start-1 justify-self-end md:col-start-3">
                <StepVisual step={i} cakes={cakes} firstDelivery={firstDelivery} />
              </div>
            </li>
          ))}
        </ol>
        <div className="reveal mt-12 flex justify-center">
          <a href={ctaHref} className="inline-flex h-14 items-center gap-2 rounded-full bg-primary px-8 text-lg font-bold text-primary-foreground transition-transform hover:scale-[1.04]">
            Start my order <ArrowRight className="size-5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
