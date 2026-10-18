import type { Route } from "./+types/markdown";
import { getProductBySlug, getProducts } from "~/lib/hostinger.server";
import {
  collectionsMarkdown,
  faqMarkdown,
  homeMarkdown,
  policyMarkdown,
  productMarkdown,
} from "~/lib/markdown.server";
import { siteUrl } from "~/lib/site-url.server";

// Serves /<page>.md (rewritten to /__md/<page> by server/app.ts).
export async function loader({ params }: Route.LoaderArgs) {
  const page = (params["*"] ?? "").replace(/\/$/, "");
  const base = siteUrl();
  let body: string | null = null;

  if (page === "home" || page === "index" || page === "") {
    body = homeMarkdown(base, await getProducts());
  } else if (page === "faq") {
    body = faqMarkdown(base);
  } else if (page === "collections" || page === "search") {
    body = collectionsMarkdown(base, await getProducts());
  } else if (page.startsWith("products/")) {
    const product = await getProductBySlug(page.slice("products/".length));
    if (product) body = productMarkdown(base, product);
  } else {
    body = policyMarkdown(base, page);
  }

  if (body == null) {
    return new Response("Not Found\n", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "X-Robots-Tag": "noindex",
    },
  });
}
