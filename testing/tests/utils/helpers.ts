import { expect, Page } from "@playwright/test";

import historyFixtures from "../fixtures/history.json";

export async function gotoWithLocalStorage(url: string, page: Page) {
  page.goto(url);
  await expect(page.getByText("Shazarr")).toBeVisible();

  const stringifiedData = JSON.stringify(historyFixtures);
  await page.evaluate(
    (stringifiedData) =>
      window.localStorage.setItem(
        "CapacitorStorage.com.shazarr.history",
        stringifiedData,
      ),
    stringifiedData,
  );
  // Reload page with
  page.reload();
}

export async function waitForImgLoaded(page: Page) {
  await page.waitForFunction(() => {
    const images = Array.from(document.querySelectorAll("img"));
    return images.every((img) => img.complete);
  });
}
