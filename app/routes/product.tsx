import { ChevronRight, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { data, Link } from "react-router";
import type { Route } from "./+types/product";
import { AddToBasketButton, Price, ProductCard } from "~/components/ProductCard";
import { track } from "~/lib/analytics";
import { ProductGallery } from "~/components/ProductGallery";
import { site } from "~/content/site";
import { effectivePrice, htmlToText } from "~/lib/catalog";
import { getProductBySlug, getRelated } from "~/lib/hostinger.server";
import { HANDLING_DAYS } from "~/lib/delivery";
import { EUR, formatMoney, toDecimal } from "~/lib/money";
import { absolute, breadcrumbLd, pageMeta, siteUrlFrom } from "~/lib/seo";

export async function loader({ params }: Route.LoaderArgs) {
  const product = await getProductBySlug(params.slug);
  if (!product) throw data("Not Found", { status: 404 });
  const related = await getRelated(product);
  return { product, related };
}

export function meta({ matches, loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: "Page not found | Cakely" }, { name: "robots", content: "noindex" }];
  const { product: p } = loaderData;
  const siteUrl = siteUrlFrom(matches);
  const path = `/products/${p.slug}`;
  const description = metaDescription(htmlToText(p.descriptionHtml) || p.subtitle);

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${siteUrl}${path}#product`,
    name: p.title,
    description: htmlToText(p.descriptionHtml) || p.subtitle,
    image: p.images,
    sku: p.sku ?? undefined,
    url: `${siteUrl}${path}`,
    brand: { "@type": "Brand", name: site.name },
    category: "Cakes in a jar",
    ...(p.flavour ? { additionalProperty: [{ "@type": "PropertyValue", name: "Flavour", value: p.flavour }] } : {}),
    offers: {
      "@type": "Offer",
      url: `${siteUrl}${path}`,
      priceCurrency: p.currency.code.toUpperCase(),
      price: toDecimal(effectivePrice(p), p.currency),
      availability: p.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": `${siteUrl}/#organization`, "@type": "Organization", name: site.name },
      ...(p.pricePerKg
        ? {
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: toDecimal(p.pricePerKg, p.currency),
              priceCurrency: p.currency.code.toUpperCase(),
              referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "KGM" },
            },
          }
        : {}),
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: toDecimal(site.shippingPrice, EUR), currency: "EUR" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "NL" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: HANDLING_DAYS.min,
            maxValue: HANDLING_DAYS.max,
            unitCode: "DAY",
          },
          // Same-day local delivery once the cakes leave the kitchen.
          transitTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 0, unitCode: "DAY" },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "NL",
        returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
        url: `${siteUrl}/return-policy`,
      },
    },
  };

  return pageMeta({
    siteUrl,
    title: `${p.title} | Cakely`,
    description,
    path,
    markdownPath: `${path}.md`,
    image: p.images[0] ? absolute(siteUrl, p.images[0]) : undefined,
    type: "product",
    jsonLd: [
      productLd,
      breadcrumbLd(siteUrl, [
        { name: "Home", path: "/" },
        { name: p.title, path },
      ]),
    ],
  }).concat([
    { property: "product:price:amount", content: toDecimal(effectivePrice(p), p.currency) },
    { property: "product:price:currency", content: p.currency.code.toUpperCase() },
  ]);
}

/** First sentences of the description, trimmed to ~160 characters. */
function metaDescription(text: string) {
  const first = text.split("\n")[0];
  if (first.length <= 160) return first;
  const cut = first.slice(0, 157);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

const ALLOWED_TAGS = new Set(["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "h2", "h3", "h4", "span"]);

/**
 * Only allow the handful of tags Hostinger's editor produces. Allowed tags are
 * rebuilt without any attributes, so no event handler or URL can get through.
 */
function sanitize(html: string) {
  return html
    .replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(\/?)([a-z][a-z0-9]*)\b[^>]*>/gi, (_, slash: string, name: string) =>
      ALLOWED_TAGS.has(name.toLowerCase()) ? `<${slash}${name.toLowerCase()}>` : "",
    )
    // Any "<" left over isn't one of the tags above: show it as text.
    .replace(/<(?!\/?[a-z0-9]+>)/gi, "&lt;")
    .replace(/<p>\s*<\/p>/gi, "");
}

const RELATED_LIST = "Related products";

export default function ProductPage({ loaderData }: Route.ComponentProps) {
  const { product: p, related } = loaderData;

  useEffect(() => {
    track.viewItem(p);
    track.viewItemList(RELATED_LIST, related);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.id]);

  // Mobile: sticky "Add to Basket" bar once the main button scrolls away.
  const [showSticky, setShowSticky] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <section className="pt-4 pb-2 md:py-24">
        <div className="container flex flex-col gap-6 md:flex-row md:gap-8 xl:gap-20">
          <div className="flex-1 md:sticky md:top-24 md:self-start lg:top-32">
            <ProductGallery images={p.images} title={p.title} />
          </div>

          <div className="flex flex-col gap-4 md:w-[42%]">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground">
                Home
              </Link>
              <ChevronRight className="size-3.5" />
              <span className="text-foreground" aria-current="page">
                {p.title}
              </span>
            </nav>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Cakely</p>
            <h1 className="font-serif text-[2rem] leading-tight">{p.title}</h1>
            <div>
              <Price product={p} className="text-2xl font-medium" />
              {p.pricePerKg && (
                <p className="text-sm text-muted-foreground">({formatMoney(p.pricePerKg, p.currency)} per kg)</p>
              )}
            </div>
            <AddToBasketButton product={p} size="lg" />
            <div
              className="prose-cakely text-base leading-relaxed text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: sanitize(p.descriptionHtml) }}
            />
            {p.flavour && (
              <details className="group border-y">
                <summary className="flex list-none items-center justify-between py-4 text-xl font-medium [&::-webkit-details-marker]:hidden">
                  Product Characteristics
                  <Plus className="size-5 group-open:hidden" />
                  <Minus className="hidden size-5 group-open:block" />
                </summary>
                <p className="pb-4 text-muted-foreground">
                  <span className="font-medium text-foreground">Flavour:</span> {p.flavour}
                </p>
              </details>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="py-16">
          <div className="container">
            <h2 className="mb-10 text-3xl font-bold animate-fade-up">Customers who bought this also bought</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
              {related.map((r, i) => (
                <div key={r.id} className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                  <ProductCard product={r} listName={RELATED_LIST} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t bg-background p-4 transition-all duration-300 md:hidden ${
          showSticky ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
        }`}
      >
        <AddToBasketButton product={p} size="lg" />
      </div>
    </>
  );
}
