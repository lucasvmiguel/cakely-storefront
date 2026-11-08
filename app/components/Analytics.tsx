import { useEffect } from "react";
import { useLocation } from "react-router";
import { startAnalytics, track, updateConsent, type AnalyticsIds } from "~/lib/analytics";
import type { Consent } from "~/lib/consent";

/**
 * Starts GA4 (consent mode, denied until Accept) on every page, Meta Pixel once
 * cookies are accepted, and reports page views.
 */
export function Analytics(ids: AnalyticsIds) {
  const location = useLocation();

  useEffect(() => {
    startAnalytics(ids);
    const onConsent = (e: Event) => updateConsent((e as CustomEvent<Consent>).detail);
    window.addEventListener("cakely:consent", onConsent);
    return () => window.removeEventListener("cakely:consent", onConsent);
  }, [ids.gaId, ids.pixelId]);

  useEffect(() => {
    track.pageView(location.pathname + location.search, document.title);
  }, [location.pathname, location.search]);

  return null;
}
