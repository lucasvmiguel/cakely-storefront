// Experiment: a 3D jar of cake on a chocolate splash, for the home hero.
// three.js is imported on demand, only when this experiment is switched on
// (dev server only, see lib/experiments.ts), so it never reaches production.
import type * as T from "three";
import { useEffect, useRef, useState } from "react";

type Three = typeof import("three");

/** Cake colours per flavour, cycled every few seconds. */
const FLAVOURS = [
  { name: "Chocofudge Brigadeiro", sponge: "#3b2219", filling: "#7a4a2b" },
  { name: "Coconut", sponge: "#f1e3bd", filling: "#fbf4e4" },
  { name: "Lemon", sponge: "#f2d77f", filling: "#fff0b3" },
  { name: "Cookies & Cream", sponge: "#2d231e", filling: "#efe8dc" },
];
const FLAVOUR_SECONDS = 6;

export default function Jar3D({ className = "" }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [flavour, setFlavour] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cleanup = () => {};
    let cancelled = false;
    (async () => {
      const THREE = await import("three");
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      if (cancelled || !host.current) return;
      try {
        cleanup = mount(THREE, RoomEnvironment, host.current, setFlavour);
      } catch {
        setFailed(true); // No WebGL: show nothing rather than a broken canvas.
      }
    })();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  if (failed) return null;
  return (
    <div className={`relative ${className}`}>
      <div ref={host} className="absolute inset-0" aria-hidden="true" />
      <p
        key={flavour}
        className="word-in absolute bottom-20 left-1/2 lg:bottom-16 -translate-x-1/2 whitespace-nowrap rounded-full bg-peach px-5 py-2 text-sm font-bold text-primary shadow-xl"
      >
        {FLAVOURS[flavour].name}
      </p>
    </div>
  );
}

