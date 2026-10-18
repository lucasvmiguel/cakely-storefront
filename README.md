# Cakely storefront

The trycakely.com storefront, with **Hostinger Ecommerce** as the backend.

- **Frontend:** React Router (SSR) + Vite + React + Tailwind, served by a small Express server (`server.js`).
- **Catalog:** fetched live from the Hostinger Storefront API for the custom sales channel `scha_01M57MQ3C0DCZN4WGXTYEFQ1BS`. It is cached in memory for 60s, so product, price and stock edits in the Hostinger dashboard show up without a redeploy.
- **Basket:** kept in the browser (`localStorage`). It stores only variant ids and quantities.
- **Checkout:** "Proceed to Checkout" sends the basket to Hostinger, which redirects the customer to its hosted checkout at checkout.hostinger.com. That page collects the address and handles shipping and payment (Tikkie, Cash on delivery). Orders show up in the Hostinger dashboard.
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
| `PORT` | `3000` | HTTP port |

If the site ever moves to a different domain, also update the sales channel URL in Hostinger. That keeps the hosted checkout's "Return to store" link correct.
