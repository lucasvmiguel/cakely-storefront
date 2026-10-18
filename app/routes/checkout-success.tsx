import { CircleCheckBig } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/checkout-success";
import { site } from "~/content/site";
import { takePendingOrder, track } from "~/lib/analytics";
import { useCart } from "~/lib/cart";
import { pageMeta, siteUrlFrom } from "~/lib/seo";

export function meta({ matches }: Route.MetaArgs) {
  return pageMeta({
    siteUrl: siteUrlFrom(matches),
    title: "Thank you for your order | Cakely",
    description: "Your Cakely order has been placed.",
    path: "/checkout/success",
    noindex: true,
  });
}

export default function CheckoutSuccess() {
  const { clear, ready } = useCart();
  const cleared = useRef(false);

  // The order is placed: empty the basket once the saved one has loaded.
  useEffect(() => {
    if (!ready || cleared.current) return;
    cleared.current = true;
    clear();
    const order = takePendingOrder();
    if (order) track.purchase(order);
  }, [ready, clear]);

  return (
    <section className="container flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 py-16 text-center">
      <CircleCheckBig className="size-14 text-green-600" />
      <h1 className="text-3xl font-bold">Thank you for your order!</h1>
      <p className="text-muted-foreground">
        We've received your order and sent a confirmation to your email. If you chose Tikkie, please complete the payment so we can start
        preparing your cakes for delivery.
      </p>
      <p className="text-sm text-muted-foreground">
        Questions? Email{" "}
        <a href={`mailto:${site.email}`} className="underline underline-offset-2">
          {site.email}
        </a>{" "}
        or message us on{" "}
        <a href={site.socials.whatsapp} className="underline underline-offset-2" target="_blank" rel="noreferrer">
          WhatsApp
        </a>
        .
      </p>
      <Link to="/" className="mt-2 inline-flex h-10 items-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
        Back to home
      </Link>
    </section>
  );
}
