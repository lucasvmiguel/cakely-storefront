import { data } from "react-router";

// Catch-all: renders the root ErrorBoundary with a real 404 status.
export function loader() {
  throw data("Not Found", { status: 404 });
}

export default function NotFound() {
  return null;
}
