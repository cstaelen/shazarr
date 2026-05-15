import test, { expect, Page } from "@playwright/test";

import historyFixtures from "./fixtures/history.json";

const TIDARR_URL = "http://tidarr.server.docker";
const TIDARR_API_KEY = "test-tidarr-api-key";

const MOCK_ALBUM = {
  id: 42,
  title: "Blue Coloured Mountain",
  cover: "abc1-23-456",
  releaseDate: "2017-01-01",
  numberOfTracks: 10,
  artists: [{ id: 1, name: "Szymon" }],
};

const MOCK_TRACK = { id: 999, title: "Yakuza", url: "", artists: [{ id: 1, name: "Szymon" }] };

const MOCK_SETTINGS = {
  tiddl_config: {
    auth: { country_code: "FR", user_id: "12345" },
    download: { track_quality: "high" },
  },
};

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
  await page.locator("div:nth-child(3) > .MuiCardActions-root > button").first().click();
  await expect(page.locator(".MuiTypography-h5")).toHaveText("Yakuza");
}

function mockTidarrRoutes(
  page: Page,
  overrides: { search?: unknown; albumTracks?: unknown } = {},
) {
  return page.route(`${TIDARR_URL}/**`, async (route) => {
    const url = route.request().url();

    if (url.includes("/proxy/tidal/v2/search")) {
      const body = overrides.search ?? { albums: { items: [MOCK_ALBUM] } };
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
    } else if (url.includes("/proxy/tidal/v1/pages/album")) {
      const body = overrides.albumTracks ?? {
        rows: [null, { modules: [{ pagedList: { items: [{ item: MOCK_TRACK }] } }] }],
      };
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
    } else if (url.includes("/api/settings")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_SETTINGS) });
    } else if (url.includes("/api/save") && route.request().method() === "POST") {
      await route.fulfill({ status: 201, body: "Created" });
    } else if (url.includes("/proxy/tidal/v1/users/12345/favorites/tracks")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    } else {
      await route.continue();
    }
  });
}

test("Tidarr: Without API key — opens browser search", async ({ page }) => {
  await gotoWithConfig(page, { tidarr_url: TIDARR_URL });
  await openYakuzaResult(page);

  let capturedUrl = "";
  const ctx = page.context();
  await ctx.route(`${TIDARR_URL}/**`, (route) => {
    capturedUrl = route.request().url();
    route.abort();
  });

  const pagePromise = ctx.waitForEvent("page");
  await page.getByRole("button", { name: "Download with Tidarr" }).click();
  await pagePromise;
  await page.waitForTimeout(200);
  await ctx.unroute(`${TIDARR_URL}/**`);

  expect(capturedUrl).toEqual(`${TIDARR_URL}/search/Yakuza%20Szymon`);
});

test("Tidarr: With API key — shows album modal", async ({ page }) => {
  await mockTidarrRoutes(page);
  await gotoWithConfig(page, { tidarr_url: TIDARR_URL, tidarr_api_key: TIDARR_API_KEY });
  await openYakuzaResult(page);

  await page.getByRole("button", { name: "Download with Tidarr" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 10000 });
  await expect(dialog.getByText("Blue Coloured Mountain")).toBeVisible();
  await expect(dialog.getByText("Szymon")).toBeVisible();
  await expect(dialog.getByText("2017")).toBeVisible();
  await expect(dialog.getByText("10 tracks")).toBeVisible();
});

test("Tidarr: With API key — shows error when no albums found", async ({ page }) => {
  await mockTidarrRoutes(page, { search: { albums: { items: [] } } });
  await gotoWithConfig(page, { tidarr_url: TIDARR_URL, tidarr_api_key: TIDARR_API_KEY });
  await openYakuzaResult(page);

  await page.getByRole("button", { name: "Download with Tidarr" }).click();
  await expect(
    page.getByRole("button", { name: "Track not found on Tidal" }),
  ).toBeVisible({ timeout: 10000 });
});