/** A small greyscale noise texture for the sponge crumb; the material colour tints it. */
function crumbTexture(THREE: Three) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#e9e9e9";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 2600; i++) {
    const v = 150 + Math.floor(Math.random() * 105);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    const r = Math.random() * 2.4 + 0.4;
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** The beige paper label with the vertical CAKELY wordmark. */
function labelTexture(THREE: Three) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f2dcc2";
  ctx.fillRect(0, 0, 128, 512);
  ctx.save();
  ctx.translate(70, 256);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#3b2a8f";
  ctx.font = "900 64px 'Bungee', 'Arial Black', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("CAKELY", 0, 0);
  ctx.font = "600 13px Arial, sans-serif";
  ctx.fillText("WWW.TRYCAKELY.COM", 0, 40);
  ctx.restore();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function mount(
  THREE: Three,
  RoomEnvironment: typeof import("three/examples/jsm/environments/RoomEnvironment.js").RoomEnvironment,
  el: HTMLDivElement,
  onFlavour: (i: number) => void,
) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envTarget.texture;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 2.1, 10.5);
  camera.lookAt(0, 1.05, 0);

  // Warm key light, purple rim light: the brand colours on the glass.
  const key = new THREE.DirectionalLight("#ffe4cc", 2.4);
  key.position.set(3.5, 6, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight("#9b7bff", 3.2);
  rim.position.set(-5, 3, -4);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight("#fff4ea", "#2a1458", 0.6));

  // ---- The jar ----------------------------------------------------------
  const R = 1;
  const H = 2.25;
  const jar = new THREE.Group();
  scene.add(jar);

  const crumb = crumbTexture(THREE);
  const sponge = new THREE.MeshStandardMaterial({ color: FLAVOURS[0].sponge, map: crumb, bumpMap: crumb, bumpScale: 2.5, roughness: 0.92 });
  const filling = new THREE.MeshPhysicalMaterial({ color: FLAVOURS[0].filling, roughness: 0.35, clearcoat: 0.4, clearcoatRoughness: 0.4 });
  const layers: [number, T.Material][] = [
    [0.5, sponge],
    [0.28, filling],
    [0.52, sponge],
    [0.28, filling],
    [0.42, sponge],
  ];
  let y = 0.06;
  for (const [h, mat] of layers) {
    const layer = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.93, R * 0.93, h, 64), mat);
    layer.position.y = y + h / 2;
    jar.add(layer);
    y += h;
  }

  // Clear glass: mostly see-through so the cake colours read, with a glossy
  // coat that catches the lights.
  const glass = new THREE.MeshPhysicalMaterial({
    color: "#ffffff",
    roughness: 0.08,
    metalness: 0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.1,
    transparent: true,
    opacity: 0.1,
    depthWrite: false,
    // Low, or the bright studio reflection turns the whole jar milky.
    envMapIntensity: 0.25,
  });
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 96, 1, true), glass);
  wall.position.y = H / 2;
  jar.add(wall);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.97, 0.08, 96), glass);
  base.position.y = 0.04;
  jar.add(base);

  const plastic = new THREE.MeshPhysicalMaterial({ color: "#f7f8fb", roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.3 });
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.04, R * 1.04, 0.34, 96), plastic);
  lid.position.y = H + 0.15;
  jar.add(lid);
  const lidEdge = new THREE.Mesh(new THREE.TorusGeometry(R * 0.99, 0.07, 16, 96), plastic);
  lidEdge.rotation.x = Math.PI / 2;
  lidEdge.position.y = H + 0.32;
  jar.add(lidEdge);

  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(R * 1.006, R * 1.006, H * 0.98, 24, 1, true, -0.28, 0.56),
    new THREE.MeshStandardMaterial({ map: labelTexture(THREE), roughness: 0.75, side: THREE.DoubleSide }),
  );
  label.position.y = H * 0.5;
  jar.add(label);

  // ---- Chocolate splash ---------------------------------------------------
  const chocolate = new THREE.MeshPhysicalMaterial({
    color: "#2a1207",
    roughness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    sheen: 0.5,
    sheenColor: new THREE.Color("#8a4a26"),
    // Keeps the chocolate deep brown instead of milky under the studio reflection.
    envMapIntensity: 0.55,
  });

  // An organic chocolate mound the jar stands in: a flattened sphere with a
  // wobbly outline (the vertices are pushed in and out by a few sine waves).
  const moundGeo = new THREE.SphereGeometry(1, 96, 24, 0, Math.PI * 2, 0, Math.PI / 2);
  const moundBase = Float32Array.from(moundGeo.attributes.position.array);
  const mound = new THREE.Mesh(moundGeo, chocolate);
  scene.add(mound);

  // The splash crown: a thin wall of chocolate flaring out from the jar, its
  // rim rising into spikes that move around. Each vertex keeps its angle and
  // its height along the wall (0 at the bottom, 1 at the rim).
  const crownGeo = new THREE.CylinderGeometry(1, 1, 1, 128, 10, true);
  const crownPos = crownGeo.attributes.position;
  const crownAngle = new Float32Array(crownPos.count);
  const crownV = new Float32Array(crownPos.count);
  for (let i = 0; i < crownPos.count; i++) {
    crownAngle[i] = Math.atan2(crownPos.getZ(i), crownPos.getX(i));
    crownV[i] = crownPos.getY(i) + 0.5;
  }
  const crown = new THREE.Mesh(crownGeo, chocolate.clone());
  (crown.material as T.MeshPhysicalMaterial).side = THREE.DoubleSide;
  scene.add(crown);

  /** Height of the crown's rim at an angle: spikes that drift and breathe. */
  const crownRim = (a: number, t: number) =>
    0.28 +
    0.34 * Math.max(0, Math.sin(9 * a + t * 0.9)) ** 3 +
    0.18 * Math.max(0, Math.sin(5 * a - t * 1.3 + 1.7)) ** 2 +
    0.06 * Math.sin(t * 2.2 + a * 3);

  // Droplets thrown up and falling back.
  const drops = Array.from({ length: 12 }, (_, i) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.06 + (i % 3) * 0.025, 16, 12), chocolate);
    scene.add(mesh);
    return { mesh, angle: (i / 12) * Math.PI * 2 + 0.17, speed: 2.4 + (i % 4) * 0.3, offset: i * 0.29 };
  });

  // ---- Layout, motion, lifecycle ---------------------------------------------
  const resize = () => {
    const { width, height } = el.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Keep the whole jar and splash in view on narrow (phone) canvases.
    camera.position.z = camera.aspect < 1.25 ? Math.min(15, (10.5 * 1.25) / camera.aspect) : 10.5;
    camera.updateProjectionMatrix();
    if (reduced) render(0);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(el);

  const pointer = { x: 0, y: 0 };
  const onPointer = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    pointer.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
  };
  window.addEventListener("pointermove", onPointer, { passive: true });

  // Colour blend between flavours; both ends start at the first flavour
  // (THREE.Color() defaults to white, which would paint the cake white).
  const from = { sponge: new THREE.Color(FLAVOURS[0].sponge), filling: new THREE.Color(FLAVOURS[0].filling) };
  const to = { sponge: new THREE.Color(FLAVOURS[0].sponge), filling: new THREE.Color(FLAVOURS[0].filling) };
  let current = 0;

  function render(t: number) {
    // Jar: turns, floats, leans towards the pointer.
    jar.rotation.y = t * 0.35 + pointer.x * 0.35;
    jar.rotation.x = pointer.y * 0.08;
    jar.rotation.z = -0.06 + Math.sin(t * 0.8) * 0.03;
    jar.position.y = 0.12 + Math.sin(t * 1.3) * 0.07;

    // Flavour: switch every few seconds, blending the colours over a second.
    const slot = Math.floor(t / FLAVOUR_SECONDS) % FLAVOURS.length;
    if (slot !== current) {
      from.sponge.copy(sponge.color);
      from.filling.copy(filling.color);
      to.sponge.set(FLAVOURS[slot].sponge);
      to.filling.set(FLAVOURS[slot].filling);
      current = slot;
      onFlavour(slot);
    }
    const blend = Math.min(1, (t % FLAVOUR_SECONDS) / 1);
    if (blend < 1) {
      sponge.color.copy(from.sponge).lerp(to.sponge, blend);
      filling.color.copy(from.filling).lerp(to.filling, blend);
    }

    // Mound: a wobbly outline and ripples running outwards.
    const mp = moundGeo.attributes.position;
    for (let i = 0; i < mp.count; i++) {
      const x = moundBase[i * 3];
      const yy = moundBase[i * 3 + 1];
      const z = moundBase[i * 3 + 2];
      const a = Math.atan2(z, x);
      const edge = 2.15 + 0.22 * Math.sin(3 * a + t * 0.6) + 0.12 * Math.sin(7 * a - t * 0.9);
      const d = Math.hypot(x, z);
      const ripple = Math.sin(d * 9 - t * 3) * 0.025 * (1 - yy);
      mp.setXYZ(i, x * edge, yy * 0.32 + ripple, z * edge);
    }
    mp.needsUpdate = true;
    moundGeo.computeVertexNormals();

    // Crown: wall from the jar's foot out to a flared, spiky rim.
    for (let i = 0; i < crownPos.count; i++) {
      const a = crownAngle[i];
      const v = crownV[i];
      const h = crownRim(a, t);
      const radius = R * 1.04 + v * v * 0.55 + v * h * 0.25;
      crownPos.setXYZ(i, Math.cos(a) * radius, 0.18 + v * h * 1.6, Math.sin(a) * radius);
    }
    crownPos.needsUpdate = true;
    crownGeo.computeVertexNormals();

    // Droplets: a parabola out of the crown, then back into the pool.
    for (const d of drops) {
      const p = ((t + d.offset) % 1.6) / 1.6;
      const a = d.angle + t * 0.1;
      const start = 0.18 + crownRim(a, t) * 1.6;
      const r = R * 1.6 + p * 0.9;
      const h = start + Math.max(-start, d.speed * p - 3.4 * p * p) * 1.1;
      d.mesh.position.set(Math.cos(a) * r, h, Math.sin(a) * r);
      d.mesh.visible = p > 0.05 && p < 0.95;
    }

    renderer.render(scene, camera);
  }

  // Run only while visible: off-screen or in a background tab it stops.
  let raf = 0;
  let visible = true;
  const clock = new THREE.Clock();
  const loop = () => {
    raf = requestAnimationFrame(loop);
    render(clock.getElapsedTime());
  };
  const startStop = () => {
    cancelAnimationFrame(raf);
    if (!reduced && visible && !document.hidden) loop();
  };
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    startStop();
  });
  io.observe(el);
  document.addEventListener("visibilitychange", startStop);
  resize();
  if (reduced) render(2.2);
  else startStop();

  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    ro.disconnect();
    document.removeEventListener("visibilitychange", startStop);
    window.removeEventListener("pointermove", onPointer);
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
          (m as T.MeshStandardMaterial).map?.dispose();
          m.dispose();
        }
      }
    });
    envTarget.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
