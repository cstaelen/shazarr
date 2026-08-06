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
  await page.getByTestId("history-item").nth(2).getByRole("button").first().click();
  await expect(page.locator(".MuiTypography-h5")).toHaveText("Yakuza");
}

async function openModjoResult(page: Page) {
  await page.getByRole("button", { name: "Records" }).click();
  await page.getByTestId("history-item").nth(0).getByRole("button").first().click();
  await expect(page.locator(".MuiTypography-h5")).toHaveText("Chillin'");
}

const DEFAULT_ARTIST = { id: 1, artistName: "Szymon", foreignArtistId: "abc-123" };
const DEFAULT_ALBUM = { id: 10, title: "Blue Coloured Mountain", artistId: 1, monitored: false, statistics: { percentOfTracks: 0 } };

function mockLidarrRoutes(
  page: Page,
  overrides: {
    artists?: unknown[];
    artistLookup?: unknown[];
    albums?: unknown[];
    onArtistCreate?: (body: Record<string, unknown>) => void;
  } = {},
) {
  // Mutable state so GET after PUT reflects the change — mirrors ensureMonitored's
  // verify-then-retry behavior against a real server.
  const artists = new Map(
    (overrides.artists ?? [DEFAULT_ARTIST]).map((a) => [(a as { id: number }).id, { ...a }]),
  );
  const albums = new Map(
    (overrides.albums ?? [DEFAULT_ALBUM]).map((a) => [(a as { id: number }).id, { ...a }]),
  );
  let nextArtistId = 1000;

  const routePromise = page.route(`${LIDARR_URL}/**`, async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    const idMatch = url.match(/\/api\/v1\/(artist|album)\/(\d+)$/);

    if (idMatch && method === "GET") {
      const [, kind, id] = idMatch;
      const store = kind === "artist" ? artists : albums;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(store.get(Number(id))) });
    } else if (idMatch && method === "PUT") {
      const [, kind, id] = idMatch;
      const store = kind === "artist" ? artists : albums;
      const body = route.request().postDataJSON();
      store.set(Number(id), body);
      await route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify(body) });
    } else if (url.includes("/api/v1/artist") && !url.includes("lookup") && method === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([...artists.values()]) });
    } else if (url.includes("/api/v1/artist/lookup")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(overrides.artistLookup ?? [DEFAULT_ARTIST]) });
    } else if (url.includes("/api/v1/artist") && method === "POST") {
      const body = route.request().postDataJSON();
      overrides.onArtistCreate?.(body);
      const id = nextArtistId++;
      // Real Lidarr often doesn't honor monitored: true on create — simulate
      // that so ensureArtistMonitored's verify-then-retry loop is exercised.
      artists.set(id, { ...body, id, monitored: false });
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ id }) });
    } else if (url.includes("/api/v1/album") && url.includes("artistId=")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([...albums.values()]) });
    } else if (url.includes("/api/v1/qualityprofile")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: 1, name: "Any" }]) });
    } else if (url.includes("/api/v1/metadataprofile")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: 1, name: "Standard" }]) });
    } else if (url.includes("/api/v1/rootfolder")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ path: "/music" }]) });
    } else if (url.includes("/api/v1/command") && method === "GET") {
      // No RefreshArtist commands pending — waitForArtistRefresh returns immediately.
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    } else if (url.includes("/api/v1/command")) {
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ id: 99 }) });
    } else {
      await route.continue();
    }
  });

  return { routePromise, artists, albums };
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
  });
  await gotoWithConfig(page, { lidarr_url: LIDARR_URL, lidarr_api_key: LIDARR_API_KEY });
  await openModjoResult(page);

  await page.getByRole("button", { name: "Download with Lidarr" }).click();
  await expect(page.getByRole("button", { name: /Searching/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Search triggered in Lidarr!" })).toBeVisible({
    timeout: 15000,
  });
});

test("Lidarr: With API key — newly added artist's matched album is explicitly monitored, others left untouched", async ({ page }) => {
  // Artist doesn't exist locally yet; ensureArtist creates it with monitor: "none",
  // so Lidarr populates albums unmonitored — only the matched album gets PUT-monitored.
  const otherAlbum = { id: 11, title: "Some Other Album", artistId: 1, monitored: false, statistics: { percentOfTracks: 0 } };
  let artistPostBody: { monitored?: boolean; addOptions?: { monitor?: string } } | undefined;

  const { albums } = await mockLidarrRoutes(page, {
    artists: [],
    artistLookup: [DEFAULT_ARTIST],
    albums: [DEFAULT_ALBUM, otherAlbum],
    onArtistCreate: (body) => {
      artistPostBody = body as typeof artistPostBody;
    },
  });

  await gotoWithConfig(page, { lidarr_url: LIDARR_URL, lidarr_api_key: LIDARR_API_KEY });
  await openYakuzaResult(page);

  await page.getByRole("button", { name: "Download with Lidarr" }).click();
  await expect(page.getByRole("button", { name: /Searching/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Search triggered in Lidarr!" })).toBeVisible({
    timeout: 15000,
  });

  // Artist-level monitoring is on, but nothing is auto-monitored on artist add.
  expect(artistPostBody?.monitored).toBe(true);
  expect(artistPostBody?.addOptions?.monitor).toBe("none");

  // Only the shazarred album ends up monitored; the rest of the discography is untouched.
  expect(albums.get(DEFAULT_ALBUM.id)?.monitored).toBe(true);
  expect(albums.get(otherAlbum.id)?.monitored).toBe(false);
});

test("Lidarr: With API key — monitors an already-existing artist's unmonitored album before searching", async ({ page }) => {
  // Artist already exists locally with the album present but unmonitored (e.g. user
  // added it manually before) — Shazarr must monitor it before triggering the search.
  const { albums } = await mockLidarrRoutes(page, { albums: [DEFAULT_ALBUM] });

  await gotoWithConfig(page, { lidarr_url: LIDARR_URL, lidarr_api_key: LIDARR_API_KEY });
  await openYakuzaResult(page);

  await page.getByRole("button", { name: "Download with Lidarr" }).click();
  await expect(page.getByRole("button", { name: /Searching/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Search triggered in Lidarr!" })).toBeVisible({
    timeout: 15000,
  });

  expect(albums.get(DEFAULT_ALBUM.id)?.monitored).toBe(true);
});

test("Lidarr: With API key — shows error when album not found for existing artist", async ({ page }) => {
  // Artist found locally but the identified album isn't in its album list.
  await mockLidarrRoutes(page, { albums: [] });
  await gotoWithConfig(page, { lidarr_url: LIDARR_URL, lidarr_api_key: LIDARR_API_KEY });
  await openYakuzaResult(page);

  await page.getByRole("button", { name: "Download with Lidarr" }).click();
  await expect(
    page.getByRole("button", { name: "Album not found in Lidarr" }),
  ).toBeVisible({ timeout: 10000 });
});

