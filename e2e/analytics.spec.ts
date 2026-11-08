// What the site reports to Google Analytics. The GA script itself is blocked
// in the tests; the commands are read from window.dataLayer, which is exactly
// what gtag.js would send.
import type { Page } from "@playwright/test";
import { expect, fillDetails, pickDate, placeOrder, SAT_7_NOV, seedBasket, test, waitForCheckout } from "./test";

async function gtagCommands(page: Page) {
  return page.evaluate(() =>
    ((window as unknown as { dataLayer?: unknown[] }).dataLayer ?? []).map((entry) =>
      Array.from(entry as ArrayLike<unknown>),
    ),
  );
}

async function gaEvents(page: Page) {
  return (await gtagCommands(page))
    .filter((args) => args[0] === "event")
    .map((args) => ({ name: args[1] as string, params: args[2] as Record<string, unknown> }));
}

const denied = { ad_storage: "denied", analytics_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" };
const granted = { ad_storage: "granted", analytics_storage: "granted", ad_user_data: "granted", ad_personalization: "granted" };

test.describe("with cookies accepted", () => {
  test.use({ consent: "accepted" });

  test("consent starts out granted", async ({ page }) => {
    await page.goto("/");
    await expect.poll(async () => (await gtagCommands(page))[0]).toEqual([
      "consent",
      "default",
      { ...granted, wait_for_update: 500 },
    ]);
  });

  test("the purchase is reported once, with delivery in its value", async ({ page, hostinger }) => {
    await seedBasket(page, { var_coconut: 4 });
    await page.goto("/checkout");
    await waitForCheckout(page);
    await fillDetails(page);
    await pickDate(page, SAT_7_NOV);
    await placeOrder(page);
    await expect(page.getByRole("heading", { name: "Thank you for your order!" })).toBeVisible();

    const events = await gaEvents(page);
    expect(events.filter((e) => e.name === "begin_checkout")).toHaveLength(1);
    const purchases = events.filter((e) => e.name === "purchase");
    expect(purchases).toHaveLength(1);
    expect(purchases[0].params).toMatchObject({
      transaction_id: hostinger.orders[0].id,
      value: 29.9,
      shipping: 3.9,
      currency: "EUR",
      items: [expect.objectContaining({ item_id: "1002", item_name: "Coconut", price: 6.5, quantity: 4 })],
    });
  });

  test("adding to the basket is reported once per click", async ({ page }) => {
    await page.goto("/products/coconut");
    const add = page.getByRole("button", { name: "Add to Basket" }).first();
    await add.click();
    await add.click();
    const adds = (await gaEvents(page)).filter((e) => e.name === "add_to_cart");
    expect(adds).toHaveLength(2);
    expect(adds[0].params).toMatchObject({ value: 6.5, items: [expect.objectContaining({ item_id: "1002", quantity: 1 })] });
  });
});

test("with cookies declined, GA is measured without cookies and Meta never loads", async ({ page }) => {
  const meta: string[] = [];
  page.on("request", (r) => {
    if (/facebook/.test(r.url())) meta.push(r.url());
  });
  await seedBasket(page, { var_birthday: 1 });
  await page.goto("/checkout");
  await waitForCheckout(page);
  await fillDetails(page);
  await pickDate(page, SAT_7_NOV);
  await placeOrder(page);
  await expect(page.getByRole("heading", { name: "Thank you for your order!" })).toBeVisible();

  const commands = await gtagCommands(page);
  expect(commands[0]).toEqual(["consent", "default", { ...denied, wait_for_update: 500 }]);
  expect(commands[1]).toEqual(["set", "url_passthrough", true]);
  expect(commands.some((c) => c[0] === "consent" && c[1] === "update")).toBe(false);
  const names = (await gaEvents(page)).map((e) => e.name);
  expect(names).toContain("begin_checkout");
  expect(names).toContain("purchase");
  expect(meta).toEqual([]);
});

test.describe("before a cookie choice", () => {
  test.use({ consent: null });

  test("events are sent with consent denied, and Accept grants it without a reload", async ({ page }) => {
    await page.goto("/products/coconut");
    await expect.poll(async () => (await gaEvents(page)).map((e) => e.name)).toContain("view_item");
    expect((await gtagCommands(page))[0]).toEqual(["consent", "default", { ...denied, wait_for_update: 500 }]);

    await page.evaluate(() => ((window as unknown as { notReloaded: boolean }).notReloaded = true));
    await page.getByRole("dialog", { name: "Cookie consent" }).getByRole("button", { name: "Accept" }).click();

    const updates = (await gtagCommands(page)).filter((c) => c[0] === "consent" && c[1] === "update");
    expect(updates).toEqual([["consent", "update", granted]]);
    expect(await page.evaluate(() => localStorage.getItem("cakely-cookie-consent"))).toBe("accepted");
    expect(await page.evaluate(() => (window as unknown as { notReloaded?: boolean }).notReloaded)).toBe(true);
  });

  test("Decline keeps consent denied", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("dialog", { name: "Cookie consent" }).getByRole("button", { name: "Decline" }).click();

    const updates = (await gtagCommands(page)).filter((c) => c[0] === "consent" && c[1] === "update");
    expect(updates).toEqual([["consent", "update", denied]]);
    expect(await page.evaluate(() => localStorage.getItem("cakely-cookie-consent"))).toBe("declined");
  });
});
