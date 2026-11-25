import test, { expect } from "@playwright/test";

import { gotoWithLocalStorage, historyCard } from "./utils/helpers";

/**
 * The cards stack the title and the artist in two blocks and carry no date any
 * more — it lives in the result panel — so each is asserted on its own rather
 * than on the card's run-together text.
 */
const expectedHistory = [
  { title: "Chillin'", artist: "Modjo" },
  { title: "Fly Like an Eagle", artist: "Steve Miller Band" },
  { title: "Yakuza", artist: "Szymon" },
];

test("History: Should see tracks history", async ({ page }) => {
  // Load localstorage
  gotoWithLocalStorage("/", page);

  await expect(page.getByText("Ready")).toBeInViewport();

  // Open history panel
  await page.getByRole("button", { name: "Records" }).click();
  await expect(page.getByTestId("history-item")).toHaveCount(3);

  const rows = page.getByTestId("history-item");
  const count = await rows.count();
  for (let i = 0; i < count; ++i) {
    await expect(rows.nth(i)).toContainText(expectedHistory[i].title);
    await expect(rows.nth(i)).toContainText(expectedHistory[i].artist);
  }

  // Click on history item
  await page.getByTestId("history-item").nth(2).getByRole("button").first().click();

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
  await page.getByRole("button", { name: "Records" }).click();

  // Click on history item
  await page.getByTestId("history-item").nth(1).getByRole("button").last().click();

  await expect(page.getByTestId("history-item")).toHaveCount(2);

  // Refresh and check
  await page.reload();
  await page.getByRole("button", { name: "Records" }).click();

  await expect(historyCard(page, expectedHistory[0].title)).toBeVisible();
  await expect(historyCard(page, expectedHistory[1].title)).toHaveCount(0);
  await expect(historyCard(page, expectedHistory[2].title)).toBeVisible();
});

test("History: Should be able to remove 2 items", async ({ page }) => {
  // Load localstorage
  gotoWithLocalStorage("/", page);

  await expect(page.getByText("Ready")).toBeInViewport();

  // Open history panel
  await page.getByRole("button", { name: "Records" }).click();

  // Click on history item
  await page.getByTestId("history-item").nth(0).getByRole("button").last().click();

  await expect(page.getByTestId("history-item")).toHaveCount(2);

  // Click on history item
  await page.getByTestId("history-item").nth(0).getByRole("button").last().click();

  await expect(page.getByTestId("history-item")).toHaveCount(1);

  // Refresh and check
  await page.reload();
  await page.getByRole("button", { name: "Records" }).click();

  await expect(historyCard(page, expectedHistory[0].title)).toHaveCount(0);
  await expect(historyCard(page, expectedHistory[1].title)).toHaveCount(0);
  await expect(historyCard(page, expectedHistory[2].title)).toBeVisible();
});

test("History: Should be able to consult 2 different items", async ({ page }) => {
  // Load localstorage
  gotoWithLocalStorage("/", page);

  await expect(page.getByText("Ready")).toBeInViewport();

  // Open history panel
  await page.getByRole("button", { name: "Records" }).click();

  // Click on history item
  await page.getByTestId("history-item").nth(0).getByRole("button").first().click();

  await expect(page.getByText("Chillin'ModjoPlay AlbumModjo")).toHaveScreenshot({
    maxDiffPixelRatio: 0.15,
  });

  // Close result — the history panel stays open underneath, no need to reopen it
  await page.getByRole("button", { name: "Close" }).click();

  // Click on history item
  await page.getByTestId("history-item").nth(1).getByRole("button").first().click();

  await expect(
    page.getByText(
      "Fly Like an EagleSteve Miller BandPlay AlbumFly Like an EagleLabelSteve Miller",
    ),
  ).toHaveScreenshot();
});
