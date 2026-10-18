import { CalendarDays, Lock, MapPin, Tag, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { Calendar } from "~/components/Calendar";
import type { Route } from "./+types/checkout";
import { track } from "~/lib/analytics";
import { useCart } from "~/lib/cart";
import { productImage, stopSkeleton } from "~/lib/images";
import { effectivePrice, type Product } from "~/lib/catalog";
import {
  CheckoutError,
  createCart,
  placeOrder,
  setDiscountCodes,
  setShippingMethod,
  shippingOptions,
  updateCart,
  type Address,
  type HostingerCart,
  type Session,
} from "~/lib/checkout";
import { MIN_ORDER_AMOUNT, PAYMENT_METHODS } from "~/lib/config";
import { deliveryDates, formatDeliveryDate, fromIso, isValidDeliveryDate, toIso } from "~/lib/delivery";
import { EUR, formatMoney } from "~/lib/money";
import { useRootData } from "~/lib/root-data";
import { pageMeta, siteUrlFrom } from "~/lib/seo";

export function meta({ matches }: Route.MetaArgs) {
  return pageMeta({
    siteUrl: siteUrlFrom(matches),
    title: "Checkout | Cakely",
    description: "Complete your Cakely order.",
    path: "/checkout",
    noindex: true,
  });
}

type Form = {
  name: string;
  email: string;
  phone: string;
  street: string;
  apartment: string;
  postalCode: string;
};

// We only deliver in Amsterdam, so the city isn't something customers type.
const DELIVERY_CITY = "Amsterdam";

const EMPTY_FORM: Form = {
  name: "",
  email: "",
  phone: "",
  street: "",
  apartment: "",
  postalCode: "",
};

const input =
  "h-11 w-full rounded-md border bg-background px-3 text-sm outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/20";
const label = "mb-1.5 block text-sm font-medium";

function Field({
  id,
  text,
  optional,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { id: keyof Form; text: string; optional?: boolean }) {
  return (
    <div className={className}>
      <label htmlFor={id} className={label}>
        {text} {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
      </label>
      <input id={id} name={id} required={!optional} className={input} {...props} />
    </div>
  );
}

function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border p-5 md:p-6">
      <h2 className="mb-4 flex items-center gap-3 text-lg font-semibold">
        <span className="flex size-7 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">{step}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function Checkout() {
  const root = useRootData();
  const { lines, ready, clear } = useCart();
  const navigate = useNavigate();

  const byVariant = useMemo(
    () => new Map<string, Product>((root?.products ?? []).map((p) => [p.variantId, p])),
    [root?.products],
  );
  const items = lines
    .map((l) => ({ line: l, product: byVariant.get(l.variantId) }))
    .filter((i): i is { line: typeof i.line; product: Product } => !!i.product && i.product.available);
  const currency = items[0]?.product.currency ?? EUR;
  const subtotal = items.reduce((sum, i) => sum + effectivePrice(i.product) * i.line.quantity, 0);

  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const available = useMemo(() => deliveryDates().map((d) => fromIso(d.iso)), []);
  const availableIsos = useMemo(() => new Set(available.map(toIso)), [available]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [paymentId, setPaymentId] = useState(PAYMENT_METHODS[0]?.id ?? "");
  const [agreed, setAgreed] = useState(false);

  // The Hostinger cart behind this checkout, created when the page opens so we
  // can show the real shipping price and validate discount codes.
  const [session, setSession] = useState<Session | null>(null);
  const [hCart, setHCart] = useState<HostingerCart | null>(null);
  const [shippingOptionId, setShippingOptionId] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [codeStatus, setCodeStatus] = useState<"idle" | "loading">("idle");
  const [codeError, setCodeError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const placed = useRef(false);
  const started = useRef(false);

  useEffect(() => {
    if (!ready || !root || started.current || !items.length || subtotal < MIN_ORDER_AMOUNT) return;
    started.current = true;
    track.beginCheckout(items.map((i) => ({ product: i.product, quantity: i.line.quantity })));
    (async () => {
      try {
        const { session } = await createCart(root.salesChannelId, items.map((i) => i.line));
        // Shipping options depend on the country; we only deliver in the Netherlands.
        await updateCart(session, { shipping_address: { country_code: "nl", city: DELIVERY_CITY } });
        const options = await shippingOptions(session);
        if (!options.length) throw new Error("No shipping options are available.");
        const cart = await setShippingMethod(session, options[0].id);
        setSession(session);
        setShippingOptionId(options[0].id);
        setHCart(cart);
      } catch (e) {
        console.error(e);
        setSetupError("We couldn't start the checkout. Please refresh the page or try again in a moment.");
      }
    })();
  });

  if (!ready) return <div className="min-h-[60vh]" />;
  if (!placed.current && (!items.length || subtotal < MIN_ORDER_AMOUNT)) return <Navigate to="/cart" replace />;

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const appliedCodes = (hCart?.discounts ?? []).map((d) => d.code).filter((c): c is string => !!c);
  const shipping = hCart?.shipping_total ?? null;
  const discount = hCart?.discount_total ?? 0;
  const total = hCart ? hCart.total : null;

  async function applyCode(e?: FormEvent) {
    e?.preventDefault();
    const value = code.trim().toUpperCase();
    if (!session || !value) return;
    setCodeStatus("loading");
    setCodeError(null);
    try {
      setHCart(await setDiscountCodes(session, [...new Set([...appliedCodes, value])]));
      setCode("");
    } catch (err) {
      setCodeError(
        err instanceof CheckoutError && err.status === 404
          ? "This code isn't valid."
          : "We couldn't apply the code right now. Please try again.",
      );
    } finally {
      setCodeStatus("idle");
    }
  }

  async function removeCode(c: string) {
    if (!session) return;
    setCodeStatus("loading");
    try {
      setHCart(await setDiscountCodes(session, appliedCodes.filter((x) => x !== c)));
    } catch {
      setCodeError("We couldn't remove the code right now. Please try again.");
    } finally {
      setCodeStatus("idle");
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session || !shippingOptionId || submitting) return;
    if (!isValidDeliveryDate(deliveryDate)) {
      setError("Please choose a delivery date.");
      document.getElementById("delivery-date")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const deliveryLabel = formatDeliveryDate(deliveryDate);
      const address: Address = {
        // Hostinger joins first and last name into one "name" on the order, so
        // the full name goes in first_name.
        first_name: form.name.trim(),
        last_name: null,
        phone: form.phone.trim(),
        address_1: form.street.trim(),
        apartment: form.apartment.trim() || undefined,
        city: DELIVERY_CITY,
        postal_code: form.postalCode.trim().toUpperCase(),
        country_code: "nl",
      };
      await updateCart(session, {
        email: form.email.trim(),
        // Hostinger has no delivery-date field; the second address line shows
        // up on the order in the dashboard and in order emails.
        shipping_address: { ...address, address_2: `Delivery: ${deliveryLabel}` },
        billing_address: address,
      });
      const cart = await setShippingMethod(session, shippingOptionId);
      const order = await placeOrder(session, paymentId);

      placed.current = true;
      track.purchase({
        id: order.id,
        items: items.map((i) => ({ product: i.product, quantity: i.line.quantity })),
        value: cart.total - cart.shipping_total,
        shipping: cart.shipping_total,
        coupon: appliedCodes.join(",") || undefined,
      });
      clear();
      navigate("/checkout/success", {
        replace: true,
        state: { email: form.email.trim(), deliveryDate: deliveryLabel, total: cart.total },
      });
    } catch (err) {
      console.error(err);
      setError(
        err instanceof CheckoutError && err.code === "customer_information_missing"
          ? "Please fill in all required fields."
          : "We couldn't place your order. Please check your details and try again, or contact us if it keeps happening.",
      );
      setSubmitting(false);
    }
  }

  return (
    <section className="container py-10 md:py-14">
      <Link to="/cart" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
        ← Back to basket
      </Link>
      <h1 className="mt-3 text-3xl font-bold">Checkout</h1>

      {setupError && (
        <p role="alert" className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {setupError}
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <form id="checkout" onSubmit={submit} className="space-y-6">
          <Section step={1} title="Contact">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="name" text="Full name" autoComplete="name" value={form.name} onChange={set("name")} className="sm:col-span-2" />
              <Field id="email" text="Email" type="email" autoComplete="email" value={form.email} onChange={set("email")} />
              <Field id="phone" text="Phone" type="tel" autoComplete="tel" placeholder="+31 6 12345678" value={form.phone} onChange={set("phone")} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">We'll use these to confirm your order and arrange the delivery.</p>
          </Section>

          <Section step={2} title="Delivery address">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="street" text="Street and house number" autoComplete="address-line1" value={form.street} onChange={set("street")} className="sm:col-span-2" />
              <Field id="apartment" text="Apartment, floor, etc." optional autoComplete="address-line2" value={form.apartment} onChange={set("apartment")} className="sm:col-span-2" />
              <Field
                id="postalCode"
                text="Postal code"
                autoComplete="postal-code"
                placeholder="1012 AB"
                pattern="^\s*\d{4}\s?[A-Za-z]{2}\s*$"
                title="Dutch postal code, e.g. 1012 AB"
                value={form.postalCode}
                onChange={set("postalCode")}
              />
              <div>
                <span id="city-label" className={label}>
                  City
                </span>
                <p
                  aria-labelledby="city-label"
                  className="flex h-11 items-center gap-2 rounded-md border bg-muted px-3 text-sm text-muted-foreground"
                >
                  <MapPin className="size-4 shrink-0" /> {DELIVERY_CITY}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">We deliver exclusively in Amsterdam, Netherlands.</p>
          </Section>

          <Section step={3} title="Delivery date">
            <fieldset id="delivery-date">
              <legend className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="size-4" /> We deliver on Saturdays and Sundays, between 9:00 and 20:00.
              </legend>
              <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,320px)_1fr]">
                <Calendar
                  mode="single"
                  weekStartsOn={1}
                  defaultMonth={available[0]}
                  startMonth={available[0]}
                  endMonth={available.at(-1)}
                  selected={deliveryDate ? fromIso(deliveryDate) : undefined}
                  onSelect={(day) => setDeliveryDate(day ? toIso(day) : "")}
                  disabled={(day) => !availableIsos.has(toIso(day))}
                  modifiers={{ available }}
                  modifiersClassNames={{ available: "[&>button]:font-semibold [&>button]:text-foreground [&>button]:bg-peach/60" }}
                  className="w-full rounded-lg border"
                />
                <div className="rounded-lg bg-muted px-4 py-3 text-sm" aria-live="polite">
                  {deliveryDate ? (
                    <>
                      <span className="block text-muted-foreground">Your delivery date</span>
                      <span className="mt-0.5 block font-semibold">{formatDeliveryDate(deliveryDate)}</span>
                      <span className="mt-0.5 block text-muted-foreground">between 9:00 and 20:00</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Pick one of the highlighted Saturdays or Sundays.</span>
                  )}
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Cakes are handmade to order: order by Wednesday for delivery the same weekend.
              </p>
            </fieldset>
          </Section>

          <Section step={4} title="Payment">
            <div className="space-y-2">
              {PAYMENT_METHODS.map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer gap-3 rounded-lg border p-4 ${paymentId === m.id ? "border-primary bg-peach/40" : ""}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={m.id}
                    checked={paymentId === m.id}
                    onChange={() => setPaymentId(m.id)}
                    className="mt-1 size-4 accent-primary"
                  />
                  <span>
                    <span className="block font-medium">{m.title}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{m.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </Section>

          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              required
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 size-4 accent-primary"
            />
            <span className="text-muted-foreground">
              I agree to the{" "}
              <Link to="/terms" target="_blank" className="underline underline-offset-2">
                Terms of Service
              </Link>
              ,{" "}
              <Link to="/privacy" target="_blank" className="underline underline-offset-2">
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link to="/return-policy" target="_blank" className="underline underline-offset-2">
                Return Policy
              </Link>
              .
            </span>
          </label>

          {error && (
            <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {/* On large screens the button sits in the summary column. */}
          <button
            type="submit"
            disabled={!session || submitting}
            className="inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-6 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 lg:hidden"
          >
            {submitting ? "Placing your order…" : total != null ? `Place order · ${formatMoney(total, currency)}` : "Place order"}
          </button>
        </form>

        <aside className="h-fit space-y-4 rounded-xl border p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold">Order Summary</h2>
          <ul className="space-y-3">
            {items.map(({ line, product: p }) => (
              <li key={line.variantId} className="flex items-center gap-3">
                <div className="skeleton size-14 shrink-0 overflow-hidden rounded-lg">
                  {p.images[0] && <img ref={stopSkeleton} src={productImage(p.images[0], 120)} alt="" width={56} height={56} className="size-full object-cover" />}
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-medium">{p.title}</p>
                  <p className="text-muted-foreground">Qty {line.quantity}</p>
                </div>
                <span className="text-sm font-medium">{formatMoney(effectivePrice(p) * line.quantity, p.currency)}</span>
              </li>
            ))}
          </ul>

          <form onSubmit={applyCode} className="flex gap-2 border-t pt-4">
            <label htmlFor="discount" className="sr-only">
              Discount code
            </label>
            <input
              id="discount"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Discount code"
              autoComplete="off"
              className={`${input} h-10 uppercase placeholder:normal-case`}
            />
            <button
              type="submit"
              disabled={!session || !code.trim() || codeStatus === "loading"}
              className="h-10 shrink-0 rounded-md border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              {codeStatus === "loading" ? "…" : "Apply"}
            </button>
          </form>
          {codeError && <p className="-mt-2 text-sm text-red-600">{codeError}</p>}
          {appliedCodes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {appliedCodes.map((c) => (
                <span key={c} className="inline-flex items-center gap-1.5 rounded-full bg-peach px-3 py-1 text-xs font-semibold">
                  <Tag className="size-3" /> {c}
                  <button type="button" onClick={() => removeCode(c)} aria-label={`Remove code ${c}`} className="opacity-60 hover:opacity-100">
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <dl className="space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatMoney(subtotal, currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd>{shipping == null ? "…" : shipping === 0 ? "Free" : formatMoney(shipping, currency)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-700">
                <dt>Discount</dt>
                <dd>−{formatMoney(discount, currency)}</dd>
              </div>
            )}
          </dl>
          <div className="flex justify-between border-t pt-4 text-lg font-semibold">
            <span>Total</span>
            <span>{total == null ? "…" : formatMoney(total, currency)}</span>
          </div>
          {deliveryDate && (
            <p className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
              <CalendarDays className="size-4 shrink-0" /> Delivery on {formatDeliveryDate(deliveryDate)}
            </p>
          )}

          <button
            type="submit"
            form="checkout"
            disabled={!session || submitting}
            className="hidden h-12 w-full items-center justify-center rounded-md bg-primary px-6 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 lg:inline-flex"
          >
            {submitting ? "Placing your order…" : "Place order"}
          </button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3" /> Your order is processed securely
          </p>
        </aside>
      </div>
    </section>
  );
}
