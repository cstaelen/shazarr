import test, { expect, Page } from "@playwright/test";

import historyFixtures from "./fixtures/history.json";
import { HISTORY_KEY } from "./utils/helpers";

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

/**
 * The search is made on the track, and Tidal answers with the track carrying
 * its album — without a track count, which is why the dialog hides that field.
 */
const MOCK_SEARCH_TRACK = {
  id: MOCK_TRACK.id,
  title: MOCK_TRACK.title,
  artists: MOCK_ALBUM.artists,
  album: {
    id: MOCK_ALBUM.id,
    title: MOCK_ALBUM.title,
    cover: MOCK_ALBUM.cover,
    releaseDate: MOCK_ALBUM.releaseDate,
  },
};

/** Five further releases carrying the same track, to exercise the collapse. */
const MANY_SEARCH_TRACKS = [
  MOCK_SEARCH_TRACK,
  ...Array.from({ length: 5 }, (_, i) => ({
    id: MOCK_TRACK.id,
    title: MOCK_TRACK.title,
    artists: MOCK_ALBUM.artists,
    album: {
      id: 100 + i,
      title: `Compilation ${i + 1}`,
      cover: MOCK_ALBUM.cover,
      releaseDate: `20${10 + i}-01-01`,
    },
  })),
];

const MOCK_SETTINGS = {
  tiddl_config: {
    auth: { country_code: "FR", user_id: "12345" },
    download: { track_quality: "high" },
  },
};

