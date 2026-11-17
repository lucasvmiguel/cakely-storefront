// Flavour choices for Birthday Special boxes. The basket only stores variant
// ids and quantities, so each box's mix is kept alongside it in localStorage:
// mix n belongs to Birthday Special number n in the basket. A box without a
// mix (added from the product page, say) is mixed by the bakery.
//
// Hostinger orders have no field for this, so checkout appends the mixes to
// the second address line, next to the delivery date (see checkout.tsx). It
// shows up in the dashboard and in order emails.
import { useCallback, useEffect, useState } from "react";
import type { Product } from "./catalog";

/** Cakes in one Birthday Special. */
export const BIRTHDAY_SIZE = 10;

/** Mini cake variant id → how many of it go in the box. */
export type Mix = Record<string, number>;

const KEY = "cakely-birthday-mixes";
const EVENT = "cakely-birthday-mixes";

export const mixCount = (mix: Mix) => Object.values(mix).reduce((a, b) => a + b, 0);

function read(): Mix[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (m): m is Mix =>
        m != null &&
        typeof m === "object" &&
        Object.values(m).every((n) => Number.isInteger(n) && (n as number) > 0),
    );
  } catch {
    return [];
  }
}

function write(mixes: Mix[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(mixes));
  } catch {
    // Storage can be unavailable (private mode); the mix is then lost, and
    // the bakery mixes the box.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function clearBirthdayMixes() {
  write([]);
}

/** The saved mixes, kept in sync across components and tabs. */
export function useBirthdayMixes() {
  const [mixes, setMixes] = useState<Mix[]>([]);
  useEffect(() => {
    const sync = () => setMixes(read());
    sync();
    const onStorage = (e: StorageEvent) => e.key === KEY && sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  const save = useCallback((next: Mix[]) => write(next), []);
  return [mixes, save] as const;
}

/** "3 Coconut, 3 Lemon, 2 Chocolate, 2 Cookies" */
export function describeMix(mix: Mix, products: Product[]) {
  return Object.entries(mix)
    .sort((a, b) => b[1] - a[1])
    .map(([variantId, n]) => {
      const p = products.find((x) => x.variantId === variantId);
      return `${n} ${p?.flavour ?? p?.title ?? "cake"}`;
    })
    .join(", ");
}

/** One line per box in the basket, for display. Boxes without a mix say so. */
export function describeBoxes(mixes: Mix[], quantity: number, products: Product[]) {
  return Array.from({ length: quantity }, (_, i) => {
    const mix = mixes[i];
    const what = mix && mixCount(mix) > 0 ? describeMix(mix, products) : "mixed by us";
    return quantity === 1 ? what : `Box ${i + 1}: ${what}`;
  });
}

/** Text for the order, e.g. "Birthday box: 3 Coconut, …", or null when no
 *  box has a chosen mix. */
export function birthdayOrderNote(mixes: Mix[], quantity: number, products: Product[]) {
  if (quantity === 0 || !mixes.slice(0, quantity).some((m) => mixCount(m) > 0)) return null;
  const boxes = describeBoxes(mixes, quantity, products);
  return quantity === 1 ? `Birthday box: ${boxes[0]}` : `Birthday boxes: ${boxes.join("; ")}`;
}
