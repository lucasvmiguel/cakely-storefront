import { useRouteLoaderData } from "react-router";
import type { loader } from "~/root";

/** Site URL, sales channel id and the live catalog, loaded once by the root route. */
export function useRootData() {
  return useRouteLoaderData<typeof loader>("root");
}
