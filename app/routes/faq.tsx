import { ChevronDown, Mail, Phone, Search } from "lucide-react";
import { useState } from "react";
import type { Route } from "./+types/faq";
import { faq } from "~/content/faq";
import { site } from "~/content/site";
import { breadcrumbLd, pageMeta, siteUrlFrom } from "~/lib/seo";

export function meta({ matches }: Route.MetaArgs) {
  const siteUrl = siteUrlFrom(matches);
  return pageMeta({
    siteUrl,
    title: "Frequently Asked Questions | Cakely",
    description: "Answers about Cakely deliveries in Amsterdam, payment, allergens, delivery times and returning your cake jars.",
    path: "/faq",
    markdownPath: "/faq.md",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.items.map((i) => ({
          "@type": "Question",
          name: i.q,
          acceptedAnswer: { "@type": "Answer", text: i.a },
        })),
      },
      breadcrumbLd(siteUrl, [
        { name: "Home", path: "/" },
        { name: "FAQ", path: "/faq" },
      ]),
    ],
  });
}

export default function Faq() {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const items = faq.items.filter((i) => !needle || `${i.q} ${i.a}`.toLowerCase().includes(needle));

  return (
    <section className="container max-w-3xl py-16">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-medium tracking-tight md:text-5xl">{faq.title}</h1>
        <p className="mt-3 text-muted-foreground">{faq.subtitle}</p>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for answers..."
          aria-label="Search for answers"
          className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <h2 className="mb-2 text-xl font-semibold">{faq.category}</h2>
      <div>
        {items.map((i) => (
          <details key={i.q} className="group border-b">
            <summary className="flex list-none items-center justify-between gap-4 py-4 text-left font-medium hover:underline [&::-webkit-details-marker]:hidden">
              {i.q}
              <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <p className="pb-4 text-muted-foreground">{i.a}</p>
          </details>
        ))}
        {!items.length && <p className="py-6 text-center text-muted-foreground">No answers match “{query}”.</p>}
      </div>

      <div className="mt-12 rounded-xl border p-8 text-center">
        <h2 className="text-xl font-semibold">Still need help?</h2>
        <p className="mt-1 text-muted-foreground">Our support team is here for you.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <a href={`mailto:${site.email}`} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Mail className="size-4" /> Email Us
          </a>
          <a href={site.phoneHref} className="inline-flex h-9 items-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted">
            <Phone className="size-4" /> Call Us
          </a>
        </div>
      </div>
    </section>
  );
}
