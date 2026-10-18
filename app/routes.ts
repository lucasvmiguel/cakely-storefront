import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("search", "routes/search.tsx"),
  route("products/:slug", "routes/product.tsx"),
  route("cart", "routes/cart.tsx"),
  route("checkout", "routes/checkout.tsx"),
  route("checkout/success", "routes/checkout-success.tsx"),
  route("faq", "routes/faq.tsx"),
  route("return-policy", "routes/return-policy.tsx"),
  route("terms", "routes/terms.tsx"),
  route("privacy", "routes/privacy.tsx"),

  // SEO / LLM resources
  route("__md/*", "routes/markdown.ts"),
  route("llms.txt", "routes/llms-txt.ts"),
  route("robots.txt", "routes/robots-txt.ts"),
  route("sitemap.xml", "routes/sitemap-xml.ts"),

  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
