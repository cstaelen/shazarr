import test, { expect, Page } from "@playwright/test";

import historyFixtures from "./fixtures/history.json";

const LIDARR_URL = "http://lidarr.server.docker";
const LIDARR_API_KEY = "test-lidarr-api-key";

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
  await page.getByRole("button", { name: "Show records (3)" }).click();
  await page.locator("div:nth-child(3) > .MuiCardActions-root > button").first().click();
  await expect(page.locator(".MuiTypography-h5")).toHaveText("Yakuza");
}

function mockLidarrRoutes(page: Page, overrides: { artistLookup?: unknown[]; albums?: unknown[] } = {}) {
  return page.route(`${LIDARR_URL}/**`, async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes("/api/v1/artist") && !url.includes("lookup") && method === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    } else if (url.includes("/api/v1/artist/lookup")) {
      const body = overrides.artistLookup ?? [{ foreignArtistId: "abc-123", artistName: "Szymon" }];
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
    } else if (url.includes("/api/v1/artist") && method === "POST") {
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ id: 1 }) });
    } else if (url.includes("/api/v1/album") && url.includes("artistId=1")) {
      const body = overrides.albums ?? [{ id: 10, title: "Blue Coloured Mountain", artistId: 1 }];
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
    } else if (url.includes("/api/v1/qualityprofile")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: 1, name: "Any" }]) });
    } else if (url.includes("/api/v1/metadataprofile")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: 1, name: "Standard" }]) });
    } else if (url.includes("/api/v1/rootfolder")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ path: "/music" }]) });
    } else if (url.includes("/api/v1/command")) {
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ id: 99 }) });
    } else {
      await route.continue();
    }
  });
}

test("Lidarr: Without API key — opens browser search", async ({ page }) => {
  await gotoWithConfig(page, { lidarr_url: LIDARR_URL });
  await openYakuzaResult(page);

  let capturedUrl = "";
  const ctx = page.context();
  await ctx.route(`${LIDARR_URL}/**`, (route) => {
    capturedUrl = route.request().url();
    route.abort();
  });

  const pagePromise = ctx.waitForEvent("page");
  await page.getByRole("button", { name: "Download with Lidarr" }).click();
  await pagePromise;
  await page.waitForTimeout(200);
  await ctx.unroute(`${LIDARR_URL}/**`);

  expect(capturedUrl).toEqual(
    `${LIDARR_URL}/add/search?term=Blue%20Coloured%20Mountain%20Szymon`,
  );
});

test("Lidarr: With API key — calls API and shows success", async ({ page }) => {
  await mockLidarrRoutes(page);
  await gotoWithConfig(page, { lidarr_url: LIDARR_URL, lidarr_api_key: LIDARR_API_KEY });
  await openYakuzaResult(page);

  await page.getByRole("button", { name: "Download with Lidarr" }).click();
  await expect(page.getByRole("button", { name: /Searching/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Added to Lidarr!" })).toBeVisible({
    timeout: 15000,
  });
});

test("Lidarr: With API key — shows error when not found", async ({ page }) => {
  await mockLidarrRoutes(page, { artistLookup: [] });
  await gotoWithConfig(page, { lidarr_url: LIDARR_URL, lidarr_api_key: LIDARR_API_KEY });
  await openYakuzaResult(page);

  await page.getByRole("button", { name: "Download with Lidarr" }).click();
  await expect(
    page.getByRole("button", { name: "Not found — try manually" }),
  ).toBeVisible({ timeout: 10000 });
});
