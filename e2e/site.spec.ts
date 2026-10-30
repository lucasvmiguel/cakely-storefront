// The rest of the site: pages load, the machine-readable files are right, and
// the security fixes stay in place.
import { expect, test } from "./test";

for (const [path, heading] of [
  ["/", null],
  ["/search", null],
  ["/products/coconut", "Coconut"],
  ["/faq", null],
  ["/return-policy", null],
  ["/terms", null],
  ["/privacy", null],
] as const) {
  test(`${path} loads`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, ...(heading ? { name: heading } : {}) }).first()).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("an unknown product is a 404", async ({ page }) => {
  const res = await page.goto("/products/does-not-exist");
  expect(res?.status()).toBe(404);
});

test("search finds products and links to them", async ({ page }) => {
  await page.goto("/search?q=lemon");
  await expect(page.getByRole("link", { name: "Lemon", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Coconut", exact: true })).toHaveCount(0);
});

test("product descriptions can't run scripts", async ({ page }) => {
  await page.goto("/products/coconut");
  await expect(page.getByText("Creamy coconut.")).toBeVisible();
  const description = page.locator("p", { hasText: "Creamy coconut." }).locator("..");
  // Only bare tags survive: no event handlers, no classes, no images.
  expect(await description.evaluate((el) => [...el.querySelectorAll("*")].flatMap((n) => [...n.attributes].map((a) => a.name)))).toEqual([]);
  await expect(description.locator("img")).toHaveCount(0);
  await description.getByText("hover").hover();
  await description.getByText("bold").click();
  expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
});

test("responses carry the security headers", async ({ request }) => {
  const res = await request.get("/");
  expect(res.headers()).toMatchObject({
    "x-content-type-options": "nosniff",
    "x-frame-options": "SAMEORIGIN",
    "referrer-policy": "strict-origin-when-cross-origin",
  });
});

test("Markdown twins exist, and odd names are a 404", async ({ request }) => {
  const product = await request.get("/products/coconut.md");
  expect(product.status()).toBe(200);
  expect(await product.text()).toContain("# Coconut");
  for (const path of ["/constructor.md", "/__proto__.md", "/toString.md", "/nope.md"]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
});

test("the sitemap and the Merchant feed list the catalog", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/products/coconut</loc>");
  const feed = await (await request.get("/google-merchant-feed.xml")).text();
  expect(feed).toContain("<g:id>1005</g:id>");
  expect(feed).toContain("<g:sale_price>5.50 EUR</g:sale_price>");
  expect(feed).toContain("<g:availability>out_of_stock</g:availability>");
});
