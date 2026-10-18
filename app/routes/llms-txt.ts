import { getProducts } from "~/lib/hostinger.server";
import { llmsTxt } from "~/lib/markdown.server";
import { siteUrl } from "~/lib/site-url.server";

export async function loader() {
  return new Response(llmsTxt(siteUrl(), await getProducts()), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
