import { Menu, Search, ShoppingCart, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useMatches } from "react-router";
import { site } from "~/content/site";
import { useCart } from "~/lib/cart";
import { useExperiments } from "~/lib/experiments";

const iconButton =
  "inline-flex size-9 items-center justify-center rounded-md transition-colors hover:bg-current/10";

/** Colour of the hero at the top of a page. A route opts in with
 *  `handle = { heroTone }`. The header then turns transparent and the page
 *  slides up beneath it (so the hero, glow and all, runs behind it); once
 *  scrolled it floats as a pill like on every page. Heroes on such pages add
 *  `pt-16` to clear the header. */
export type HeroTone = "dark" | "light";

const toneText: Record<HeroTone, string> = {
  dark: "text-peach",
  light: "text-foreground",
};

function useHeroTone() {
  const matches = useMatches();
  for (let i = matches.length - 1; i >= 0; i--) {
    const tone = (matches[i].handle as { heroTone?: HeroTone } | undefined)?.heroTone;
    if (tone) return tone;
  }
  return undefined;
}

function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > threshold);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [threshold]);
  return scrolled;
}

export function Header() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const location = useLocation();
  const tone = useHeroTone();
  const scrolled = useScrolled();
  // Every page floats the header as a pill once scrolled.
  const floating = scrolled;
  const blended = tone != null && !scrolled;
  // Experiment (dev only): with the lavender theme, other pages get the home
  // page's purple bar, and it stays purple as a floating pill once scrolled.
  const [{ lavenderTheme }] = useExperiments();
  const purpleBar = tone == null && lavenderTheme;
  // Peach logo and badge whenever the bar under them is purple.
  const onDark = (blended && tone === "dark") || purpleBar;

  // Close the drawer whenever we navigate.
  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-colors duration-300 ${
          tone == null
            ? floating
              ? `bg-transparent ${purpleBar ? "text-peach" : "text-foreground"}`
              : purpleBar
                ? "bg-primary text-peach"
                : "bg-peach text-foreground"
            : `-mb-16 bg-transparent ${blended ? toneText[tone] : "text-foreground"}`
        }`}
      >
        <div
          className={`relative flex items-center justify-between px-2 transition-all duration-300 sm:px-6 ${
            floating
              ? `mx-2 mt-2 h-14 rounded-full shadow-lg shadow-primary/10 ring-1 sm:mx-4 ${
                  purpleBar ? "bg-primary/95 ring-white/10" : "bg-peach/95 ring-primary/10"
                }`
              : "h-16"
          }`}
        >
          <button type="button" className={iconButton} aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
            <Menu className="size-5" />
          </button>

          <Link
            to="/"
            aria-label="Cakely home"
            className="absolute left-14 top-1/2 flex h-14 -translate-y-1/2 items-center overflow-hidden sm:left-1/2 sm:-translate-x-1/2"
          >
            <img
              src={site.logo}
              alt="Cakely"
              width={144}
              height={144}
              className={`h-36 w-auto max-w-none transition-[filter] duration-300 sm:h-44 ${onDark ? "logo-on-dark" : ""}`}
            />
          </Link>

          <div className="flex items-center gap-1">
            <Link to="/search" className={iconButton} aria-label="Search">
              <Search className="size-5" />
            </Link>
            <Link to="/cart" className={`${iconButton} relative`} aria-label={`Basket, ${count} items`}>
              <ShoppingCart className="size-5" />
              {count > 0 && (
                <span className={`absolute -right-0.5 -top-0.5 flex min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-4.5 ${onDark ? "bg-peach text-primary" : "bg-primary text-primary-foreground"}`}>
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Menu drawer */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <nav
        aria-label="Main menu"
        aria-hidden={!open}
        inert={!open}
        className={`fixed inset-y-0 left-0 z-[70] flex w-72 flex-col border-r bg-peach shadow-lg transition-transform duration-300 sm:w-80 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button type="button" className={`${iconButton} absolute right-3 top-3 size-8 opacity-70 hover:opacity-100`} aria-label="Close menu" onClick={() => setOpen(false)}>
          <X className="size-4" />
        </button>
        <div className="flex h-28 items-center justify-center overflow-hidden">
          <img src={site.logo} alt="Cakely" width={176} height={176} className="h-44 w-auto max-w-none" />
        </div>
        <ul className="border-b px-4 py-2">
          <li>
            <NavLink to="/" className="block rounded-md px-2 py-2 text-sm font-medium hover:bg-black/5">
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/search" className="block rounded-md px-2 py-2 text-sm font-medium hover:bg-black/5">
              Shop all cakes
            </NavLink>
          </li>
        </ul>
        <ul className="border-b px-4 py-2">
          <li>
            <NavLink to="/return-policy" className="block rounded-md px-2 py-2 text-sm font-semibold hover:bg-black/5">
              Return Policy
            </NavLink>
          </li>
          <li>
            <NavLink to="/faq" className="block rounded-md px-2 py-2 text-sm font-semibold hover:bg-black/5">
              FAQ
            </NavLink>
          </li>
        </ul>
      </nav>
    </>
  );
}
