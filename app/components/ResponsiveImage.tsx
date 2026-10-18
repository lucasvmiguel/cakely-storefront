import type { ResponsiveImage as Img } from "~/content/site";

/** Self-hosted marketing images in /public/images (480w, 800w and 1200w WebP). */
export function ResponsiveImage({
  image,
  className,
  sizes = "100vw",
  priority = false,
}: {
  image: Img;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const b = `/images/${image.base}`;
  return (
    <img
      src={`${b}-800.webp`}
      srcSet={`${b}-480.webp 480w, ${b}-800.webp 800w, ${b}-1200.webp 1200w`}
      sizes={sizes}
      alt={image.alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      {...(priority ? { fetchPriority: "high" as const } : {})}
    />
  );
}
