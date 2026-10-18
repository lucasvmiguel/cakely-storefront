# Cakely storefront

The trycakely.com storefront, with **Hostinger Ecommerce** as the backend.

- **Frontend:** React Router (SSR) + Vite + React + Tailwind, served by a small Express server (`server.js`).
- **Catalog:** fetched live from the Hostinger Storefront API for the custom sales channel `scha_01M57MQ3C0DCZN4WGXTYEFQ1BS`. It is cached in memory for 60s, so product, price and stock edits in the Hostinger dashboard show up without a redeploy.
- **Basket:** kept in the browser (`localStorage`). It stores only variant ids and quantities.
- **Checkout:** runs on the site itself at `/checkout` (`app/routes/checkout.tsx`, `app/lib/checkout.ts`). The customer never leaves trycakely.com. Orders are created in Hostinger and appear in the dashboard as usual. See [Checkout](#checkout) below.
- **€20 minimum order:** enforced in the basket.

No API keys or secrets are needed. The Storefront API is public.

## Managing the shop

Do everything in the Hostinger Ecommerce dashboard: products, prices, photos, stock, shipping, payment methods and orders.

A few things live in this repo instead:

| What | Where |
| --- | --- |
| Product URL slugs (`/products/coconut`), flavour, jar weight for the €/kg line | `app/lib/catalog.ts` (`SKU_EXTRAS`, keyed by SKU) |
| Home page copy, hero slides, banners, contact details, socials | `app/content/site.ts` |
| FAQ | `app/content/faq.ts` |
| Return policy, terms, privacy | `app/content/policies.ts` (Markdown) |
| Marketing images | `public/images/` |

**Adding a new product:**
1. Create it in Hostinger and add it to the **Cakely** custom sales channel.
2. Give it a SKU.
3. Optionally add the SKU to `SKU_EXTRAS` to get a nice URL slug, a flavour filter and the €/kg line. Without an entry, the product still appears, using Hostinger's slug.

**Birthday Special:** the home-page banner appears automatically once a product with SKU `1007` exists in the channel.

## SEO and LLM support

- Every page is server-rendered with a title, description, canonical URL, Open Graph and Twitter tags.
- JSON-LD structured data:
  - `Bakery` and `WebSite` on the home page.
  - `Product` with an `Offer`, unit price, shipping and return policy on each product page.
  - `FAQPage` on the FAQ.
  - `BreadcrumbList` on inner pages.
- `/sitemap.xml` is built live from the catalog. `/robots.txt` keeps the same rules as before.
- **Markdown twins:** add `.md` to any page URL. Available pages are `/home.md`, `/products/<slug>.md`, `/faq.md`, `/collections.md`, `/return-policy.md`, `/terms.md` and `/privacy.md`. Each HTML page links to its twin with `<link rel="alternate" type="text/markdown">` and in the footer bar.
- `/llms.txt` is an index of the site for LLMs.

## Checkout

The checkout page runs these steps against the Hostinger Storefront API, all from the customer's browser:

1. **Create a Hostinger cart** from the basket when the page opens. This gives the real delivery price and lets discount codes be checked.
2. **Discount codes.** The documented API has no endpoint for them, so the page calls the one Hostinger's own hosted checkout uses (`POST /store/carts/{cart_token}`). It isn't a public API and could change. If it breaks, the field shows an error and checkout still works without the code.
3. **Place order.** The page saves the email and address, sets shipping, opens a payment session with the chosen method, and completes the cart. That creates the order in Hostinger, which sends its usual order emails.

**Delivery date.** Customers pick a Saturday or Sunday. Orders placed Monday–Wednesday can get that same weekend; later orders get the next one (`app/lib/delivery.ts`). Hostinger has no delivery-date field, so the date is saved on the order's shipping address as the second line, for example "Delivery: Saturday, 24 October 2026". It shows in the dashboard and in order emails.

**Payment methods** are listed in `PAYMENT_METHODS` in `app/lib/config.ts`, using the Hostinger store payment provider id. Only manual methods such as Tikkie work on-site. Card payments through Stripe or PayPal would need their payment form built into the page first, so connecting one in Hostinger won't make it appear here.

**€20 minimum.** `/checkout` sends the customer back to the basket when the basket is below the minimum.

## Analytics

Hostinger's Traffic tab doesn't count visits to custom storefronts. Hostinger's docs say: "Sales channels such as TikTok Shop, Meta, and custom channels don't share traffic data with the Traffic tab." Orders still appear in Hostinger's Sales tab. Visitor tracking comes from two separate tools:

- **Google Analytics 4** and **Meta Pixel**. They load only after the visitor clicks **Accept** on the cookie banner. Before that, and after **Decline**, no tracking script loads (`app/lib/analytics.ts`).
- **Funnel events**, sent to both tools:

  | Step | GA4 event | Meta event |
  | --- | --- | --- |
  | Page view | `page_view` | `PageView` |
  | Product page | `view_item` | `ViewContent` |
  | Add to basket | `add_to_cart` | `AddToCart` |
  | Basket page | `view_cart` | — |
  | Search | `search` | `Search` |
  | Checkout page opened | `begin_checkout` | `InitiateCheckout` |
  | Order placed | `purchase` | `Purchase` |

  The `purchase` event uses the Hostinger cart id as its transaction id.

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck
```

## Docker (VPS deployment)

Every push to `main` triggers GitHub Actions (`.github/workflows/docker.yml`). The workflow typechecks the app, builds it, and publishes the image to the GitHub Container Registry (GHCR):

- `ghcr.io/lucasvmiguel/cakely-storefront:latest`: the newest build of `main`.
- `ghcr.io/lucasvmiguel/cakely-storefront:sha-<commit>`: one tag per commit, for pinning or rolling back.
- `ghcr.io/lucasvmiguel/cakely-storefront:1.2.3`: published when you push a `v1.2.3` git tag.

The image package is private. Set it up on the VPS once:

1. On GitHub, create a classic personal access token with only the `read:packages` scope.
2. On the VPS, log in to the registry with that token as the password:

   ```bash
   docker login ghcr.io -u lucasvmiguel
   ```

3. Copy `docker-compose.yml` to the VPS.

To deploy or update:

```bash
docker compose pull && docker compose up -d
```

To run it without Compose:

```bash
docker run -d --name cakely -p 3000:3000 --restart unless-stopped \
  -e SITE_URL=https://trycakely.com ghcr.io/lucasvmiguel/cakely-storefront:latest
```

Put your reverse proxy (Nginx, Caddy, Traefik) in front for HTTPS and forward traffic to port 3000. To build the image locally instead, run `docker build -t cakely-storefront .`.

### Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `SITE_URL` | `https://trycakely.com` | Public origin. Used for canonical URLs, the sitemap and `.md` links |
| `SALES_CHANNEL_ID` | `scha_01M57MQ3C0DCZN4WGXTYEFQ1BS` | Hostinger custom sales channel |
| `CATALOG_CACHE_SECONDS` | `60` | How long to cache the catalog in memory |
| `GA_MEASUREMENT_ID` | `G-9ZHP15MWQM` | Google Analytics 4. Set to an empty string to turn it off |
| `META_PIXEL_ID` | `1161492405801977` | Meta Pixel. Set to an empty string to turn it off |
| `PORT` | `3000` | HTTP port |

If the site ever moves to a different domain, also update the sales channel URL in Hostinger.