async function gotoWithConfig(page: Page, config: Record<string, string>) {
  await page.addInitScript(
    ({ config, history }) => {
      window.localStorage.setItem("CapacitorStorage.com.shazarr.config", JSON.stringify(config));
      window.localStorage.setItem("CapacitorStorage.com.shazarr.history", JSON.stringify(history));
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

type RawResponse = { status: number; contentType: string; body: string };

type SavedItem = {
  item: { id: string; type: string; title: string; artist: string; quality?: string; url: string };
};

function mockTidarrRoutes(
  page: Page,
  overrides: {
    search?: unknown;
    albumTracks?: unknown;
    searchRaw?: RawResponse;
    onSave?: (body: SavedItem) => void;
  } = {},
) {
  return page.route(`${TIDARR_URL}/**`, async (route) => {
    const url = route.request().url();

    if (url.includes("/proxy/tidal/v2/search")) {
      if (overrides.searchRaw) {
        await route.fulfill(overrides.searchRaw);
        return;
      }
      const body = overrides.search ?? { tracks: { items: [MOCK_SEARCH_TRACK] } };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    } else if (url.includes("/proxy/tidal/v1/pages/album")) {
      // Shaped like a real album page: the tracks are the ALBUM_ITEMS module,
      // and the recommendation lists that sit beside it carry their entries
      // without the `item` wrapper. Selecting by position instead of by type
      // used to pick one of those.
      const body = overrides.albumTracks ?? {
        rows: [
          { modules: [{ type: "ALBUM_HEADER" }] },
          { modules: [{ type: "ALBUM_ITEMS", pagedList: { items: [{ item: MOCK_TRACK }] } }] },
          { modules: [{ type: "ALBUM_LIST", pagedList: { items: [{ id: 99, title: "Other" }] } }] },
        ],
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    } else if (url.includes("/api/settings")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_SETTINGS),
      });
    } else if (url.includes("/api/save") && route.request().method() === "POST") {
      overrides.onSave?.(route.request().postDataJSON() as SavedItem);
      // Exactly what Tidarr answers: Express' `sendStatus(201)` sends the status
      // text as a text/plain body. Parsing that as JSON reported a download it
      // had really queued as "Unexpected response from Tidarr".
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
});

test("Tidarr: With API key — shows error when the track is nowhere", async ({ page }) => {
  await mockTidarrRoutes(page, { search: { tracks: { items: [] } } });
  await gotoWithConfig(page, { tidarr_url: TIDARR_URL, tidarr_api_key: TIDARR_API_KEY });
  await openYakuzaResult(page);

  await page.getByRole("button", { name: "Download with Tidarr" }).click();
  await expect(page.getByRole("button", { name: "Track not found on Tidal" })).toBeVisible({
    timeout: 10000,
  });
});

test("Tidarr: keeps extra albums behind Show more, and scrolls on a small screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 560 });
  await mockTidarrRoutes(page, { search: { tracks: { items: MANY_SEARCH_TRACKS } } });
  await gotoWithConfig(page, { tidarr_url: TIDARR_URL, tidarr_api_key: TIDARR_API_KEY });
  await openYakuzaResult(page);

  await page.getByRole("button", { name: "Download with Tidarr" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 10000 });

  // The best match leads alone — one card, so one "Album" download button.
  await expect(dialog.getByText("Blue Coloured Mountain")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Album", exact: true })).toHaveCount(1);
  await expect(dialog.getByText("Compilation 1")).toHaveCount(0);

  await dialog.getByRole("button", { name: "Show 5 more albums" }).click();
  await expect(dialog.getByRole("button", { name: "Album", exact: true })).toHaveCount(6);
  await expect(dialog.getByText("Compilation 5")).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Show \d+ more/ })).toHaveCount(0);

  // Six cards overflow this screen, so the content must scroll inside the
  // dialog instead of pushing the dialog past the viewport.
  const content = dialog.locator(".MuiDialogContent-root");
  const overflow = await content.evaluate((el) => ({
    scrollable: el.scrollHeight > el.clientHeight + 1,
    canReachBottom: el.scrollHeight - el.clientHeight,
  }));
  expect(overflow.scrollable).toBe(true);

  await content.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  const scrolledBy = await content.evaluate((el) => el.scrollTop);
  expect(scrolledBy).toBeGreaterThan(0);
  expect(scrolledBy).toBe(overflow.canReachBottom);

  const box = (await dialog.boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(560);
});

/**
 * Regression tests for #386: each of these used to surface as
 * "Track not found on Tidal" or "Invalid API key", sending users to debug the
 * wrong thing.
 */
async function expectTidarrError(page: Page, label: string, raw: RawResponse) {
  await mockTidarrRoutes(page, { searchRaw: raw });
  await gotoWithConfig(page, { tidarr_url: TIDARR_URL, tidarr_api_key: TIDARR_API_KEY });
  await openYakuzaResult(page);

  await page.getByRole("button", { name: "Download with Tidarr" }).click();
  await expect(page.getByRole("button", { name: label })).toBeVisible({ timeout: 10000 });
}

test("Tidarr: rejected API key — reports the key, not a missing track", async ({ page }) => {
  await expectTidarrError(page, "Invalid Tidarr API key", {
    status: 403,
    contentType: "application/json",
    body: JSON.stringify({ error: true, message: "Invalid API key" }),
  });
});

test("Tidarr: not logged in to Tidal — reports Tidal, not the API key", async ({ page }) => {
  await expectTidarrError(page, "Tidarr is not logged in to Tidal", {
    status: 401,
    contentType: "application/json",
    body: JSON.stringify({
      status: 401,
      userMessage: "Authentication required. Please log in to Tidal.",
    }),
  });
});

test("Tidarr: non-JSON response — reports it instead of swallowing it", async ({ page }) => {
  await expectTidarrError(page, "Unexpected response from Tidarr", {
    status: 200,
    contentType: "text/html",
    body: "<!doctype html><html><body>Login</body></html>",
  });
});

test("Tidarr: missing JWT_SECRET — points at Tidarr's own config", async ({ page }) => {
  await expectTidarrError(page, "Tidarr misconfigured — check its logs", {
    status: 403,
    contentType: "application/json",
    body: JSON.stringify({ error: true, message: "JWT secret key is missing." }),
  });
});

/**
 * Regression tests for the queue itself: Tidarr answers `/api/save` with
 * `201 Created` and the status text as its body, which the client used to parse
 * as JSON. The download was really queued, yet the button turned to
 * "Unexpected response from Tidarr" — so the queue path needs a test that goes
 * all the way to the success state, not just to the album dialog.
 */
async function queueFromDialog(page: Page, action: "Album" | "Track") {
  await page.getByRole("button", { name: "Download with Tidarr" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 10000 });
  await dialog.getByRole("button", { name: action, exact: true }).click();
}

test("Tidarr: queueing an album reports success and flags the record", async ({ page }) => {
  const saved: SavedItem[] = [];
  await mockTidarrRoutes(page, { onSave: (body) => saved.push(body) });
  await gotoWithConfig(page, { tidarr_url: TIDARR_URL, tidarr_api_key: TIDARR_API_KEY });
  await openYakuzaResult(page);

  await queueFromDialog(page, "Album");

  await expect(page.getByRole("button", { name: "Added to Tidarr!" })).toBeVisible({
    timeout: 10000,
  });
  expect(saved).toHaveLength(1);
  expect(saved[0].item).toMatchObject({
    id: String(MOCK_ALBUM.id),
    type: "album",
    title: MOCK_ALBUM.title,
    artist: "Szymon",
    quality: "high",
  });

  // The record is flagged...
  await page.getByRole("button", { name: "Close" }).click();
  const card = page.getByTestId("history-item").filter({ hasText: "Yakuza" });
  await expect(card.getByLabel("Requested from Tidarr")).toBeVisible();

  // ...and written to the store, so it is still there next time. Checked in
  // place rather than after a reload: `gotoWithConfig` seeds the store through
  // addInitScript, which runs again on every navigation and would overwrite it.
  const stored = await page.evaluate(
    (key) =>
      JSON.parse(window.localStorage.getItem(key) || "[]") as {
        title: string;
        sentTo?: Record<string, number>;
      }[],
    HISTORY_KEY,
  );
  expect(stored.find((item) => item.title === "Yakuza")?.sentTo?.tidarr).toBeGreaterThan(0);
});

test("Tidarr: queueing a single track sends the track, not the album", async ({ page }) => {
  const saved: SavedItem[] = [];
  await mockTidarrRoutes(page, { onSave: (body) => saved.push(body) });
  await gotoWithConfig(page, { tidarr_url: TIDARR_URL, tidarr_api_key: TIDARR_API_KEY });
  await openYakuzaResult(page);

  await queueFromDialog(page, "Track");

  await expect(page.getByRole("button", { name: "Added to Tidarr!" })).toBeVisible({
    timeout: 10000,
  });
  expect(saved).toHaveLength(1);
  expect(saved[0].item).toMatchObject({
    id: String(MOCK_TRACK.id),
    type: "track",
    title: MOCK_TRACK.title,
    url: `https://listen.tidal.com/track/${MOCK_TRACK.id}`,
  });
});

test("Tidarr: a track missing from the chosen album says so", async ({ page }) => {
  await mockTidarrRoutes(page, {
    albumTracks: {
      rows: [{ modules: [{ type: "ALBUM_ITEMS", pagedList: { items: [] } }] }],
    },
  });
  await gotoWithConfig(page, { tidarr_url: TIDARR_URL, tidarr_api_key: TIDARR_API_KEY });
  await openYakuzaResult(page);

  await queueFromDialog(page, "Track");

  await expect(page.getByRole("button", { name: "Track not found on Tidal" })).toBeVisible({
    timeout: 10000,
  });
  // Nothing was queued, so nothing is flagged either.
  await page.getByRole("button", { name: "Close" }).click();
  await expect(
    page.getByTestId("history-item").filter({ hasText: "Yakuza" }).getByLabel("Requested from"),
  ).toHaveCount(0);
});

test("Tidarr: the favorite button answers on its own wording", async ({ page }) => {
  await mockTidarrRoutes(page);
  await gotoWithConfig(page, { tidarr_url: TIDARR_URL, tidarr_api_key: TIDARR_API_KEY });
  await openYakuzaResult(page);

  await page.getByRole("button", { name: "Download with Tidarr" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 10000 });
  // The heart has no label of its own: it is the third action on the card.
  await dialog.locator(".MuiButton-colorSecondary").click();

  await expect(page.getByRole("button", { name: "Added to Tidal favorites!" })).toBeVisible({
    timeout: 10000,
  });
});
