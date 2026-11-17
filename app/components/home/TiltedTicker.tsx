// Peach ticker strip on a slight tilt, used between home page sections.
import { home } from "~/content/site";
import { Marquee } from "./kit";

export function TiltedTicker({
  above = "var(--color-primary)",
  below = "var(--color-background)",
  overlap = false,
  items = home.ticker(null),
  duration = "30s",
  tilt = "down",
}: {
  above?: string;
  below?: string;
  overlap?: boolean;
  items?: string[];
  duration?: string;
  /** "down" rises to the right; "up" falls to the right and scrolls the other way. */
  tilt?: "down" | "up";
}) {
  return (
    <>
      {/* Tilted ticker: `above` behind its top half, `below` behind the bottom,
          so the tilt never shows a gap. */}
      <div
        // The tilt moves the strip's ends up and down by up to ~26px on wide
        // screens, so it gets 32px of room above and below or its outline is clipped.
        className={`relative overflow-hidden py-8 ${overlap ? "z-10 -mt-16 -mb-px" : "-my-px"}`}
        style={{ background: `linear-gradient(to bottom, ${overlap ? "transparent" : above} 50%, ${below} 50%)` }}
      >
        <Marquee
          className={`-mx-4 ${tilt === "up" ? "rotate-[1.5deg]" : "-rotate-[1.5deg]"} border-y-2 border-primary bg-peach py-3 text-sm font-bold uppercase tracking-[0.18em] text-primary md:text-base`}
          items={items}
          duration={duration}
          reverse={tilt === "up"}
        />
      </div>
    </>
  );
}
