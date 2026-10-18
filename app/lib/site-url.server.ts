import { DEFAULT_SITE_URL } from "./config";

/** Public origin of the storefront, used for canonical and absolute URLs. */
export function siteUrl() {
  return (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, "");
}
