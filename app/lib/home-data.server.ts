import type { HomeData } from "~/components/home/kit";
import { BIRTHDAY_SLUG } from "./catalog";
import { firstDeliveryDate } from "./delivery";
import { getGoogleReviews } from "./google-reviews.server";
import { getProducts } from "./hostinger.server";

/** Everything the home page needs: the cakes that are in stock, the
 *  Birthday Special, Google reviews and the next delivery date. */
export async function loadHomeData(): Promise<HomeData> {
  const [products, reviews] = await Promise.all([getProducts(), getGoogleReviews()]);
  // Sold-out cakes stay on /search but are left off the home page.
  const cakes = products.filter((p) => p.slug !== BIRTHDAY_SLUG && p.available);
  return {
    cakes,
    birthday: products.find((p) => p.slug === BIRTHDAY_SLUG && p.available) ?? null,
    reviews,
    firstDelivery: firstDeliveryDate(),
  };
}
