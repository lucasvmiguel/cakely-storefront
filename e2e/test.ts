// Shared setup for the end-to-end tests: a fake Hostinger API, a fixed date
// and a cookie choice, so every test starts from the same place.
import { test as base, expect, type Page } from "@playwright/test";
import { FakeHostinger } from "./fake-hostinger";

export { expect };

/** Monday 2 November 2026, 10:00 in Amsterdam: delivery is possible that same weekend. */
export const MONDAY = new Date("2026-11-02T10:00:00+01:00");
/** Thursday 5 November 2026: too late for that weekend. */
export const THURSDAY = new Date("2026-11-05T10:00:00+01:00");

/** Calendar day buttons are labelled like "Saturday, November 7th, 2026". */
export const SAT_7_NOV = /Saturday, November 7th, 2026/;
export const SAT_14_NOV = /Saturday, November 14th, 2026/;

export const test = base.extend<{ hostinger: FakeHostinger; consent: "accepted" | "declined"; now: Date }>({
  consent: ["declined", { option: true }],
  now: [MONDAY, { option: true }],
  hostinger: [
    async ({ context }, use) => {
      const fake = new FakeHostinger();
      await fake.install(context);
      await use(fake);
    },
    { auto: true },
  ],
  page: async ({ page, consent, now }, use) => {
    await page.clock.setFixedTime(now);
    await page.addInitScript((c) => localStorage.setItem("cakely-cookie-consent", c), consent);
    await use(page);
  },
});

export const customer = {
  name: "Ana de Vries",
  email: "ana@example.com",
  phone: "+31 6 12345678",
  street: "Prinsengracht 263",
  apartment: "2nd floor",
  postalCode: "1016 gv",
};

/** Puts lines straight into the basket, as `{ variantId: quantity }`. */
export async function seedBasket(page: Page, lines: Record<string, number>) {
  await page.goto("/");
  await page.evaluate(
    (l) =>
      localStorage.setItem(
        "cakely-cart",
        JSON.stringify(Object.entries(l).map(([variantId, quantity]) => ({ variantId, quantity }))),
      ),
    lines,
  );
}

export async function fillDetails(page: Page, c = customer) {
  await page.getByLabel("Full name", { exact: true }).fill(c.name);
  await page.getByLabel("Email", { exact: true }).fill(c.email);
  await page.getByLabel("Phone", { exact: true }).fill(c.phone);
  await page.getByLabel("Street and house number", { exact: true }).fill(c.street);
  await page.getByLabel(/Apartment, floor/).fill(c.apartment);
  await page.getByLabel("Postal code", { exact: true }).fill(c.postalCode);
}

export async function pickDate(page: Page, day: RegExp) {
  await page.getByRole("button", { name: day }).click();
}

export function placeOrderButton(page: Page) {
  // Mobile shows it under the form, desktop in the order summary.
  return page.getByRole("button", { name: /^Place order/ }).filter({ visible: true });
}

export async function placeOrder(page: Page) {
  await page.getByLabel(/I agree to the/).check();
  await placeOrderButton(page).click();
}

/** The checkout is ready once the Hostinger cart exists and the total shows. */
export async function waitForCheckout(page: Page) {
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  await expect(placeOrderButton(page)).toBeEnabled();
}

export function basketLink(page: Page) {
  return page.getByRole("link", { name: /^Basket, \d+ items$/ });
}
