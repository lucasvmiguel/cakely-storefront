// The purchase flow, end to end: from a product page to an order in
// (fake) Hostinger. Tests tagged @purchase also run on a phone-sized screen.
import {
  basketLink,
  customer,
  expect,
  fillDetails,
  pickDate,
  placeOrder,
  placeOrderButton,
  SAT_14_NOV,
  SAT_7_NOV,
  seedBasket,
  test,
  THURSDAY,
  waitForCheckout,
} from "./test";
import { PAYMENT_METHODS } from "../app/lib/config";

test("@purchase a customer orders from a product page through to the order", async ({ page, hostinger }) => {
  await page.goto("/products/coconut");
  await page.getByRole("button", { name: "Add to Basket" }).first().click();
  await expect(basketLink(page)).toHaveAccessibleName("Basket, 1 items");

  await basketLink(page).click();
  await expect(page.getByRole("heading", { name: "Shopping Basket" })).toBeVisible();
  // One jar is below the €20 minimum.
  await expect(page.getByRole("button", { name: "Proceed to Checkout" })).toBeDisabled();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Increase Coconut quantity" }).click();
  await page.getByRole("link", { name: "Proceed to Checkout" }).click();

  await waitForCheckout(page);
  const summary = page.getByRole("complementary");
  await expect(summary).toContainText("Subtotal€26.00");
  await expect(summary).toContainText("Delivery€3.90");
  await expect(summary).toContainText("Total€29.90");

  await fillDetails(page);
  await pickDate(page, SAT_7_NOV);
  await placeOrder(page);

  await expect(page.getByRole("heading", { name: "Thank you for your order!" })).toBeVisible();
  await expect(page.getByText(`Confirmation sent to ${customer.email}`)).toBeVisible();
  await expect(page.getByText(/Delivery on Saturday,? 7 November 2026/)).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "Total" })).toContainText("€29.90");
  await expect(basketLink(page)).toHaveAccessibleName("Basket, 0 items");

  expect(hostinger.orders).toHaveLength(1);
  const [order] = hostinger.orders;
  expect(order.items).toEqual([{ variant_id: "var_coconut", quantity: 4 }]);
  expect(order.email).toBe(customer.email);
  expect(order.provider_id).toBe(PAYMENT_METHODS[0].id);
  expect(order.total).toBe(2990);
  expect(order.shipping_address).toMatchObject({
    first_name: customer.name,
    phone: customer.phone,
    address_1: customer.street,
    apartment: customer.apartment,
    postal_code: "1016 GV",
    city: "Amsterdam",
    country_code: "nl",
    address_2: expect.stringMatching(/^Delivery: Saturday,? 7 November 2026$/),
  });
  expect(order.billing_address).toMatchObject({ first_name: customer.name, address_1: customer.street });
});

test("@purchase a mixed basket with a sale price and a discount code", async ({ page, hostinger }) => {
  // Lemon is on sale (€5.50 instead of €6.50).
  await seedBasket(page, { var_lemon: 2, var_birthday: 1 });
  await page.goto("/checkout");
  await waitForCheckout(page);
  const summary = page.getByRole("complementary");
  await expect(summary).toContainText("Subtotal€61.00");

  await page.getByLabel("Discount code", { exact: true }).fill("nope");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText("This code isn't valid.")).toBeVisible();

  await page.getByLabel("Discount code", { exact: true }).fill("welcome10");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(summary).toContainText("Discount−€6.10");
  await expect(summary).toContainText("Total€58.80");

  await fillDetails(page);
  await pickDate(page, SAT_7_NOV);
  await placeOrder(page);
  await expect(page.getByRole("heading", { name: "Thank you for your order!" })).toBeVisible();

  const [order] = hostinger.orders;
  expect(order.items).toEqual([
    { variant_id: "var_lemon", quantity: 2 },
    { variant_id: "var_birthday", quantity: 1 },
  ]);
  expect(order.codes).toEqual(["WELCOME10"]);
  expect(order.total).toBe(5880);
});

test("a discount code can be removed again", async ({ page, hostinger }) => {
  await seedBasket(page, { var_birthday: 1 });
  await page.goto("/checkout");
  await waitForCheckout(page);
  await page.getByLabel("Discount code", { exact: true }).fill("WELCOME10");
  await page.getByRole("button", { name: "Apply" }).click();
  await page.getByRole("button", { name: "Remove code WELCOME10" }).click();
  await expect(page.getByRole("complementary")).toContainText("Total€53.90");

  await fillDetails(page);
  await pickDate(page, SAT_7_NOV);
  await placeOrder(page);
  await expect(page.getByRole("heading", { name: "Thank you for your order!" })).toBeVisible();
  expect(hostinger.orders[0].codes).toEqual([]);
});

test("the basket must reach the €20 minimum", async ({ page, hostinger }) => {
  await seedBasket(page, { var_coconut: 1 });
  await page.goto("/cart");
  await expect(page.getByText("Minimum order is €20.00. Add €13.50 more to check out.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Proceed to Checkout" })).toBeDisabled();

  // Going to the checkout directly sends the customer back to the basket.
  await page.goto("/checkout");
  await expect(page).toHaveURL(/\/cart$/);
  expect(hostinger.carts.size).toBe(0);
});

test("sold-out products can't be added or checked out", async ({ page }) => {
  await page.goto("/products/cookies-cream");
  await expect(page.getByRole("button", { name: "Sold out" }).first()).toBeDisabled();

  // A jar that sold out after it went into the basket blocks checkout until removed.
  await seedBasket(page, { var_cookies: 1, var_birthday: 1 });
  await page.goto("/cart");
  await expect(page.getByText("Sold out — please remove it to continue")).toBeVisible();
  await expect(page.getByRole("button", { name: "Proceed to Checkout" })).toBeDisabled();
  await page.getByRole("listitem").filter({ hasText: "Cookies & Cream" }).getByRole("button", { name: "Remove" }).click();
  await expect(page.getByRole("link", { name: "Proceed to Checkout" })).toBeVisible();
});

