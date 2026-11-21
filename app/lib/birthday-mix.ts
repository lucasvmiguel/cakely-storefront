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

/** Whether a box's chosen mix can still be made: every flavour in it is in
 *  the catalog and in stock. A mix that can't is dropped, and the bakery
 *  mixes that box instead. */
export function mixAvailable(mix: Mix, products: Product[]) {
  return Object.keys(mix).every((id) => products.find((p) => p.variantId === id)?.available);
}

/** The mix for box `i`, or null when it has none or it can no longer be made. */
function usableMix(mixes: Mix[], i: number, products: Product[]) {
  const mix = mixes[i];
  return mix && mixCount(mix) > 0 && mixAvailable(mix, products) ? mix : null;
}

/** One line per box in the basket, for display. Boxes without a mix say so,
 *  as do boxes whose mix has a flavour that has since sold out. */
export function describeBoxes(mixes: Mix[], quantity: number, products: Product[]) {
  return Array.from({ length: quantity }, (_, i) => {
    const mix = mixes[i];
    const usable = usableMix(mixes, i, products);
    const what = usable
      ? describeMix(usable, products)
      : mix && mixCount(mix) > 0
        ? "mixed by us (a flavour you picked sold out)"
        : "mixed by us";
    return quantity === 1 ? what : `Box ${i + 1}: ${what}`;
  });
}

/** Text for the order, e.g. "Birthday box: 3 Coconut, …", or null when no
 *  box has a chosen mix that can still be made. It goes in an address line, so it is kept within
 *  `room` characters: past that, flavours are shortened to their first three
 *  letters ("1: 3 Coc, 3 Lem, …"), and as a last resort it is cut with "…". */
export function birthdayOrderNote(mixes: Mix[], quantity: number, products: Product[], room = Infinity) {
  const usable = Array.from({ length: quantity }, (_, i) => usableMix(mixes, i, products));
  if (!usable.some(Boolean)) return null;
  const boxes = usable.map((mix, i) => {
    const what = mix ? describeMix(mix, products) : "mixed by us";
    return quantity === 1 ? what : `Box ${i + 1}: ${what}`;
  });
  const full = quantity === 1 ? `Birthday box: ${boxes[0]}` : `Birthday boxes: ${boxes.join("; ")}`;
  if (full.length <= room) return full;

  const short = usable.map((mix, i) => {
    const what =
      mix
        ? Object.entries(mix)
            .sort((a, b) => b[1] - a[1])
            .map(([variantId, n]) => {
              const p = products.find((x) => x.variantId === variantId);
              return `${n} ${(p?.flavour ?? p?.title ?? "cake").slice(0, 3)}`;
            })
            .join(", ")
        : "ours";
    return `${i + 1}: ${what}`;
  });
  const compact = `Birthday boxes: ${short.join("; ")}`;
  return compact.length <= room ? compact : `${compact.slice(0, Math.max(0, room - 1))}…`;
}
