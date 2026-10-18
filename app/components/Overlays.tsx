import { CheckCircle2, Cookie } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { site } from "~/content/site";
import { useCart } from "~/lib/cart";
import { readConsent, saveConsent, type Consent } from "~/lib/consent";
import { InstagramIcon } from "./icons";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(readConsent() === null);
  }, []);

  const choose = (value: Consent) => {
    saveConsent(value);
    setVisible(false);
  };

  if (!visible) return null;
  return (
    <div role="dialog" aria-label="Cookie consent" className="fixed inset-x-0 bottom-0 z-[80] border-t bg-background shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-6 sm:px-12">
        <Cookie className="hidden size-5 shrink-0 sm:block" />
        <div className="flex-1">
          <p className="text-sm font-semibold">Cookie Consent</p>
          <p className="text-sm text-muted-foreground">
            We use cookies to enhance your experience. By accepting, you allow us to use non-essential cookies and scripts.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => choose("declined")} className="h-9 rounded-md border bg-background px-4 text-sm font-medium hover:bg-muted">
            Decline
          </button>
          <button type="button" onClick={() => choose("accepted")} className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

export function InstagramFab() {
  // Keep the checkout form clear of floating buttons.
  if (useLocation().pathname === "/checkout") return null;
  return (
    <a
      href={site.socials.instagramDm}
      target="_blank"
      rel="noreferrer"
      aria-label="Message us on Instagram"
      className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-instagram text-white shadow-lg transition-transform hover:scale-110"
    >
      <InstagramIcon className="size-6" />
    </a>
  );
}

/** "Added to basket" confirmation shown after any add-to-basket click. */
export function AddedToast() {
  const { lastAdded } = useCart();
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    if (!lastAdded) return;
    setShown(lastAdded.at);
    const id = setTimeout(() => setShown(null), 3000);
    return () => clearTimeout(id);
  }, [lastAdded]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-20 z-[90] flex justify-center px-4">
      {shown && (
        <div className="pointer-events-auto flex items-center gap-3 rounded-lg border bg-background px-4 py-3 text-sm shadow-lg animate-fade-up">
          <CheckCircle2 className="size-4 text-green-600" />
          <span>Added to basket</span>
          <Link to="/cart" className="font-semibold underline underline-offset-2">
            View basket
          </Link>
        </div>
      )}
    </div>
  );
}
