// Reviews from Cakely's Google Business Profile, via the Places API (New).
// Needs GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID; without them (or if Google
// is unreachable) this returns null and the homepage leaves the section out.

export type GoogleReview = {
  author: string;
  authorUrl: string | null;
  authorPhoto: string | null;
  rating: number;
  text: string;
  when: string;
};

export type GoogleReviews = {
  rating: number;
  count: number;
  mapsUrl: string;
  writeReviewUrl: string;
  reviews: GoogleReview[];
};

type PlaceResponse = {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: {
    rating?: number;
    text?: { text?: string };
    relativePublishTimeDescription?: string;
    authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
  }[];
};

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACE_ID = process.env.GOOGLE_PLACE_ID;
const CACHE_TTL_MS = Number(process.env.GOOGLE_REVIEWS_CACHE_SECONDS ?? 21600) * 1000;

let cache: { at: number; data: GoogleReviews | null } | null = null;
let inflight: Promise<GoogleReviews | null> | null = null;

async function fetchReviews(): Promise<GoogleReviews | null> {
  const res = await fetch(`https://places.googleapis.com/v1/places/${PLACE_ID}?languageCode=en`, {
    headers: {
      "X-Goog-Api-Key": API_KEY!,
      "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri,reviews",
    },
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) throw new Error(`Google Places request failed: ${res.status}`);
  const place = (await res.json()) as PlaceResponse;
  if (!place.rating || !place.userRatingCount) return null;

  return {
    rating: place.rating,
    count: place.userRatingCount,
    mapsUrl: place.googleMapsUri ?? `https://www.google.com/maps/place/?q=place_id:${PLACE_ID}`,
    writeReviewUrl: `https://search.google.com/local/writereview?placeid=${PLACE_ID}`,
    reviews: (place.reviews ?? [])
      .filter((r) => r.text?.text && r.authorAttribution?.displayName)
      .map((r) => ({
        author: r.authorAttribution!.displayName!,
        authorUrl: r.authorAttribution!.uri ?? null,
        authorPhoto: r.authorAttribution!.photoUri ?? null,
        rating: r.rating ?? 5,
        text: r.text!.text!,
        when: r.relativePublishTimeDescription ?? "",
      })),
  };
}

function refresh() {
  inflight ??= fetchReviews()
    .catch((error) => {
      console.error(error);
      return cache?.data ?? null;
    })
    .then((data) => {
      cache = { at: Date.now(), data };
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/**
 * Rating, review count and up to 5 reviews, cached in memory the same way as
 * the catalog: stale copies are served while a fresh one loads.
 */
export async function getGoogleReviews(): Promise<GoogleReviews | null> {
  if (!API_KEY || !PLACE_ID) return null;
  if (!cache) return refresh();
  if (Date.now() - cache.at >= CACHE_TTL_MS) void refresh();
  return cache.data;
}
