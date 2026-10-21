// Visits from the owner's own IP addresses (INTERNAL_IPS, comma-separated) are
// tagged as internal traffic so GA4's "Internal Traffic" data filter drops them.

function internalIps() {
  return new Set(
    (process.env.INTERNAL_IPS ?? "")
      .split(",")
      .map((ip) => ip.trim())
      .filter(Boolean),
  );
}

/** The visitor's IP, as forwarded by the reverse proxy in front of the app. */
function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0];
  return (forwarded ?? request.headers.get("x-real-ip") ?? request.headers.get("cf-connecting-ip"))?.trim() ?? null;
}

export function isInternalRequest(request: Request) {
  const ip = clientIp(request);
  return !!ip && internalIps().has(ip);
}
