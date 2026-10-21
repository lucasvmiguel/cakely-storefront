import {
  isRouteErrorResponse,
  useRouteLoaderData,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { Analytics } from "./components/Analytics";
import { AnnouncementBar } from "./components/AnnouncementBar";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { AddedToast, CookieBanner, InstagramFab } from "./components/Overlays";
import { site } from "./content/site";
import { CartProvider } from "./lib/cart";
import { DEFAULT_GA_MEASUREMENT_ID, DEFAULT_META_PIXEL_ID } from "./lib/config";
import { isInternalRequest } from "./lib/internal-traffic.server";
import { siteUrl } from "./lib/site-url.server";
import { getProducts, SALES_CHANNEL_ID } from "./lib/hostinger.server";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: site.favicon, type: "image/png" },
  { rel: "apple-touch-icon", href: site.favicon },
  // The weights used above the fold; 500 and 600 load on demand.
  { rel: "preload", href: "/fonts/poppins-400.woff2", as: "font", type: "font/woff2", crossOrigin: "anonymous" },
  { rel: "preload", href: "/fonts/poppins-700.woff2", as: "font", type: "font/woff2", crossOrigin: "anonymous" },
  { rel: "preconnect", href: "https://cdn.zyrosite.com" },
];

const isProduction = process.env.NODE_ENV === "production";

export async function loader({ request }: Route.LoaderArgs) {
  return {
    siteUrl: siteUrl(),
    salesChannelId: SALES_CHANNEL_ID,
    // Set to "" to turn a tracker off. The defaults only apply in production so
    // local testing doesn't end up in the live reports; set the variables to
    // track from a dev server.
    analytics: {
      gaId: process.env.GA_MEASUREMENT_ID ?? (isProduction ? DEFAULT_GA_MEASUREMENT_ID : null),
      pixelId: process.env.META_PIXEL_ID ?? (isProduction ? DEFAULT_META_PIXEL_ID : null),
      internal: isInternalRequest(request),
    },
    products: await getProducts(),
  };
}

/** Pages that have a machine-readable twin. */
function markdownPathFor(pathname: string) {
  if (pathname === "/") return "/home.md";
  if (pathname === "/search") return "/collections.md";
  if (["/faq", "/return-policy", "/terms", "/privacy"].includes(pathname) || pathname.startsWith("/products/")) {
    return `${pathname.replace(/\/$/, "")}.md`;
  }
  return null;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const data = useRouteLoaderData<typeof loader>("root");
  return (
    <html lang="en-NL">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffead8" />
        <Meta />
        <Links />
      </head>
      <body className="flex min-h-dvh flex-col">
        <CartProvider>
          <AnnouncementBar />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer markdownPath={markdownPathFor(pathname)} />
          <InstagramFab />
          <CookieBanner />
          <AddedToast />
          {data && (
            <Analytics
              gaId={data.analytics.gaId || null}
              pixelId={data.analytics.pixelId || null}
              internal={data.analytics.internal}
            />
          )}
        </CartProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  let details = notFound
    ? "Sorry, we couldn't find the page you're looking for. Please check the URL or navigate back home."
    : "Something went wrong on our side. Please try again in a moment.";
  if (!notFound && import.meta.env.DEV && error instanceof Error) details = error.message;

  return (
    <section className="container flex flex-col items-center gap-6 py-24 text-center">
      <title>{notFound ? "Page not found | Cakely" : "Error | Cakely"}</title>
      <meta name="robots" content="noindex" />
      <h1 className="text-4xl font-bold">{notFound ? "Page not found" : "Oops!"}</h1>
      <p className="max-w-xl text-muted-foreground lg:text-lg">{details}</p>
      <Link to="/" className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
        Go to homepage
      </Link>
    </section>
  );
}
