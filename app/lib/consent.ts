// The visitor's cookie choice from the cookie banner, kept in localStorage.
export const CONSENT_KEY = "cakely-cookie-consent";

export type Consent = "accepted" | "declined";

export function readConsent(): Consent | null {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === "accepted" || value === "declined" ? value : null;
  } catch {
    return null;
  }
}

export function saveConsent(value: Consent) {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent("cakely:consent", { detail: value }));
}

/**
 * Hostinger's hosted checkout only records analytics and marketing events when
 * the store passes the visitor's consent in the URL (the same parameters
 * Hostinger's own storefront adds).
 */
export function withCheckoutConsent(checkoutUrl: string) {
  const flag = readConsent() === "accepted" ? "1" : "0";
  const url = new URL(checkoutUrl);
  url.searchParams.set("cookieConsentAnalytics", flag);
  url.searchParams.set("cookieConsentMarketing", flag);
  url.searchParams.set("cookieConsentPlatformAnalytics", flag);
  return url.toString();
}
