import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// The basket lives in localStorage and stores only variant ids and quantities.
// Titles, prices and images always come from the live catalog.

export type CartLine = { variantId: string; quantity: number };

const STORAGE_KEY = "cakely-cart";
const MAX_QTY = 99;

type CartContextValue = {
  lines: CartLine[];
  count: number;
  ready: boolean;
  add: (variantId: string, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  /** Last item added, used for the "Added to basket" toast. */
  lastAdded: { variantId: string; at: number } | null;
};

const CartContext = createContext<CartContextValue | null>(null);

function read(): CartLine[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (l): l is CartLine =>
        typeof l?.variantId === "string" &&
        Number.isInteger(l?.quantity) &&
        l.quantity > 0,
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [lastAdded, setLastAdded] = useState<CartContextValue["lastAdded"]>(null);

  useEffect(() => {
    setLines(read());
    setReady(true);
    // Keep several open tabs in sync.
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setLines(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((fn: (prev: CartLine[]) => CartLine[]) => {
    setLines((prev) => {
      const next = fn(prev).filter((l) => l.quantity > 0);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage can be unavailable (private mode); the basket still works
        // for this page view.
      }
      return next;
    });
  }, []);

  // Actions only depend on `update`, so their identity is stable across basket
  // changes and they are safe to use as effect dependencies.
  const actions = useMemo(
    () => ({
      add(variantId: string, quantity = 1) {
        update((prev) => {
          const existing = prev.find((l) => l.variantId === variantId);
          if (existing) {
            return prev.map((l) =>
              l.variantId === variantId
                ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + quantity) }
                : l,
            );
          }
          return [...prev, { variantId, quantity: Math.min(MAX_QTY, quantity) }];
        });
        setLastAdded({ variantId, at: Date.now() });
      },
      setQuantity(variantId: string, quantity: number) {
        update((prev) =>
          prev.map((l) =>
            l.variantId === variantId
              ? { ...l, quantity: Math.max(0, Math.min(MAX_QTY, quantity)) }
              : l,
          ),
        );
      },
      remove(variantId: string) {
        update((prev) => prev.filter((l) => l.variantId !== variantId));
      },
      clear() {
        update(() => []);
      },
    }),
    [update],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      ...actions,
      lines,
      ready,
      lastAdded,
      count: lines.reduce((n, l) => n + l.quantity, 0),
    }),
    [actions, lines, ready, lastAdded],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
