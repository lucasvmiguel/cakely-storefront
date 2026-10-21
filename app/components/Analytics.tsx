import { useEffect } from "react";
import { useLocation } from "react-router";
import { discardQueuedEvents, startAnalytics, track, type AnalyticsIds } from "~/lib/analytics";
import { readConsent, type Consent } from "~/lib/consent";

/** Starts GA4 + Meta Pixel once cookies are accepted and reports page views. */
export function Analytics(ids: AnalyticsIds) {
  const location = useLocation();

  useEffect(() => {
    if (readConsent() === "accepted") startAnalytics(ids);
    const onConsent = (e: Event) => {
      const value = (e as CustomEvent<Consent>).detail;
      if (value === "accepted") startAnalytics(ids);
      else discardQueuedEvents();
    };
    window.addEventListener("cakely:consent", onConsent);
    return () => window.removeEventListener("cakely:consent", onConsent);
  }, [ids.gaId, ids.pixelId, ids.internal]);

  useEffect(() => {
    track.pageView(location.pathname + location.search, document.title);
  }, [location.pathname, location.search]);

  return null;
}
