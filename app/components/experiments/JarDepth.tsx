// Experiment: a "looks 3D but isn't" hero picture. The real jar photos sit in
// a CSS 3D scene between two chocolate splash layers (SVG), each at its own
// depth, so tilting the scene (pointer, or a slow sway when idle) makes the
// layers slide past each other. No WebGL; dev server only (lib/experiments.ts).
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import type { Product } from "~/lib/catalog";
import { productImage } from "~/lib/images";
import "~/experiments.css";

const FLAVOUR_MS = 5000;

/** Back half of the splash crown: spikes rising behind the jar, drops above them. */
function SplashBack() {
  return (
    <svg viewBox="0 0 400 300" className="size-full" aria-hidden="true">
      <defs>
        <linearGradient id="choc-back" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9a5a32" />
          <stop offset="0.45" stopColor="#5a2c14" />
          <stop offset="1" stopColor="#2a1207" />
        </linearGradient>
      </defs>
      <path
        fill="url(#choc-back)"
        d="M40 236 C 58 186, 68 146, 76 112 C 83 142, 92 170, 110 182 C 120 140, 128 100, 140 68 C 150 110, 158 150, 176 166 C 186 120, 195 80, 205 52 C 214 90, 222 140, 237 162 C 248 120, 258 92, 268 70 C 277 110, 285 150, 300 176 C 312 142, 322 116, 330 98 C 337 142, 345 188, 362 236 Z"
      />
      {/* Gloss along the crown's edge. */}
      <path
        fill="none"
        stroke="#fff"
        strokeOpacity="0.28"
        strokeWidth="3"
        strokeLinecap="round"
        d="M80 128 C 86 150, 95 168, 108 176 M143 86 C 151 118, 160 148, 172 160 M207 70 C 215 102, 223 138, 234 154 M270 88 C 278 118, 286 148, 296 166"
      />
      <g fill="#3a1a0b">
        <circle className="depth-drop" style={{ "--d": "0s" } as CSSProperties} cx="76" cy="94" r="6" />
        <circle className="depth-drop" style={{ "--d": "-0.8s" } as CSSProperties} cx="140" cy="50" r="7" />
        <circle className="depth-drop" style={{ "--d": "-1.6s" } as CSSProperties} cx="205" cy="34" r="8" />
        <circle className="depth-drop" style={{ "--d": "-2.4s" } as CSSProperties} cx="268" cy="54" r="6" />
        <circle className="depth-drop" style={{ "--d": "-3.2s" } as CSSProperties} cx="330" cy="82" r="5" />
      </g>
    </svg>
  );
}

/** Front lip of the splash: the puddle edge and low spikes in front of the jar. */
function SplashFront() {
  return (
    <svg viewBox="0 0 400 300" className="size-full" aria-hidden="true">
      <defs>
        <linearGradient id="choc-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a8653a" />
          <stop offset="0.3" stopColor="#5e2f16" />
          <stop offset="1" stopColor="#24100a" />
        </linearGradient>
      </defs>
      <path
        fill="url(#choc-front)"
        d="M8 252 C 40 214, 82 222, 112 228 C 121 206, 128 190, 135 180 C 142 200, 150 222, 170 232 C 200 237, 230 237, 255 232 C 268 212, 276 196, 285 184 C 291 204, 297 222, 312 228 C 342 222, 382 216, 394 252 C 372 286, 300 298, 200 298 C 100 298, 30 286, 8 252 Z"
      />
      <path
        fill="none"
        stroke="#fff"
        strokeOpacity="0.32"
        strokeWidth="3"
        strokeLinecap="round"
        d="M30 246 C 60 228, 90 230, 112 234 M137 192 C 143 208, 150 222, 166 230 M287 196 C 292 210, 298 222, 310 228 M300 238 C 330 232, 360 232, 378 246"
      />
    </svg>
  );
}

