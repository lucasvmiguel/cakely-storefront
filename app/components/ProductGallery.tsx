import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { productImage, productSrcSet } from "~/lib/images";

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = images.length;
  const go = (d: number) => setActive((i) => (i + d + count) % count);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  });

  if (!count) return <div className="aspect-[4/5] w-full rounded-[0.875rem] bg-muted" />;

  return (
    <div className="flex gap-4">
      {count > 1 && (
        <div className="hidden flex-col gap-3 md:flex">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              className={`size-20 overflow-hidden rounded-[0.875rem] border-2 ${i === active ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`}
            >
              <img src={productImage(src, 160)} alt="" width={80} height={80} className="size-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      <div className="group relative flex-1">
        <div
          className="relative w-full cursor-zoom-in overflow-hidden rounded-[0.875rem] bg-muted"
          style={{ paddingBottom: "125%" }}
          onClick={() => setZoom(true)}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current == null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          {images.map((src, i) => (
            <img
              key={src}
              src={productImage(src, 960)}
              srcSet={productSrcSet(src, [480, 640, 960, 1280])}
              sizes="(min-width: 768px) 50vw, 100vw"
              alt={i === 0 ? title : `${title} — image ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
              className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ${i === active ? "opacity-100" : "opacity-0"}`}
            />
          ))}
        </div>
        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border bg-white/90 opacity-0 transition-opacity group-hover:opacity-100 md:flex"
            >
              <ChevronRight className="size-5" />
            </button>
            <span className="absolute bottom-3 left-3 rounded-full bg-white px-2.5 py-1 text-xs font-medium">
              {active + 1} / {count}
            </span>
            <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-muted md:hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${((active + 1) / count) * 100}%` }} />
            </div>
          </>
        )}
      </div>

      {/* Rendered on <body>: the gallery column is sticky, which would otherwise
          trap the viewer underneath the header and the product details. */}
      {zoom &&
        createPortal(
          <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90" onClick={() => setZoom(false)}>
            <img src={productImage(images[active], 1600)} alt={title} className="max-h-[90vh] max-w-[92vw] object-contain" onClick={(e) => e.stopPropagation()} />
            <button type="button" aria-label="Close" className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
              <X className="size-5" />
            </button>
            {count > 1 && (
              <>
                <button type="button" aria-label="Previous image" onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute left-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
                  <ChevronLeft className="size-5" />
                </button>
                <button type="button" aria-label="Next image" onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute right-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
