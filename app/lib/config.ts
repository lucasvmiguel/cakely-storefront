// Public configuration. The sales channel id is not a secret: the Hostinger
// Storefront API is public and keyed on it.
export const HOSTINGER_API = "https://api-ecommerce.hostinger.com/v2";

export const DEFAULT_SALES_CHANNEL_ID = "scha_01M57MQ3C0DCZN4WGXTYEFQ1BS";
export const DEFAULT_SITE_URL = "https://trycakely.com";

/** Minimum order value in minor units (cents). */
export const MIN_ORDER_AMOUNT = 2000;

// Tracking ids (public by nature: they are embedded in every page).
export const DEFAULT_GA_MEASUREMENT_ID = "G-9ZHP15MWQM";
export const DEFAULT_META_PIXEL_ID = "1161492405801977";
// Google Merchant Center account, used by the Customer Reviews survey opt-in.
export const GOOGLE_MERCHANT_ID = 5763775899;

/**
 * Payment methods offered at checkout. `id` is the store payment provider id
 * from Hostinger (Store Manager → Settings → Payments; also returned by the
 * Hostinger API). Only manual methods like Tikkie are supported on-site.
 */
export const PAYMENT_METHODS = [
  {
    id: "storepp_01M57KPMW5KTHKT2TNHCJK9EQ3",
    title: "Tikkie",
    description:
      "We'll be in touch by email or phone to arrange payment and delivery details. We start preparing your cakes once the Tikkie is paid.",
  },
];
