// Product photos live on Hostinger's CDN (cdn.zyrosite.com), which resizes
// and converts images on request via Cloudflare's /cdn-cgi/image/ path. A
// card-sized AVIF is ~13 KB instead of the ~85 KB original JPEG.
const RESIZABLE = "https://cdn.zyrosite.com/";

export function productImage(url: string, width: number) {
  if (!url.startsWith(RESIZABLE)) return url;
  return `${RESIZABLE}cdn-cgi/image/format=auto,w=${width}/${url.slice(RESIZABLE.length)}`;
}

export function productSrcSet(url: string, widths = [320, 480, 640, 800, 960]) {
  if (!url.startsWith(RESIZABLE)) return undefined;
  return widths.map((w) => `${productImage(url, w)} ${w}w`).join(", ");
}

/** Ref for an <img> inside a `.skeleton` box: stops the pulse once the image
 *  has loaded or failed. Also catches images that finished before hydration. */
export function stopSkeleton(img: HTMLImageElement | null) {
  if (!img) return;
  const done = () => img.closest(".skeleton")?.setAttribute("data-loaded", "");
  if (img.complete) return done();
  img.addEventListener("load", done, { once: true });
  img.addEventListener("error", done, { once: true });
}
