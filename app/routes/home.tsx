import { useEffect } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/home";
import { FeatureBanner } from "~/components/FeatureBanner";
import { GoogleReviews } from "~/components/GoogleReviews";
import { HeroCarousel } from "~/components/HeroCarousel";
import { ProductCard } from "~/components/ProductCard";
import { ResponsiveImage } from "~/components/ResponsiveImage";
import { home, site } from "~/content/site";
import { track } from "~/lib/analytics";
import { BIRTHDAY_SLUG } from "~/lib/catalog";
import { getGoogleReviews } from "~/lib/google-reviews.server";
import { getProducts } from "~/lib/hostinger.server";
import { organizationLd, pageMeta, siteUrlFrom, websiteLd } from "~/lib/seo";

export async function loader() {
  const [products, reviews] = await Promise.all([getProducts(), getGoogleReviews()]);
  return {
    reviews,
    jars: products.filter((p) => p.slug !== BIRTHDAY_SLUG && p.slug !== home.feature.productSlug).slice(0, 4),
    feature: products.find((p) => p.slug === home.feature.productSlug) ?? null,
    birthday: products.find((p) => p.slug === BIRTHDAY_SLUG) ?? null,
  };
}

export const links: Route.LinksFunction = () => [
  {
    rel: "preload",
    as: "image",
    href: "/images/hero-1-800.webp",
    imageSrcSet: "/images/hero-1-480.webp 480w, /images/hero-1-800.webp 800w, /images/hero-1-1200.webp 1200w",
    imageSizes: "100vw",
  },
];

export function meta({ matches }: Route.MetaArgs) {
  const siteUrl = siteUrlFrom(matches);
  return pageMeta({
    siteUrl,
    title: "Cakely | Cakes in a jar, handmade in Amsterdam",
    description: site.description,
    path: "/",
    markdownPath: "/home.md",
    jsonLd: [organizationLd(siteUrl), websiteLd(siteUrl)],
  });
}

const Spacer = ({ h = "h-16" }: { h?: string }) => <div className={h} />;

const HOME_LIST = "Home";

export default function Home({ loaderData }: Route.ComponentProps) {
  const { jars, feature, birthday, reviews } = loaderData;

  useEffect(() => {
    track.viewItemList(HOME_LIST, jars);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <h1 className="sr-only">Cakely — premium cakes in a jar, handmade in Amsterdam</h1>
      <HeroCarousel />
      <Spacer />

      <section className="container">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">{home.jars.title}</h2>
          <p className="mt-2 text-lg text-muted-foreground">{home.jars.subtitle}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
          {jars.map((p) => (
            <ProductCard key={p.id} product={p} listName={HOME_LIST} />
          ))}
        </div>
      </section>
      <Spacer />

      {feature && (
        <>
          <FeatureBanner
            headline={home.feature.headline}
            cta={home.feature.cta}
            href={`/products/${feature.slug}`}
            image={home.feature.image}
          />
          <Spacer />
        </>
      )}

      <section className="container">
        <h2 className="text-center text-3xl font-bold md:text-4xl">{home.howTo.title}</h2>
        <Spacer h="h-8" />
        <div className="space-y-16">
          {home.howTo.steps.map((step, i) => (
            <div key={step.title} className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
              <div className={i % 2 === 1 ? "md:order-2" : ""}>
                <div className="skeleton aspect-[4/3] w-full overflow-hidden rounded-lg">
                  <ResponsiveImage
                    image={step.image}
                    sizes="(min-width: 1024px) 480px, (min-width: 768px) 45vw, calc(100vw - 2rem)"
                    className="absolute inset-0 size-full object-cover"
                  />
                </div>
              </div>
              <div className="flex flex-col items-start gap-4">
                <h2 className="text-3xl font-bold md:text-4xl">{step.title}</h2>
                <p className="text-lg text-muted-foreground">{step.body}</p>
                {step.cta && (
                  <Link
                    to={step.cta.href}
                    className="rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    {step.cta.label}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
      <Spacer />

      {reviews && (
        <>
          <GoogleReviews data={reviews} />
          <Spacer />
        </>
      )}

      {birthday && (
        <>
          <FeatureBanner
            headline={home.birthday.headline}
            cta={home.birthday.cta}
            href={`/products/${birthday.slug}`}
            image={home.birthday.image}
          />
          <Spacer />
        </>
      )}

      <section className="container">
        <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
          <div className="skeleton aspect-[4/3] w-full overflow-hidden rounded-lg">
            <ResponsiveImage
              image={home.about.image}
              sizes="(min-width: 1024px) 480px, (min-width: 768px) 45vw, calc(100vw - 2rem)"
              className="absolute inset-0 size-full object-cover"
            />
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-bold md:text-4xl">{home.about.title}</h2>
            <p className="text-lg text-muted-foreground">{home.about.body}</p>
          </div>
        </div>
      </section>
      <Spacer />
    </>
  );
}
