// What the checkout reports to Google Analytics. The GA script itself is
// blocked in the tests; the events are read from window.dataLayer, which is
// exactly what gtag.js would send.
import type { Page } from "@playwright/test";
import { expect, fillDetails, pickDate, placeOrder, SAT_7_NOV, seedBasket, test, waitForCheckout } from "./test";

async function gaEvents(page: Page) {
  return page.evaluate(() =>
    ((window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [])
      .map((entry) => Array.from(entry as ArrayLike<unknown>))
      .filter((args) => args[0] === "event")
      .map((args) => ({ name: args[1] as string, params: args[2] as Record<string, unknown> })),
  );
}

test.describe("with cookies accepted", () => {
  test.use({ consent: "accepted" });

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

test("nothing is sent to Google Analytics when cookies are declined", async ({ page }) => {
  const trackers: string[] = [];
  page.on("request", (r) => {
    if (/googletagmanager|google-analytics|facebook/.test(r.url())) trackers.push(r.url());
  });
  await seedBasket(page, { var_birthday: 1 });
  await page.goto("/checkout");
  await waitForCheckout(page);
  await fillDetails(page);
  await pickDate(page, SAT_7_NOV);
  await placeOrder(page);
  await expect(page.getByRole("heading", { name: "Thank you for your order!" })).toBeVisible();

  expect(trackers).toEqual([]);
  expect(await gaEvents(page)).toEqual([]);
});
