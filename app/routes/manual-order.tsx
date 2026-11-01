// Owner-only form for entering an order by hand (a phone or Instagram order,
// say). It places the order through the same Hostinger flow as the checkout,
// without the basket, the €20 minimum or the weekend-only delivery dates.
// The route only exists on the local dev server (see app/routes.ts).
import { CalendarDays, CircleCheckBig, Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { data } from "react-router";
import { Calendar } from "~/components/Calendar";
import { effectivePrice } from "~/lib/catalog";
import {
  createCart,
  placeOrder,
  setDiscountCodes,
  setShippingMethod,
  shippingOptions,
  updateCart,
  type Address,
  type ShippingOption,
} from "~/lib/checkout";
import { PAYMENT_METHODS } from "~/lib/config";
import { formatDeliveryDate, fromIso, toIso } from "~/lib/delivery";
import { EUR, formatMoney } from "~/lib/money";
import { useRootData } from "~/lib/root-data";

export function loader() {
  // A second guard: routes.ts already leaves this page out of production builds.
  if (process.env.NODE_ENV !== "development") throw data(null, { status: 404 });
  return null;
}

export function meta() {
  return [{ title: "Manual order | Cakely" }, { name: "robots", content: "noindex, nofollow" }];
}

type Form = {
  name: string;
  email: string;
  phone: string;
  street: string;
  apartment: string;
  postalCode: string;
  city: string;
  note: string;
  code: string;
};

const EMPTY_FORM: Form = {
  name: "",
  email: "",
  phone: "",
  street: "",
  apartment: "",
  postalCode: "",
  city: "Amsterdam",
  note: "",
  code: "",
};

type Placed = { orderId: string; name: string; total: number; deliveryLabel: string };

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border p-5 md:p-6">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function ManualOrder() {
  const root = useRootData();
  const products = root?.products ?? [];
  const currency = products[0]?.currency ?? EUR;

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [paymentId, setPaymentId] = useState(PAYMENT_METHODS[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Placed | null>(null);

  // Hostinger only lists shipping options for a cart, so open a throwaway one
  // (like the checkout does when it opens) just to read them.
  const [options, setOptions] = useState<ShippingOption[] | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [shippingId, setShippingId] = useState("");
  const optionsStarted = useRef(false);
  useEffect(() => {
    const sample = products.find((p) => p.available) ?? products[0];
    if (!root || !sample || optionsStarted.current) return;
    optionsStarted.current = true;
    (async () => {
      try {
        const { session } = await createCart(root.salesChannelId, [{ variantId: sample.variantId, quantity: 1 }], root.siteUrl);
        await updateCart(session, { shipping_address: { country_code: "nl", city: EMPTY_FORM.city } });
        const list = await shippingOptions(session);
        setOptions(list);
        setShippingId(list[0]?.id ?? "");
      } catch (err) {
        console.error(err);
        setOptionsError("Couldn't load the shipping options. Refresh the page to try again.");
      }
    })();
  });

  const today = useMemo(() => fromIso(toIso(new Date())), []);
  const lines = products
    .filter((p) => (quantities[p.variantId] ?? 0) > 0)
    .map((p) => ({ product: p, quantity: quantities[p.variantId] }));
  const subtotal = lines.reduce((sum, l) => sum + effectivePrice(l.product) * l.quantity, 0);

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  const setQty = (variantId: string, quantity: number) =>
    setQuantities((q) => ({ ...q, [variantId]: Math.max(0, Math.min(99, quantity || 0)) }));

  function reset() {
    setQuantities({});
    setForm(EMPTY_FORM);
    setDeliveryDate("");
    setError(null);
    setPlaced(null);
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!root || submitting) return;
    if (!lines.length) return setError("Add at least one product.");
    if (!deliveryDate) return setError("Choose a delivery date.");
    if (!shippingId) return setError("Choose a shipping option.");
    setSubmitting(true);
    setError(null);
    let step = "create the cart";
    try {
      const { session } = await createCart(
        root.salesChannelId,
        lines.map((l) => ({ variantId: l.product.variantId, quantity: l.quantity })),
        root.siteUrl,
      );
      const deliveryLabel = formatDeliveryDate(deliveryDate);
      const note = form.note.trim();
      const address: Address = {
        // Hostinger joins first and last name into one "name" on the order.
        first_name: form.name.trim(),
        last_name: null,
        phone: form.phone.trim(),
        address_1: form.street.trim(),
        apartment: form.apartment.trim() || undefined,
        city: form.city.trim(),
        postal_code: form.postalCode.trim().toUpperCase(),
        country_code: "nl",
      };
      step = "save the customer details";
      await updateCart(session, {
        email: form.email.trim(),
        // Same place as the checkout puts it: Hostinger has no delivery-date field.
        shipping_address: { ...address, address_2: `Delivery: ${deliveryLabel}${note ? ` · ${note}` : ""}` },
        billing_address: address,
      });
      step = "set the delivery method";
      // The options can depend on the cart and address, so check the chosen
      // one is still offered for this order.
      const offered = await shippingOptions(session);
      if (!offered.some((o) => o.id === shippingId)) {
        const chosen = options?.find((o) => o.id === shippingId)?.name ?? "The chosen option";
        throw new Error(`${chosen} isn't available for this order and address`);
      }
      let cart = await setShippingMethod(session, shippingId);
      const code = form.code.trim().toUpperCase();
      if (code) {
        step = `apply the discount code ${code}`;
        cart = await setDiscountCodes(session, [code]);
      }
      step = "place the order";
      const order = await placeOrder(session, paymentId);
      setPlaced({ orderId: order.id, name: address.first_name, total: cart.total, deliveryLabel });
      window.scrollTo({ top: 0 });
    } catch (err) {
      console.error(err);
      const detail = err instanceof Error ? err.message : String(err);
      setError(`Couldn't ${step}: ${detail}. No order was placed.`);
    } finally {
      setSubmitting(false);
    }
  }

  if (placed) {
    return (
      <section className="container flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 py-16 text-center">
        <CircleCheckBig className="size-14 text-green-600" />
        <h1 className="text-3xl font-bold">Order placed</h1>
        <ul className="w-full space-y-1 rounded-xl border p-5 text-left text-sm">
          <li>
            Customer: <strong>{placed.name}</strong>
          </li>
          <li>
            Delivery: <strong>{placed.deliveryLabel}</strong>
          </li>
          <li>
            Total: <strong>{formatMoney(placed.total, currency)}</strong>
          </li>
          <li className="break-all text-muted-foreground">Hostinger id: {placed.orderId}</li>
        </ul>
        <p className="text-sm text-muted-foreground">It's now in the Hostinger dashboard, like any other order.</p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Enter another order
        </button>
      </section>
    );
  }

  return (
    <section className="container max-w-3xl py-10 md:py-14">
      <h1 className="text-3xl font-bold">Manual order</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Only on your local dev server. The order is created in Hostinger, which emails the address below as usual.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-6">
        <Section title="Products">
          <ul className="divide-y">
            {products.map((p) => {
              const qty = quantities[p.variantId] ?? 0;
              return (
                <li key={p.variantId} className="flex items-center gap-3 py-3">
                  <div className="flex-1 text-sm">
                    <p className="font-medium">
                      {p.title} {!p.available && <span className="font-normal text-red-600">(sold out)</span>}
                    </p>
                    <p className="text-muted-foreground">{formatMoney(effectivePrice(p), p.currency)}</p>
                  </div>
                  <div className="flex items-center rounded-md border">
                    <button
                      type="button"
                      onClick={() => setQty(p.variantId, qty - 1)}
                      aria-label={`One less ${p.title}`}
                      className="flex size-9 items-center justify-center hover:bg-muted"
                    >
                      <Minus className="size-4" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={qty}
                      onChange={(e) => setQty(p.variantId, Number(e.target.value))}
                      aria-label={`Quantity of ${p.title}`}
                      className="h-9 w-12 bg-transparent text-center text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQty(p.variantId, qty + 1)}
                      aria-label={`One more ${p.title}`}
                      className="flex size-9 items-center justify-center hover:bg-muted"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 flex justify-between border-t pt-3 text-sm font-medium">
            <span>Subtotal (before delivery and discounts)</span>
            <span>{formatMoney(subtotal, currency)}</span>
          </p>
        </Section>

        <Section title="Customer">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="name" text="Full name" value={form.name} onChange={set("name")} className="sm:col-span-2" />
            <Field id="email" text="Email" type="email" value={form.email} onChange={set("email")} />
            <Field id="phone" text="Phone" type="tel" placeholder="+31 6 12345678" value={form.phone} onChange={set("phone")} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Hostinger sends its order emails here. Use your own address if the customer shouldn't get them.
          </p>
        </Section>

        <Section title="Delivery address">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="street" text="Street and house number" value={form.street} onChange={set("street")} className="sm:col-span-2" />
            <Field id="apartment" text="Apartment, floor, etc." optional value={form.apartment} onChange={set("apartment")} className="sm:col-span-2" />
            <Field id="postalCode" text="Postal code" placeholder="1012 AB" value={form.postalCode} onChange={set("postalCode")} />
            <Field id="city" text="City" value={form.city} onChange={set("city")} />
          </div>
        </Section>

        <Section title="Delivery date">
          <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,320px)_1fr]">
            <Calendar
              mode="single"
              weekStartsOn={1}
              startMonth={today}
              selected={deliveryDate ? fromIso(deliveryDate) : undefined}
              onSelect={(day) => setDeliveryDate(day ? toIso(day) : "")}
              disabled={{ before: today }}
              className="w-full rounded-lg border"
            />
            <div className="space-y-4">
              <p className="rounded-lg bg-muted px-4 py-3 text-sm" aria-live="polite">
                {deliveryDate ? (
                  <span className="flex items-center gap-2 font-semibold">
                    <CalendarDays className="size-4" /> {formatDeliveryDate(deliveryDate)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Any day from today.</span>
                )}
              </p>
              <Field id="note" text="Time or note" optional placeholder="e.g. 14:00–16:00" value={form.note} onChange={set("note")} />
            </div>
          </div>
        </Section>

        <Section title="Shipping">
          {optionsError ? (
            <p className="text-sm text-red-600">{optionsError}</p>
          ) : !options ? (
            <p className="text-sm text-muted-foreground">Loading the shipping options from Hostinger…</p>
          ) : !options.length ? (
            <p className="text-sm text-red-600">Hostinger has no shipping options for the Netherlands.</p>
          ) : (
            <div className="space-y-2">
              {options.map((o) => (
                <label
                  key={o.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm ${shippingId === o.id ? "border-primary bg-peach/40" : ""}`}
                >
                  <input
                    type="radio"
                    name="shipping"
                    value={o.id}
                    checked={shippingId === o.id}
                    onChange={() => setShippingId(o.id)}
                    className="size-4 accent-primary"
                  />
                  <span className="flex-1 font-medium">{o.name ?? "Unnamed option"}</span>
                  <span>{o.amount == null ? "" : o.amount === 0 ? "Free" : formatMoney(o.amount, currency)}</span>
                </label>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            These are the shipping options set up in Hostinger. Add or change them there.
          </p>
        </Section>

        <Section title="Payment and discount">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="payment" className={label}>
                Payment method
              </label>
              <select id="payment" value={paymentId} onChange={(e) => setPaymentId(e.target.value)} className={input}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
            <Field
              id="code"
              text="Discount code"
              optional
              autoComplete="off"
              value={form.code}
              onChange={set("code")}
              className="[&_input]:uppercase"
            />
          </div>
        </Section>

        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!root || submitting}
          className="inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-6 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Placing the order…" : "Place order in Hostinger"}
        </button>
      </form>
    </section>
  );
}
