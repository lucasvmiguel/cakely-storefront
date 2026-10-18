import { ChevronUp, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Form, useSubmit } from "react-router";
import type { Route } from "./+types/search";
import { ProductCard } from "~/components/ProductCard";
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
    description: "Browse all Cakely cakes in a jar — handmade in Amsterdam and delivered to your door.",
    path: "/search",
    markdownPath: "/collections.md",
    // Matches the existing robots.txt rules: search result pages aren't indexed.
    noindex: true,
  });
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details open className="group border-b py-4">
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
          <input type="number" name="min" min={0} placeholder="Min" defaultValue={filters.min ?? ""} className="h-8 w-full rounded-md border px-2 text-sm" />
          <span className="text-muted-foreground">–</span>
          <input type="number" name="max" min={0} placeholder="Max" defaultValue={filters.max ?? ""} className="h-8 w-full rounded-md border px-2 text-sm" />
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
    <section className="py-8">
      <div className="container">
        <h1 className="sr-only">Shop all cakes</h1>
        <Form method="get" className="mx-auto mb-8 flex w-full md:w-[600px]" role="search">
          <input
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder="Search products..."
            aria-label="Search products"
            className="h-10 flex-1 rounded-l-md border border-r-0 bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button type="submit" className="h-10 rounded-r-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Search
          </button>
        </Form>

        <div className="flex gap-8">
          <aside className="hidden w-56 shrink-0 lg:block">{filtersForm}</aside>

          <div className="flex-1">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowFilters((s) => !s)}
                  className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm lg:hidden"
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
                <select name="sort" defaultValue={filters.sort} aria-label="Sort by" className="h-9 rounded-md border bg-background px-3 text-sm">
                  {Object.entries(SORTS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Form>
            </div>

            {showFilters && <div className="mb-6 rounded-lg border p-4 lg:hidden">{filtersForm}</div>}

            {results.length ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 xl:grid-cols-3">
                {results.map((p) => (
                  <ProductCard key={p.id} product={p} />
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
