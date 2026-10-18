import { Link } from "react-router";
import type { ResponsiveImage as Img } from "~/content/site";
import { ResponsiveImage } from "./ResponsiveImage";

export function FeatureBanner({ headline, cta, href, image }: { headline: string; cta: string; href: string; image: Img }) {
  return (
    <section className="relative flex min-h-[400px] w-full items-center justify-center overflow-hidden md:min-h-[500px]">
      <ResponsiveImage image={image} className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative flex max-w-3xl flex-col items-center gap-6 px-8 py-12 text-center md:px-16">
        <h2 className="text-3xl font-bold text-peach md:text-5xl">{headline}</h2>
        <Link to={href} className="rounded-md bg-primary px-8 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90">
          {cta}
        </Link>
      </div>
    </section>
  );
}
