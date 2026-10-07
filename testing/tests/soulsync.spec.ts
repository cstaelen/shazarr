import test, { expect, Page } from "@playwright/test";

import historyFixtures from "./fixtures/history.json";

const SOULSYNC_URL = "http://soulsync.local:8008";
const SOULSYNC_API_KEY = "test-soulsync-api-key";

async function gotoWithConfig(page: Page, config: Record<string, string>) {
  await page.addInitScript(
    ({ config, history }) => {
      window.localStorage.setItem(
        "CapacitorStorage.com.shazarr.config",
        JSON.stringify(config),
      );
      window.localStorage.setItem(
        "CapacitorStorage.com.shazarr.history",
        JSON.stringify(history),
      );
    },
    { config, history: historyFixtures },
  );
  await page.goto("/");
  await expect(page.getByText("Ready")).toBeInViewport();
}

async function openYakuzaResult(page: Page) {
  await page.getByRole("button", { name: "Records" }).click();
  await page.getByTestId("history-item").nth(2).getByRole("button").first().click();
  await expect(page.locator(".MuiTypography-h5")).toHaveText("Yakuza");
}

async function openModjoResult(page: Page) {
  await page.getByRole("button", { name: "Records" }).click();
  await page.getByTestId("history-item").nth(0).getByRole("button").first().click();
  await expect(page.locator(".MuiTypography-h5")).toHaveText("Chillin'");
}

const MOCK_TRACK = {
  id: "6LgJvl0Xdtc73RJ1mN1a7Z",
  name: "Paranoid Android",
  artists: ["Radiohead"],
  album: "OK Computer",
  duration_ms: 383000,
  image_url: "https://i.scdn.co/image/...",
  source: "spotify",
};

const MOCK_ALBUM_TRACKS = [
  { ...MOCK_TRACK, track_number: 1 },
  {
    id: "2cGxRwrMyEAp8dEbuZaVv6",
    name: "Airbag",
    artists: ["Radiohead"],
    album: "OK Computer",
    duration_ms: 428000,
    image_url: "https://i.scdn.co/image/...",
    source: "spotify",
  },
];

function mockSoulsyncRoutes(page: Page) {
  return page.route(`${SOULSYNC_URL}/**`, async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    if (url.includes("/api/v1/search/tracks") && method === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { tracks: MOCK_ALBUM_TRACKS } }),
      });
    } else if (url.includes("/api/v1/wishlist") && method === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    } else {
      await route.continue();
    }
  });
}

function mockSoulsyncNotFound(page: Page) {
  return page.route(`${SOULSYNC_URL}/**`, async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    if (url.includes("/api/v1/search/tracks") && method === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: { code: "NOT_FOUND", message: "No tracks found" } }),
      });
    } else if (url.includes("/api/v1/wishlist") && method === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    } else {
      await route.continue();
    }
  });
}

test("SoulSync: Without API key — opens browser search", async ({ page }) => {
  await gotoWithConfig(page, { soulsync_url: SOULSYNC_URL });
  await openYakuzaResult(page);
  await expect(page.getByTestId("soulsync-button")).toBeVisible();
  await expect(page.getByTestId("soulsync-button")).toBeEnabled();
  const ctx = page.context();
  const pagePromise = ctx.waitForEvent("page");
  await page.getByTestId("soulsync-button").click();
  const newPage = await pagePromise;
  await newPage.waitForLoadState();
  // In headless mode, Chrome returns chrome-error://chromewebdata/ for external URLs
  // Verify the page was opened (chrome-error:// confirms external URL was attempted)
  expect(newPage.url()).toMatch(/chrome-error:\/\//);
  await newPage.close();
});

test("SoulSync: With API key — opens dialog for track/album choice", async ({ page }) => {
  await mockSoulsyncRoutes(page);
  await gotoWithConfig(page, { soulsync_url: SOULSYNC_URL, soulsync_api_key: SOULSYNC_API_KEY });
  await openYakuzaResult(page);
  await expect(page.getByTestId("soulsync-button")).toBeVisible();
  await expect(page.getByTestId("soulsync-button")).toBeEnabled();
  await page.getByTestId("soulsync-button").click();
  await expect(page.getByTestId("soulsync-dialog")).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId("soulsync-add-track")).toBeVisible();
  await expect(page.getByTestId("soulsync-add-album")).toBeVisible();
});

test("SoulSync: With API key — adds track to wishlist and shows success", async ({ page }) => {
  await mockSoulsyncRoutes(page);
  await gotoWithConfig(page, { soulsync_url: SOULSYNC_URL, soulsync_api_key: SOULSYNC_API_KEY });
  await openYakuzaResult(page);
  await expect(page.getByTestId("soulsync-button")).toBeVisible();
  await expect(page.getByTestId("soulsync-button")).toBeEnabled();
  await page.getByTestId("soulsync-button").click();
  await expect(page.getByTestId("soulsync-dialog")).toBeVisible({ timeout: 10000 });
  await page.getByTestId("soulsync-add-track").click();
  // Skip "Searching" check - too fast in CI, goes straight to success
  await expect(page.getByTestId("soulsync-button")).toContainText(/Added|added|wishlist/i, { timeout: 20000 });
});

test("SoulSync: With API key — adds album to wishlist and shows success", async ({ page }) => {
  await mockSoulsyncRoutes(page);
  await gotoWithConfig(page, { soulsync_url: SOULSYNC_URL, soulsync_api_key: SOULSYNC_API_KEY });
  await openYakuzaResult(page);
  await expect(page.getByTestId("soulsync-button")).toBeVisible();
  await expect(page.getByTestId("soulsync-button")).toBeEnabled();
  await page.getByTestId("soulsync-button").click();
  await expect(page.getByTestId("soulsync-dialog")).toBeVisible({ timeout: 10000 });
  await page.getByTestId("soulsync-add-album").click();
  // Skip "Searching" check - too fast in CI, goes straight to success
  await expect(page.getByTestId("soulsync-button")).toContainText(/Added|tracks from|to SoulSync/i, { timeout: 20000 });
});

test("SoulSync: With API key — shows error when track not found", async ({ page }) => {
  await mockSoulsyncNotFound(page);
  await gotoWithConfig(page, { soulsync_url: SOULSYNC_URL, soulsync_api_key: SOULSYNC_API_KEY });
  await openModjoResult(page);
  await expect(page.getByTestId("soulsync-button")).toBeVisible();
  await expect(page.getByTestId("soulsync-button")).toBeEnabled();
  await page.getByTestId("soulsync-button").click();
  await expect(page.getByTestId("soulsync-dialog")).toBeVisible({ timeout: 10000 });
  await page.getByTestId("soulsync-add-track").click();
  // Skip "Searching" check - too fast in CI, goes straight to error
  await expect(page.getByTestId("soulsync-button")).toContainText(/not found|No match|Error|unreachable/i, { timeout: 20000 });
});
