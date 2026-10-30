// What the customer has filled in at checkout, kept for the browser tab so a
// refresh (accidental, or after the basket changed) doesn't wipe it. It lives
// in sessionStorage, is cleared once the order is placed, and expires after
// DRAFT_TTL_MS: browsers can bring sessionStorage back when they restore a
// previous session, so closing the tab alone isn't enough.
const DRAFT_KEY = "cakely-checkout";
export const DRAFT_TTL_MS = 2 * 60 * 60 * 1000;

export type CheckoutDraft = {
  form: { name: string; email: string; phone: string; street: string; apartment: string; postalCode: string };
  deliveryDate: string;
  codes: string[];
};

export function readDraft(): Partial<CheckoutDraft> | null {
  try {
    const raw = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "null");
    if (!raw || typeof raw !== "object") return null;
    if (typeof raw.savedAt !== "number" || Date.now() - raw.savedAt > DRAFT_TTL_MS) {
      clearDraft();
      return null;
    }
    return raw;
  } catch {
    return null;
  }
}

export function saveDraft(draft: CheckoutDraft) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch {
    // Storage can be unavailable (private mode); checkout still works.
  }
}

export function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}
