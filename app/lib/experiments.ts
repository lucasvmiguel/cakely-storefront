// Design experiments to compare on the dev server (`npm run dev`), switched
// with the Experiments panel in the corner. They are saved in this browser
// only. Production builds never show the panel, so every experiment is off
// there.
import { useCallback, useEffect, useState } from "react";

export type Experiments = {
  /** Every page except home in the lavender / white / purple palette of the
   *  home page's birthday section. */
  lavenderTheme: boolean;
};

const KEY = "cakely-experiments";
const EVENT = "cakely-experiments";
const OFF: Experiments = { lavenderTheme: false };

function read(): Experiments {
  if (!import.meta.env.DEV) return OFF;
  try {
    return { ...OFF, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return OFF;
  }
}

/** The current experiments (all off on the server and in production). */
export function useExperiments() {
  const [value, setValue] = useState<Experiments>(OFF);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const sync = () => setValue(read());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const set = useCallback((patch: Partial<Experiments>) => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...read(), ...patch }));
    } catch {
      // Storage unavailable: nothing to remember.
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [value, set] as const;
}