test("an order needs a delivery date", async ({ page, hostinger }) => {
  await seedBasket(page, { var_birthday: 1 });
  await page.goto("/checkout");
  await waitForCheckout(page);
  await fillDetails(page);
  await placeOrder(page);
  await expect(page.getByText("Please choose a delivery date.")).toBeVisible();
  expect(hostinger.orders).toHaveLength(0);
});

test("an order needs the required details", async ({ page, hostinger }) => {
  await seedBasket(page, { var_birthday: 1 });
  await page.goto("/checkout");
  await waitForCheckout(page);
  await fillDetails(page, { ...customer, email: "" });
  await pickDate(page, SAT_7_NOV);
  await placeOrder(page);
  // The browser stops the form on the empty required field.
  await expect(page.getByLabel("Email", { exact: true })).toHaveJSProperty("validity.valueMissing", true);
  await expect(page).toHaveURL(/\/checkout$/);
  expect(hostinger.orders).toHaveLength(0);
});

test.describe("ordering on a Thursday", () => {
  test.use({ now: THURSDAY });

  test("only offers the following weekend", async ({ page }) => {
    await seedBasket(page, { var_birthday: 1 });
    await page.goto("/checkout");
    await waitForCheckout(page);
    await expect(page.getByRole("button", { name: SAT_7_NOV })).toBeDisabled();
    await expect(page.getByRole("button", { name: SAT_14_NOV })).toBeEnabled();
  });
});

test("@purchase a refresh keeps what was filled in", async ({ page, hostinger }) => {
  await seedBasket(page, { var_birthday: 1 });
  await page.goto("/checkout");
  await waitForCheckout(page);
  await fillDetails(page);
  await pickDate(page, SAT_7_NOV);
  await page.getByLabel("Discount code", { exact: true }).fill("WELCOME10");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByRole("complementary")).toContainText("Total€48.90");

  await page.reload();
  await waitForCheckout(page);
  await expect(page.getByLabel("Full name", { exact: true })).toHaveValue(customer.name);
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue(customer.email);
  await expect(page.getByLabel("Postal code", { exact: true })).toHaveValue(customer.postalCode);
  await expect(page.getByText(/Your delivery date\s*Saturday,? 7 November 2026/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove code WELCOME10" })).toBeVisible();
  await expect(page.getByRole("complementary")).toContainText("Total€48.90");
  // Agreeing to the terms is asked again.
  await expect(page.getByLabel(/I agree to the/)).not.toBeChecked();

  await placeOrder(page);
  await expect(page.getByRole("heading", { name: "Thank you for your order!" })).toBeVisible();
  expect(hostinger.orders[0].codes).toEqual(["WELCOME10"]);
  // Nothing is kept once the order is placed.
  expect(await page.evaluate(() => sessionStorage.getItem("cakely-checkout"))).toBeNull();
});

test("what was filled in is forgotten after 2 hours", async ({ page }) => {
  await seedBasket(page, { var_birthday: 1 });
  await page.goto("/checkout");
  await waitForCheckout(page);
  await fillDetails(page);

  await page.clock.setFixedTime(new Date(new Date("2026-11-02T10:00:00+01:00").getTime() + 2 * 60 * 60 * 1000 + 60_000));
  await page.reload();
  await waitForCheckout(page);
  await expect(page.getByLabel("Full name", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue("");
});

test("no order goes out if the basket changed in another tab", async ({ page, context, hostinger }) => {
  await seedBasket(page, { var_birthday: 1 });
  await page.goto("/checkout");
  await waitForCheckout(page);
  await fillDetails(page);
  await pickDate(page, SAT_7_NOV);

  const other = await context.newPage();
  await other.goto("/products/coconut");
  await other.getByRole("button", { name: "Add to Basket" }).first().click();
  await expect(page.getByRole("complementary")).toContainText("Coconut");

  await placeOrder(page);
  await expect(page.getByText("Your basket changed since you opened the checkout.", { exact: false })).toBeVisible();
  expect(hostinger.orders).toHaveLength(0);

  // After a refresh the order goes through with what's in the basket now,
  // and the details don't need typing again.
  await page.reload();
  await waitForCheckout(page);
  await placeOrder(page);
  await expect(page.getByRole("heading", { name: "Thank you for your order!" })).toBeVisible();
  expect(hostinger.orders[0].items).toEqual([
    { variant_id: "var_birthday", quantity: 1 },
    { variant_id: "var_coconut", quantity: 1 },
  ]);
});

test("@purchase a failed order shows an error, keeps the basket and can be retried", async ({ page, hostinger }) => {
  await seedBasket(page, { var_birthday: 1 });
  await page.goto("/checkout");
  await waitForCheckout(page);
  await fillDetails(page);
  await pickDate(page, SAT_7_NOV);

  hostinger.failComplete = true;
  await placeOrder(page);
  await expect(page.getByText(/We couldn't place your order/)).toBeVisible();
  await expect(basketLink(page)).toHaveAccessibleName("Basket, 1 items");
  expect(hostinger.orders).toHaveLength(0);

  hostinger.failComplete = false;
  await placeOrderButton(page).click();
  await expect(page.getByRole("heading", { name: "Thank you for your order!" })).toBeVisible();
  expect(hostinger.orders).toHaveLength(1);
});
