// Dev-server-only switches for the design experiments (lib/experiments.ts).
// root.tsx renders it only when import.meta.env.DEV, so it never ships.
import { FlaskConical } from "lucide-react";
import { useState } from "react";
import { useExperiments, type Experiments } from "~/lib/experiments";

const options: { key: keyof Experiments; label: string; hint: string }[] = [
  { key: "hero3d", label: "3D jar hero", hint: "Home: jar on a chocolate splash" },
  { key: "purpleTheme", label: "Purple theme", hint: "Product, basket, checkout" },
];

export function ExperimentsPanel() {
  const [experiments, set] = useExperiments();
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-24 left-4 z-[85] text-sm">
      {open && (
        <div className="mb-2 w-64 rounded-2xl bg-black/85 p-3 text-white shadow-xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/60">Experiments (dev only)</p>
          {options.map((o) => (
            <label key={o.key} className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-white/10">
              <input
                type="checkbox"
                checked={experiments[o.key]}
                onChange={(e) => set({ [o.key]: e.target.checked })}
                className="mt-1 size-4 accent-white"
              />
              <span>
                <span className="block font-semibold">{o.label}</span>
                <span className="block text-xs text-white/60">{o.hint}</span>
              </span>
            </label>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex h-10 items-center gap-2 rounded-full bg-black/85 px-4 font-semibold text-white shadow-xl"
      >
        <FlaskConical className="size-4" aria-hidden="true" /> Experiments
      </button>
    </div>
  );
}