export default function JarDepth({ cakes, className = "" }: { cakes: Product[]; className?: string }) {
  const photos = cakes.filter((c) => c.images[0]);
  const [active, setActive] = useState(0);
  const [tilt, setTilt] = useState<{ x: number; y: number } | null>(null);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced.current || photos.length < 2) return;
    const id = setInterval(() => setActive((i) => (i + 1) % photos.length), FLAVOUR_MS);
    return () => clearInterval(id);
  }, [photos.length]);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduced.current || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    setTilt({ x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 });
  };

  if (!photos.length) return null;
  // Pointer tilt; when there is none, the scene sways on its own (.depth-sway).
  const sceneStyle: CSSProperties | undefined = tilt
    ? { transform: `rotateX(${-tilt.y * 14}deg) rotateY(${tilt.x * 20}deg)` }
    : undefined;

  return (
    <div className={`relative [perspective:1100px] ${className}`} onPointerMove={onMove} onPointerLeave={() => setTilt(null)} aria-hidden="true">
      {/* A centred square, so the layers keep their places at any size. */}
      <div className="absolute left-1/2 top-1/2 aspect-square w-[min(100%,34rem)] -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d]">
      <div
        className={`absolute inset-0 transition-transform duration-500 ease-out [transform-style:preserve-3d] ${tilt ? "" : "depth-sway"}`}
        style={sceneStyle}
      >
        {/* Glow behind everything. */}
        <div
          className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(255,234,216,0.35),transparent_65%)]"
          style={{ transform: "translateZ(-160px) scale(1.15)" }}
        />
        {/* Splash crown, behind the jar. */}
        <div className="absolute inset-x-0 bottom-[5%] aspect-[4/3]" style={{ transform: "translateZ(-70px) scale(1.07)" }}>
          <SplashBack />
        </div>
        {/* The jar: real photos on a peach disc, cross-fading between flavours. */}
        <div className="absolute left-[22%] top-[22%] w-[56%]" style={{ transform: "translateZ(0)" }}>
          <div className="float relative aspect-square overflow-hidden rounded-full bg-peach shadow-[0_40px_80px_-20px_rgba(0,0,0,0.55)]">
            {photos.map((c, i) => (
              <img
                key={c.id}
                src={productImage(c.images[0], 720)}
                alt=""
                width={720}
                height={720}
                loading={i === 0 ? "eager" : "lazy"}
                className={`photo-blend absolute inset-0 size-full scale-110 object-cover transition-opacity duration-1000 ${i === active ? "opacity-100" : "opacity-0"}`}
              />
            ))}
            {/* A sheen that follows the tilt, like light on glass. */}
            <div
              className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.45)_50%,transparent_65%)] transition-transform duration-500"
              style={{ transform: `translateX(${(tilt?.x ?? 0) * 60}%)` }}
            />
          </div>
        </div>
        {/* Splash lip in front of the jar's base. */}
        <div className="absolute inset-x-0 bottom-0 aspect-[4/3]" style={{ transform: "translateZ(80px) scale(0.98)" }}>
          <SplashFront />
        </div>
        {/* A few drops nearest the viewer. */}
        <span className="depth-drop absolute left-[12%] top-[46%] size-4 rounded-full bg-[#3a1a0b]" style={{ transform: "translateZ(140px)", "--d": "-1s" } as CSSProperties} />
        <span className="depth-drop absolute right-[14%] top-[38%] size-3 rounded-full bg-[#4a2312]" style={{ transform: "translateZ(170px)", "--d": "-2.2s" } as CSSProperties} />
        <span className="depth-drop absolute right-[24%] top-[60%] size-2.5 rounded-full bg-[#2a1207]" style={{ transform: "translateZ(120px)", "--d": "-0.4s" } as CSSProperties} />
      </div>
      </div>
      <p
        key={active}
        className="word-in absolute bottom-20 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-peach px-5 py-2 text-sm font-bold text-primary shadow-xl lg:bottom-16"
      >
        {photos[active].title}
      </p>
    </div>
  );
}
