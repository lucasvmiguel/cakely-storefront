import { Cookie } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { site } from "~/content/site";
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
            We use cookies for analytics and personalised ads. See our{" "}
            <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">
              privacy policy
            </Link>
            .
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
