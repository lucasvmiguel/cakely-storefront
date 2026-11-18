// The home page: building a Birthday Special box flavour by flavour, and the
// flavour carousel. The test catalog has three mini cakes in stock
// (Chocofudge Brigadeiro, Coconut, Lemon); Cookies & Cream is sold out.
import type { Page } from "@playwright/test";
import { basketLink, expect, fillDetails, pickDate, placeOrder, SAT_7_NOV, test, waitForCheckout } from "./test";

const builder = (page: Page) => page.locator("#build");
const box = (page: Page) => page.getByRole("complementary", { name: "Your birthday box" });
const addBox = (page: Page) => builder(page).getByRole("button", { name: /Add birthday box/ });
const more = (page: Page, cake: string) => builder(page).getByRole("button", { name: `One more ${cake}`, exact: true });
const less = (page: Page, cake: string) => builder(page).getByRole("button", { name: `One less ${cake}`, exact: true });

async function pick(page: Page, cake: string, times: number) {
  for (let i = 0; i < times; i++) await more(page, cake).click();
}

const savedMixes = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("cakely-birthday-mixes") ?? "[]"));

test("@purchase a birthday box built on the home page goes to the order with its flavours", async ({ page, hostinger }) => {
  await page.goto("/");

  // Sold-out cakes can't be picked.
  await expect(more(page, "Cookies & Cream")).toHaveCount(0);

  // The box can only be added once it holds exactly ten.
  await expect(addBox(page)).toBeDisabled();
  await pick(page, "Coconut", 5);
  await less(page, "Coconut").click();
  await expect(box(page)).toContainText("4 / 10");
  await pick(page, "Chocofudge Brigadeiro", 3);
  await pick(page, "Lemon", 2);
  await expect(addBox(page)).toBeDisabled();
  await pick(page, "Lemon", 1);
  await expect(box(page)).toContainText("10 / 10");
  await expect(more(page, "Coconut")).toBeDisabled();

  await addBox(page).click();
  await expect(basketLink(page)).toHaveAccessibleName("Basket, 1 items");
  // The builder is ready for another box.
  await expect(box(page)).toContainText("0 / 10");

  await basketLink(page).click();
  await expect(page.getByText("4 Coconut, 3 Chocolate, 3 Lemon")).toBeVisible();
  await page.getByRole("link", { name: "Proceed to Checkout" }).click();
  await waitForCheckout(page);
  await fillDetails(page);
  await pickDate(page, SAT_7_NOV);
  await placeOrder(page);
  await expect(page.getByRole("heading", { name: "Thank you for your order!" })).toBeVisible();

  const [order] = hostinger.orders;
  expect(order.items).toEqual([{ variant_id: "var_birthday", quantity: 1 }]);
  expect(order.shipping_address).toMatchObject({ address_2: expect.stringMatching(/· Birthday box: 4 Coconut, 3 Chocolate, 3 Lemon$/) });
});

test("Surprise me fills the box with ten, spread over the flavours", async ({ page }) => {
  await page.goto("/");
  await pick(page, "Lemon", 2);
  await builder(page).getByRole("button", { name: "Surprise me" }).click();
  await expect(box(page)).toContainText("10 / 10");
  await addBox(page).click();

  const [mix] = await savedMixes(page);
  // Three flavours in stock: 4 + 3 + 3, in some order.
  expect(Object.values(mix).sort()).toEqual([3, 3, 4]);
  expect(Object.keys(mix).sort()).toEqual(["var_choco", "var_coconut", "var_lemon"]);
});

test("each birthday box keeps its own flavours", async ({ page }) => {
  await page.goto("/");
  await pick(page, "Coconut", 10);
  await addBox(page).click();
  await pick(page, "Lemon", 10);
  await addBox(page).click();

  await expect(basketLink(page)).toHaveAccessibleName("Basket, 2 items");
  expect(await savedMixes(page)).toEqual([{ var_coconut: 10 }, { var_lemon: 10 }]);
  await basketLink(page).click();
  await expect(page.getByText("Box 1: 10 Coconut")).toBeVisible();
  await expect(page.getByText("Box 2: 10 Lemon")).toBeVisible();
});

test("a Birthday Special added from its product page is mixed by the bakery", async ({ page, hostinger }) => {
  await page.goto("/products/birthday-special");
  await page.getByRole("button", { name: "Add to Basket" }).first().click();
  await basketLink(page).click();
  await expect(page.getByText("mixed by us")).toBeVisible();
  await page.getByRole("link", { name: "Proceed to Checkout" }).click();
  await waitForCheckout(page);
  await fillDetails(page);
  await pickDate(page, SAT_7_NOV);
  await placeOrder(page);
  await expect(page.getByRole("heading", { name: "Thank you for your order!" })).toBeVisible();
  // No mix was chosen, so the order carries only the delivery date.
  expect(hostinger.orders[0].shipping_address).toMatchObject({ address_2: expect.stringMatching(/^Delivery: Saturday,? 7 November 2026$/) });
});

test("the flavour carousel moves one cake at a time with its arrows", async ({ page }) => {
  await page.goto("/");
  const row = page.getByRole("list", { name: "Our cakes" });
  const prev = page.getByRole("button", { name: "Previous cake" });
  const next = page.getByRole("button", { name: "Next cake" });
  await row.scrollIntoViewIfNeeded();

  await expect(prev).toBeDisabled();
  const panel = await row.locator("> li").first().evaluate((el) => el.getBoundingClientRect().width);
  await next.click();
  await expect.poll(() => row.evaluate((el) => Math.round(el.scrollLeft))).toBe(Math.round(panel));
  await expect(prev).toBeEnabled();
  await prev.click();
  await expect.poll(() => row.evaluate((el) => el.scrollLeft)).toBe(0);
});

test("the basket bar can be closed and comes back when the basket changes", async ({ page }) => {
  await page.goto("/products/coconut");
  await page.getByRole("button", { name: "Add to Basket" }).first().click();
  const close = page.getByRole("button", { name: "Hide basket bar" });
  await expect(close).toBeVisible();
  await close.click();
  await expect(close).toBeHidden();

  // Still closed on the next page.
  await page.goto("/search");
  await expect(page.getByRole("button", { name: "Hide basket bar" })).toBeHidden();

  // Adding another cake brings it back.
  await page.getByRole("button", { name: "Add to Basket" }).first().click();
  await expect(page.getByRole("button", { name: "Hide basket bar" })).toBeVisible();
});

test("lowering Birthday Specials in the basket drops the last box's flavours", async ({ page }) => {
  await page.goto("/");
  await pick(page, "Coconut", 10);
  await addBox(page).click();
  await pick(page, "Lemon", 10);
  await addBox(page).click();

  await basketLink(page).click();
  await expect(page.getByText("Box 2: 10 Lemon")).toBeVisible();
  await page.getByRole("button", { name: "Decrease Birthday Special quantity" }).click();
  await expect(page.getByText("10 Coconut")).toBeVisible();
  await expect(page.getByText("10 Lemon")).toHaveCount(0);
  expect(await savedMixes(page)).toEqual([{ var_coconut: 10 }]);

  // A box added again afterwards starts without a mix.
  await page.getByRole("button", { name: "Increase Birthday Special quantity" }).click();
  await expect(page.getByText("Box 2: mixed by us")).toBeVisible();
});
