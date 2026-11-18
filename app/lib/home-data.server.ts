import { BIRTHDAY_SLUG } from "./catalog";
import { firstDeliveryDate } from "./delivery";
import { getGoogleReviews } from "./google-reviews.server";
import { getProducts } from "./hostinger.server";

/** What the home page needs on top of the catalog. The root route already
 *  sends every product (for the basket), so this sends ids only, keeping the
 *  page's HTML small: the cakes in stock, the Birthday Special, Google reviews
 *  and the next delivery date. */
export async function loadHomeData() {
  const [products, reviews] = await Promise.all([getProducts(), getGoogleReviews()]);
  // Sold-out cakes stay on /search but are left off the home page.
  const cakeIds = products.filter((p) => p.slug !== BIRTHDAY_SLUG && p.available).map((p) => p.id);
  const birthdayId = products.find((p) => p.slug === BIRTHDAY_SLUG && p.available)?.id ?? null;
  // The hero's rolling jar cards show every mini cake, sold-out ones too.
  const wallIds = products.filter((p) => p.slug !== BIRTHDAY_SLUG && p.images.length).map((p) => p.id);
  return { cakeIds, birthdayId, wallIds, reviews, firstDelivery: firstDeliveryDate() };
}
