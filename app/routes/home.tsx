import { useEffect } from "react";
import type { Route } from "./+types/home";
import { GoogleReviews } from "~/components/GoogleReviews";
import type { HeroTone } from "~/components/Header";
import { BirthdayBuilder } from "~/components/home/BirthdayBuilder";
import { FlavourCarousel } from "~/components/home/FlavourCarousel";
import { Hero } from "~/components/home/Hero";
import { HowItWorks } from "~/components/home/HowItWorks";
import { HOME_LIST, SignOff } from "~/components/home/kit";
import { TiltedTicker } from "~/components/home/TiltedTicker";
import { home, site } from "~/content/site";
import { track } from "~/lib/analytics";
import { effectivePrice, type Product } from "~/lib/catalog";
import { loadHomeData } from "~/lib/home-data.server";
import { formatMoney } from "~/lib/money";
import { useRootData } from "~/lib/root-data";
import { organizationLd, pageMeta, siteUrlFrom, websiteLd } from "~/lib/seo";

export function loader() {
  return loadHomeData();
}

// The header turns transparent over the purple hero and floats once scrolled
// (components/Header.tsx).
export const handle = { heroTone: "dark" as HeroTone };

export function meta({ matches }: Route.MetaArgs) {
  const siteUrl = siteUrlFrom(matches);
  return pageMeta({
    siteUrl,
    title: "Cakely | Handmade cakes in Amsterdam",
    description: site.description,
    path: "/",
    markdownPath: "/home.md",
    jsonLd: [organizationLd(siteUrl), websiteLd(siteUrl)],
  });
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { cakeIds, birthdayId, wallIds, reviews, firstDelivery } = loaderData;
  const products = useRootData()?.products ?? [];
  const cakes = cakeIds.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => !!p);
  const birthday = products.find((p) => p.id === birthdayId) ?? null;
  const wall = wallIds.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => !!p);
  const birthdayPrice = birthday ? formatMoney(effectivePrice(birthday), birthday.currency) : null;

  useEffect(() => {
    track.viewItemList(HOME_LIST, cakes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Hero cakes={cakes} birthday={birthday} wall={wall} />
      <TiltedTicker below="var(--color-peach)" overlap duration="60s" items={home.ticker(birthdayPrice)} />

      <FlavourCarousel cakes={cakes} birthday={birthday} partyHref="#build" />

      {birthday && (
        <>
          {/* A plain purple line between the flavours and the birthday builder. */}
          <div className="h-1 bg-primary" aria-hidden="true" />
          <BirthdayBuilder cakes={cakes} birthday={birthday} />
        </>
      )}

      <div className="pt-20 md:pt-28">
        <HowItWorks ctaHref="#flavours" cakes={cakes} firstDelivery={firstDelivery} />
      </div>

      {reviews && (
        <div className="pb-20 md:pb-28">
          <GoogleReviews data={reviews} />
        </div>
      )}

      <SignOff />
    </>
  );
}
