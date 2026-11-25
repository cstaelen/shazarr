import { expect, Page } from "@playwright/test";

import historyFixtures from "../fixtures/history.json";

export const HISTORY_KEY = "CapacitorStorage.com.shazarr.history";
const CONFIG_KEY = "CapacitorStorage.com.shazarr.config";

export async function gotoWithLocalStorage(url: string, page: Page) {
  page.goto(url);
  await expect(page.getByText("Shazarr")).toBeVisible();

  const stringifiedData = JSON.stringify(historyFixtures);
  await page.evaluate(({ key, data }) => window.localStorage.setItem(key, data), {
    key: HISTORY_KEY,
    data: stringifiedData,
  });
  // Reload page with
  page.reload();
}

/**
 * Seeds both stores before the app boots, for tests that need a history or a
 * config of their own. `gotoWithLocalStorage` always loads the whole fixture
 * and reloads, which cannot express "this record was already requested".
 */
export async function gotoWithStore(
  page: Page,
  { history, config }: { history?: unknown; config?: unknown } = {},
) {
  await page.addInitScript(
    ({ history, config, historyKey, configKey }) => {
      if (history) window.localStorage.setItem(historyKey, JSON.stringify(history));
      if (config) window.localStorage.setItem(configKey, JSON.stringify(config));
    },
    { history, config, historyKey: HISTORY_KEY, configKey: CONFIG_KEY },
  );
  await page.goto("/");
  await expect(page.getByText("Ready")).toBeInViewport();
}

/** The cards stack title and artist, so they are addressed by their title. */
export function historyCard(page: Page, title: string) {
  return page.getByTestId("history-item").filter({ hasText: title });
}

export async function waitForImgLoaded(page: Page) {
  await page.waitForFunction(() => {
    const images = Array.from(document.querySelectorAll("img"));
    return images.every((img) => img.complete);
  });
}
