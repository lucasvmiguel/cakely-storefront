import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { Form, useSubmit } from "react-router";
import type { Route } from "./+types/search";
import { ProductCard } from "~/components/ProductCard";
import { track } from "~/lib/analytics";
import { effectivePrice, type Product } from "~/lib/catalog";
import { getProducts } from "~/lib/hostinger.server";
import { pageMeta, siteUrlFrom } from "~/lib/seo";

const SORTS = {
  latest: "Latest Additions",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
} as const;
type Sort = keyof typeof SORTS;

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const inStock = url.searchParams.get("in_stock") === "1";
  const flavour = url.searchParams.get("flavour") ?? "";
  const min = Number(url.searchParams.get("min")) || null;
  const max = Number(url.searchParams.get("max")) || null;
  const sortParam = url.searchParams.get("sort") ?? "latest";
  const sort: Sort = sortParam in SORTS ? (sortParam as Sort) : "latest";

  const all = await getProducts();
  const flavours = [...new Set(all.map((p) => p.flavour).filter((f): f is string => !!f))].sort();

  const needle = q.toLowerCase();
  let results = all.filter((p) => {
    const price = effectivePrice(p) / 100;
    if (needle && !`${p.title} ${p.subtitle} ${p.flavour ?? ""}`.toLowerCase().includes(needle)) return false;
    if (inStock && !p.available) return false;
    if (flavour && p.flavour !== flavour) return false;
    if (min != null && price < min) return false;
    if (max != null && price > max) return false;
    return true;
  });

  const byDate = (p: Product) => (p.updatedAt ? Date.parse(p.updatedAt) : 0);
  results = [...results].sort((a, b) =>
    sort === "price-asc"
      ? effectivePrice(a) - effectivePrice(b)
      : sort === "price-desc"
        ? effectivePrice(b) - effectivePrice(a)
        : byDate(b) - byDate(a),
  );

  return { results, flavours, filters: { q, inStock, flavour, min, max, sort } };
}

export function meta({ matches, loaderData }: Route.MetaArgs) {
  const q = loaderData?.filters.q;
  return pageMeta({
    siteUrl: siteUrlFrom(matches),
    title: q ? `Search results for “${q}” | Cakely` : "Shop all cakes | Cakely",
    description: "Browse all Cakely mini cakes — handmade in Amsterdam and delivered to your door.",
    path: "/search",
    markdownPath: "/collections.md",
    // Matches the existing robots.txt rules: search result pages aren't indexed.
    noindex: true,
  });
}

const SEARCH_LIST = "Shop all";

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details open className="group border-b border-primary/10 py-4 last:border-0">
      <summary className="flex list-none items-center justify-between text-sm font-medium [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronUp className="size-4 transition-transform group-[:not([open])]:rotate-180" />
      </summary>
      <div className="mt-3 space-y-2">{children}</div>
    </details>
  );
}

export default function Search({ loaderData }: Route.ComponentProps) {
  const { results, flavours, filters } = loaderData;
  const submit = useSubmit();
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (filters.q) track.search(filters.q);
  }, [filters.q]);

  // Re-sent when the results change, e.g. after filtering.
  const resultIds = results.map((p) => p.id).join(",");
  useEffect(() => {
    track.viewItemList(SEARCH_LIST, results);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultIds]);

  const filtersForm = (
    <Form method="get" onChange={(e) => submit(e.currentTarget, { preventScrollReset: true, replace: true })}>
      <input type="hidden" name="q" value={filters.q} />
      <input type="hidden" name="sort" value={filters.sort} />
      <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Filters</p>
      <FilterGroup title="Availability">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="in_stock" value="1" defaultChecked={filters.inStock} className="size-4 accent-primary" />
          In Stock Only
        </label>
      </FilterGroup>
      <FilterGroup title="Price">
        <div className="flex items-center gap-2">
          <input type="number" name="min" min={0} placeholder="Min" defaultValue={filters.min ?? ""} className="h-9 w-full rounded-full border border-primary/20 bg-background px-3 text-sm" />
          <span className="text-muted-foreground">–</span>
          <input type="number" name="max" min={0} placeholder="Max" defaultValue={filters.max ?? ""} className="h-9 w-full rounded-full border border-primary/20 bg-background px-3 text-sm" />
        </div>
      </FilterGroup>
      {flavours.length > 0 && (
        <FilterGroup title="Flavour">
          {flavours.map((f) => (
            <label key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="radio" name="flavour" value={f} defaultChecked={filters.flavour === f} className="size-4 accent-primary" />
              {f}
            </label>
          ))}
          {filters.flavour && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="radio" name="flavour" value="" className="size-4 accent-primary" />
              All flavours
            </label>
          )}
        </FilterGroup>
      )}
    </Form>
  );

  return (
    <section className="pb-16">
      <div className="bg-peach">
        <div className="container py-10 text-center md:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-plum">Handmade in Amsterdam</p>
          <h1 className="mt-2 text-4xl font-bold tracking-[-0.03em] md:text-6xl">Shop all cakes.</h1>
        </div>
      </div>
      <div className="container">
        <Form method="get" className="relative z-10 mx-auto -mt-6 mb-10 flex w-full rounded-full bg-background p-1.5 shadow-lg shadow-primary/10 ring-1 ring-primary/10 md:w-[600px]" role="search">
          <input
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder="Search products..."
            aria-label="Search products"
            className="h-11 min-w-0 flex-1 rounded-full bg-transparent px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />
          <button type="submit" className="h-11 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03]">
            Search
          </button>
        </Form>

        <div className="flex gap-8">
          <aside className="hidden h-fit w-60 shrink-0 rounded-3xl bg-lavender/60 p-5 lg:block">{filtersForm}</aside>

          <div className="flex-1">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowFilters((s) => !s)}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-primary/20 px-4 text-sm font-medium lg:hidden"
                  aria-expanded={showFilters}
                >
                  <SlidersHorizontal className="size-4" /> Filters
                </button>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{results.length}</span> results
                </p>
              </div>
              <Form method="get" onChange={(e) => submit(e.currentTarget, { preventScrollReset: true, replace: true })}>
                {filters.q && <input type="hidden" name="q" value={filters.q} />}
                {filters.inStock && <input type="hidden" name="in_stock" value="1" />}
                {filters.flavour && <input type="hidden" name="flavour" value={filters.flavour} />}
                {filters.min != null && <input type="hidden" name="min" value={filters.min} />}
                {filters.max != null && <input type="hidden" name="max" value={filters.max} />}
                <label className="relative inline-flex items-center">
                  <span className="mr-2 text-sm text-primary/75">Sort</span>
                  <select
                    name="sort"
                    defaultValue={filters.sort}
                    aria-label="Sort by"
                    className="h-10 cursor-pointer appearance-none rounded-full bg-lavender/60 pl-4 pr-10 text-sm font-semibold outline-none transition-colors hover:bg-lavender focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                  {Object.entries(SORTS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 size-4" aria-hidden="true" />
                </label>
              </Form>
            </div>

            {showFilters && <div className="mb-6 rounded-3xl bg-lavender/60 p-5 lg:hidden">{filtersForm}</div>}

            <h2 className="sr-only">Results</h2>
            {results.length ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-3">
                {results.map((p) => (
                  <ProductCard key={p.id} product={p} listName={SEARCH_LIST} />
                ))}
              </div>
            ) : (
              <p className="py-16 text-center text-muted-foreground">No cakes match your search.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
