import test, { expect } from "@playwright/test";

import { gotoWithLocalStorage } from "./utils/helpers";

const expectedHistory = [
  "Chillin' - Modjo5/17/2024, 11:45:18 AM",
  "Fly Like an Eagle - Steve Miller Band5/17/2024, 11:45:46 AM",
  "Yakuza - Szymon5/17/2024, 11:46:18 AM",
];

test("History: Should see tracks history", async ({ page }) => {
  // Load localstorage
  gotoWithLocalStorage("/", page);

  await expect(page.getByText("Ready")).toBeInViewport();

  // Open history panel
  await page.getByRole("button", { name: "Show records (3)" }).click();
  await expect(page.getByTestId("history-item")).toHaveCount(3);

  const rows = page.getByTestId("history-item");
  const count = await rows.count();
  for (let i = 0; i < count; ++i) {
    await expect(rows.nth(i)).toHaveText(expectedHistory[i]);
  }

  // Click on history item
  await page
    .locator("div:nth-child(3) > .MuiCardActions-root > button")
    .first()
    .click();

  await expect(page.locator(".MuiTypography-h5")).toHaveText("Yakuza");
  await expect(page.getByText("Spotify")).toBeVisible();
  await expect(page.getByText("Deezer")).toBeVisible();
  await expect(page.getByText("Apple")).toBeVisible();

  // Close history
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByText("Shazarr")).toBeInViewport();
});

test("History: Should be able to remove 1 item", async ({ page }) => {
  // Load localstorage
  gotoWithLocalStorage("/", page);

  await expect(page.getByText("Ready")).toBeInViewport();

  // Open history panel
  await page.getByRole("button", { name: "Show records (3)" }).click();

  // Click on history item
  await page
    .locator("div:nth-child(2) > .MuiCardActions-root > button")
    .last()
    .click();

  await expect(page.getByTestId("history-item")).toHaveCount(2);

  // Refresh and check
  await page.reload();
  await page.getByRole("button", { name: "Show records (2)" }).click();

  await expect(page.getByText(expectedHistory[0])).toBeVisible();
  await expect(page.getByText(expectedHistory[1])).not.toBeVisible();
  await expect(page.getByText(expectedHistory[2])).toBeVisible();
});

test("History: Should be able to remove 2 items", async ({ page }) => {
  // Load localstorage
  gotoWithLocalStorage("/", page);

  await expect(page.getByText("Ready")).toBeInViewport();

  // Open history panel
  await page.getByRole("button", { name: "Show records (3)" }).click();

  // Click on history item
  await page
    .locator("div:nth-child(1) > .MuiCardActions-root > button")
    .last()
    .click();

  await expect(page.getByTestId("history-item")).toHaveCount(2);

  // Click on history item
  await page
    .locator("div:nth-child(1) > .MuiCardActions-root > button")
    .last()
    .click();

  await expect(page.getByTestId("history-item")).toHaveCount(1);

  // Refresh and check
  await page.reload();
  await page.getByRole("button", { name: "Show records (1)" }).click();

  await expect(page.getByText(expectedHistory[0])).not.toBeVisible();
  await expect(page.getByText(expectedHistory[1])).not.toBeVisible();
  await expect(page.getByText(expectedHistory[2])).toBeVisible();
});
