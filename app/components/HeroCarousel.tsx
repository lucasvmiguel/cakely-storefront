import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { home } from "~/content/site";
import { ResponsiveImage } from "./ResponsiveImage";

const slides = home.hero;

export function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback((delta: number) => setActive((i) => (i + delta + slides.length) % slides.length), []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => go(1), 6000);
    return () => clearInterval(id);
  }, [paused, go, active]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      className="skeleton aspect-[4/3] w-full overflow-hidden sm:aspect-[16/9] md:aspect-[16/6]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.headline}
          aria-roledescription="slide"
          aria-hidden={i !== active}
          inert={i !== active}
          className={`absolute inset-0 transition-opacity duration-700 ${i === active ? "opacity-100" : "opacity-0"}`}
        >
          <ResponsiveImage image={slide.image} priority={i === 0} className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-black/30" />
          <div
            className={`absolute inset-0 flex items-center ${slide.align === "center" ? "justify-center text-center" : "justify-start text-left"}`}
          >
            <div className={`flex max-w-3xl flex-col gap-6 px-12 md:px-20 ${slide.align === "center" ? "items-center" : "items-start"}`}>
              {i === 0 ? (
                <h2 className="text-4xl font-bold text-peach drop-shadow-lg">{slide.headline}</h2>
              ) : (
                <p className="text-4xl font-bold text-peach drop-shadow-lg">{slide.headline}</p>
              )}
              <Link
                to={slide.href}
                className="rounded-md bg-peach px-6 py-2.5 text-sm font-semibold text-primary transition-opacity hover:opacity-90 md:px-8 md:py-3 md:text-base"
              >
                {slide.cta}
              </Link>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        aria-label="Previous slide"
        onClick={() => go(-1)}
        className="absolute left-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={() => go(1)}
        className="absolute right-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
      >
        <ChevronRight className="size-5" />
      </button>
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2">
        {slides.map((s, i) => (
          <button
            key={s.headline}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === active}
            onClick={() => setActive(i)}
            className="flex size-6 items-center justify-center"
          >
            <span className={`size-2.5 rounded-full transition-colors ${i === active ? "bg-white" : "bg-white/50"}`} />
          </button>
        ))}
      </div>
    </section>
  );
}
