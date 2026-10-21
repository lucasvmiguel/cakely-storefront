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
  | Product cards shown (home, shop, related) | `view_item_list` | — |
  | Product card clicked | `select_item` | — |
  | Product page | `view_item` | `ViewContent` |
  | Add to basket | `add_to_cart` | `AddToCart` |
  | Basket page | `view_cart` | — |
  | Search | `search` | `Search` |
  | Checkout page opened | `begin_checkout` | `InitiateCheckout` |
  | Order placed | `purchase` | `Purchase` |

  The `purchase` event uses the Hostinger cart id as its transaction id. List events and `add_to_cart` from a product card carry the list name (`Home`, `Shop all` or `Related products`) in `item_list_name`.

### Where to look in Google Analytics

Open each report at [analytics.google.com](https://analytics.google.com/analytics/web/#/a389321899p530529858/reports/intelligenthome) (property **Cakely**). Tracking started on **18 Oct 2026**. Data before that date comes from the previous site and isn't comparable, so pick a date range that starts on or after 18 Oct.

| Report | What it answers | Watch |
| --- | --- | --- |
| [**Purchase funnel**](https://analytics.google.com/analytics/web/#/analysis/a389321899p530529858): Explore, then open "Purchase funnel" | Where shoppers drop off: product view → basket → checkout → order, by device | The step with the biggest abandonment rate |
| [Drive sales → Overview](https://analytics.google.com/analytics/web/#/a389321899p530529858/reports/dashboard?params=_u..nav%3Dmaui&ruid=business-objectives-drive-online-sales-overview,business-objectives,drive-online-sales&collectionId=business-objectives&r=business-objectives-drive-online-sales-overview) | How sales are trending | Revenue, purchases, average order value |
| [Drive sales → Ecommerce purchases](https://analytics.google.com/analytics/web/#/a389321899p530529858/reports/explorer?params=_u..nav%3Dmaui&ruid=ecomm-product,business-objectives,drive-online-sales&collectionId=business-objectives&r=ecomm-product) | Which cakes sell and which only get looked at | Items viewed vs added to basket vs purchased, per cake |
| [Traffic acquisition](https://analytics.google.com/analytics/web/#/a389321899p530529858/reports/explorer?params=_u..nav%3Dmaui&ruid=lifecycle-traffic-acquisition-v2,business-objectives,generate-leads&collectionId=business-objectives&r=lifecycle-traffic-acquisition-v2) | Which channels (Instagram, Google, direct) bring visitors and sales | Sessions, key events and revenue per channel |
| [Landing page](https://analytics.google.com/analytics/web/#/a389321899p530529858/reports/explorer?params=_u..nav%3Dmaui&ruid=landing-page,business-objectives,generate-leads&collectionId=business-objectives&r=landing-page) | Which pages people arrive on | Pages with many sessions but few key events |
| [Pages and screens](https://analytics.google.com/analytics/web/#/a389321899p530529858/reports/explorer?params=_u..nav%3Dmaui&r=all-pages-and-screens&ruid=all-pages-and-screens,life-cycle,engagement&collectionId=life-cycle) | What people look at | Views and engagement time per page |
| [Events](https://analytics.google.com/analytics/web/#/a389321899p530529858/reports/explorer?params=_u..nav%3Dmaui&r=top-events&collectionId=life-cycle) | Is tracking working? | Every funnel event above appears, and `purchase` roughly matches Hostinger's order count |
| [Realtime](https://analytics.google.com/analytics/web/#/a389321899p530529858/realtime/overview) | Who's on the site right now | — |
| [DebugView](https://analytics.google.com/analytics/web/#/a389321899p530529858/admin/debugview/overview) | Did my test order get tracked? | See "Testing tracking" below |

The built-in **Purchase journey** report (Drive sales) is a closed funnel. Anyone who adds a cake to the basket straight from a product card, without opening the product page first, falls out of it, so it under-reports purchases. Use the Purchase funnel exploration instead: it's an open funnel, so shoppers can join at any step.

**Weekly check:**
- Sessions, from Traffic acquisition.
- Conversion rate: purchases ÷ sessions.
- Revenue.
- The biggest drop-off in the Purchase funnel.
- Whether GA's purchase count matches the orders in Hostinger's Sales tab.

GA will always count a bit lower than Hostinger, because visitors who decline cookies or use an ad blocker aren't tracked.

### Testing tracking

Test orders shouldn't count as sales, so they're sent in debug mode. A **Developer traffic** data filter (GA Admin → Data filters) keeps debug events out of all reports, and they show up live in **DebugView** instead.

Debug mode is always on for a dev server (`npm run dev`). On the live site, open any page with `?ga_debug=1`, for example `https://trycakely.com/?ga_debug=1`. It stays on for that browser tab, and `?ga_debug=0` turns it off.

**Your own visits** are kept out of the reports by IP, configured in GA rather than in this code: Admin → Data streams → Cakely → Configure tag settings → Show more → **Define internal traffic** (rule "Home"). GA tags those visits `traffic_type=internal`, and the **Internal Traffic** data filter drops them. When your home IP changes, search "what is my IP" on Google and update the address in that rule. No deploy is needed.

To test an order:

1. Open the site with `?ga_debug=1`.
2. Accept the cookie banner, then turn off any ad blocker.
3. Open DebugView in GA. Browse, add to basket, check out and place the order. Each event, ending with `purchase`, appears within a few seconds.
4. Cancel the test order in Hostinger.

To track from a dev server at all, set `GA_MEASUREMENT_ID` (and `META_PIXEL_ID`). Without them the trackers stay off outside production, so local testing doesn't end up in the live data.

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
| `GA_MEASUREMENT_ID` | `G-9ZHP15MWQM` (production only) | Google Analytics 4. Set to an empty string to turn it off |
| `META_PIXEL_ID` | `1161492405801977` (production only) | Meta Pixel. Set to an empty string to turn it off |
| `PORT` | `3000` | HTTP port |

If the site ever moves to a different domain, also update the sales channel URL in Hostinger.
