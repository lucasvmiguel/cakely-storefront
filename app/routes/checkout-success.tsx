import { CalendarDays, CircleCheckBig, Mail } from "lucide-react";
import { Link, useLocation } from "react-router";
import type { Route } from "./+types/checkout-success";
import { site } from "~/content/site";
import { formatMoney } from "~/lib/money";
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

type OrderState = { email?: string; deliveryDate?: string; total?: number } | null;

export default function CheckoutSuccess() {
  // Passed by the checkout page; empty if this page is opened directly.
  const order = useLocation().state as OrderState;

  return (
    <section className="container flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 py-16 text-center">
      <CircleCheckBig className="size-14 text-green-600" />
      <h1 className="text-3xl font-bold">Thank you for your order!</h1>
      <p className="text-muted-foreground">
        We'll send you a Tikkie payment request and start preparing your cakes as soon as it's paid.
      </p>

      {order?.email && (
        <ul className="w-full space-y-2 rounded-xl border p-5 text-left text-sm">
          <li className="flex items-center gap-3">
            <Mail className="size-4 shrink-0 text-muted-foreground" />
            <span>
              Confirmation sent to <strong>{order.email}</strong>
            </span>
          </li>
          {order.deliveryDate && (
            <li className="flex items-center gap-3">
              <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
              <span>
                Delivery on <strong>{order.deliveryDate}</strong>, between 9:00 and 20:00
              </span>
            </li>
          )}
          {order.total != null && (
            <li className="flex items-center justify-between border-t pt-2 font-semibold">
              <span>Total</span>
              <span>{formatMoney(order.total)}</span>
            </li>
          )}
        </ul>
      )}

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
