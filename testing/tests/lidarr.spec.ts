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
  await page.getByRole("button", { name: "Records" }).click();
  await page.locator("div:nth-child(3) > .MuiCardActions-root > button").first().click();
  await expect(page.locator(".MuiTypography-h5")).toHaveText("Yakuza");
}

async function openModjoResult(page: Page) {
  await page.getByRole("button", { name: "Records" }).click();
  await page.locator("div:nth-child(1) > .MuiCardActions-root > button").first().click();
  await expect(page.locator(".MuiTypography-h5")).toHaveText("Chillin'");
}

const DEFAULT_ARTIST = { id: 1, artistName: "Szymon", foreignArtistId: "abc-123" };
const DEFAULT_ALBUM = { id: 10, title: "Blue Coloured Mountain", artistId: 1, monitored: false, statistics: { percentOfTracks: 0 } };
const DEFAULT_SEARCH = [{ foreignId: "abc-album-123", album: { id: 10, title: "Blue Coloured Mountain", foreignAlbumId: "abc-album-123", artistId: 1, monitored: false, artist: { foreignArtistId: "abc-123", artistName: "Szymon" } } }];

function mockLidarrRoutes(
  page: Page,
  overrides: {
    artists?: unknown[];
    artistLookup?: unknown[];
    albums?: unknown[];
    albumByForeignId?: unknown[];
    search?: unknown[];
  } = {},
) {
  return page.route(`${LIDARR_URL}/**`, async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes("/api/v1/search")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(overrides.search ?? DEFAULT_SEARCH) });
    } else if (url.includes("/api/v1/artist") && !url.includes("lookup") && method === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(overrides.artists ?? [DEFAULT_ARTIST]) });
    } else if (url.includes("/api/v1/artist/lookup")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(overrides.artistLookup ?? [DEFAULT_ARTIST]) });
    } else if (url.includes("/api/v1/artist") && method === "POST") {
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ id: 1 }) });
    } else if (url.includes("/api/v1/album") && url.includes("foreignAlbumId=")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(overrides.albumByForeignId ?? [DEFAULT_ALBUM]) });
    } else if (url.includes("/api/v1/album") && url.includes("artistId=")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(overrides.albums ?? [DEFAULT_ALBUM]) });
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
  await expect(page.getByRole("button", { name: "Search triggered in Lidarr!" })).toBeVisible({
    timeout: 15000,
  });
});

test("Lidarr: With API key — matches album despite (Remastered) suffix in title", async ({ page }) => {
  // Modjo fixture has album "Modjo (Remastered)" — Lidarr stores it as "Modjo"
  const modjoArtist = { id: 1, artistName: "Modjo", foreignArtistId: "modjo-123" };
  const modjoAlbum = { id: 20, title: "Modjo", artistId: 1, monitored: false, statistics: { percentOfTracks: 0 } };
  await mockLidarrRoutes(page, {
    artists: [modjoArtist],
    artistLookup: [modjoArtist],
    albums: [modjoAlbum],
    albumByForeignId: [modjoAlbum],
    search: [{ foreignId: "modjo-album-123", album: { id: 20, title: "Modjo", foreignAlbumId: "modjo-album-123", artistId: 1, monitored: false, artist: { foreignArtistId: "modjo-123", artistName: "Modjo" } } }],
  });
  await gotoWithConfig(page, { lidarr_url: LIDARR_URL, lidarr_api_key: LIDARR_API_KEY });
  await openModjoResult(page);

  await page.getByRole("button", { name: "Download with Lidarr" }).click();
  await expect(page.getByRole("button", { name: /Searching/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Search triggered in Lidarr!" })).toBeVisible({
    timeout: 15000,
  });
});

test("Lidarr: With API key — finds album via /search fallback when not in local artist albums", async ({ page }) => {
  // Artist exists locally but album is missing (e.g. excluded by metadata profile) — found via /search
  const searchResult = [{ foreignId: "abc-album-123", album: { id: 10, title: "Blue Coloured Mountain", foreignAlbumId: "abc-album-123", artistId: 1, monitored: false, artist: { foreignArtistId: "abc-123", artistName: "Szymon" } } }];
  await mockLidarrRoutes(page, { albums: [], search: searchResult });
  await gotoWithConfig(page, { lidarr_url: LIDARR_URL, lidarr_api_key: LIDARR_API_KEY });
  await openYakuzaResult(page);

  await page.getByRole("button", { name: "Download with Lidarr" }).click();
  await expect(page.getByRole("button", { name: /Searching/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Search triggered in Lidarr!" })).toBeVisible({
    timeout: 15000,
  });
});

test("Lidarr: With API key — shows error when album not found in search", async ({ page }) => {
  // Artist found but album not in local list and not found via /search
  await mockLidarrRoutes(page, { albums: [], search: [] });
  await gotoWithConfig(page, { lidarr_url: LIDARR_URL, lidarr_api_key: LIDARR_API_KEY });
  await openYakuzaResult(page);

  await page.getByRole("button", { name: "Download with Lidarr" }).click();
  await expect(
    page.getByRole("button", { name: "Album not found in Lidarr" }),
  ).toBeVisible({ timeout: 10000 });
});

