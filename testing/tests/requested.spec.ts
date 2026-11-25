import test, { expect, Page } from "@playwright/test";

import historyFixtures from "./fixtures/history.json";
import { gotoWithStore, historyCard } from "./utils/helpers";

const [chillin, flyLikeAnEagle, yakuza] = historyFixtures;

/**
 * Chillin' is untouched, Fly Like an Eagle was tagged twice and sent to Lidarr,
 * Yakuza went to two services. `sentTo` records what Shazarr did, so the
 * fixture carries the timestamps the panel is expected to print back.
 */
const LIDARR_SENT_AT = 1715939200000;
const TIDARR_SENT_AT = 1715939300000;
const SOULSYNC_SENT_AT = 1715939400000;

const requestedHistory = [
  chillin,
  {
    ...flyLikeAnEagle,
    previousDates: [1715939000000],
    sentTo: { lidarr: LIDARR_SENT_AT },
  },
  { ...yakuza, sentTo: { tidarr: TIDARR_SENT_AT, soulsync: SOULSYNC_SENT_AT } },
];

async function openRecords(page: Page) {
  await page.getByRole("button", { name: "Records" }).click();
  await expect(page.getByTestId("history-list")).toBeVisible();
}

test("Requested: cards carry a chip per service, and the tag count", async ({ page }) => {
  await gotoWithStore(page, { history: requestedHistory });
  await openRecords(page);

  // A record nobody requested carries no chip at all.
  await expect(historyCard(page, "Chillin'").locator(".MuiChip-root")).toHaveCount(0);

  const eagle = historyCard(page, "Fly Like an Eagle");
  await expect(eagle.getByLabel("Tagged 2 times")).toBeVisible();
  await expect(eagle.getByLabel("Requested from Lidarr")).toBeVisible();
  await expect(eagle.getByLabel("Requested from Tidarr")).toHaveCount(0);

  const szymon = historyCard(page, "Yakuza");
  await expect(szymon.getByLabel("Requested from Tidarr")).toBeVisible();
  await expect(szymon.getByLabel("Requested from SoulSync")).toBeVisible();
  // Tagged once, so no count chip to compete with the service ones.
  await expect(szymon.getByLabel("Tagged 1 times")).toHaveCount(0);
});

test("Requested: the filter hides requested records and brings them back", async ({ page }) => {
  await gotoWithStore(page, { history: requestedHistory });
  await openRecords(page);

  await expect(page.getByTestId("history-item")).toHaveCount(3);

  await page.getByRole("button", { name: "Hide requested (2)" }).click();

  await expect(page.getByTestId("history-item")).toHaveCount(1);
  await expect(historyCard(page, "Chillin'")).toBeVisible();

  const showAll = page.getByRole("button", { name: "Show all (2 hidden)" });
  await expect(showAll).toHaveAttribute("aria-pressed", "true");
  await showAll.click();

  await expect(page.getByTestId("history-item")).toHaveCount(3);
});

test("Requested: no filter button when nothing was requested", async ({ page }) => {
  await gotoWithStore(page, { history: historyFixtures });
  await openRecords(page);

  await expect(page.getByTestId("history-item")).toHaveCount(3);
  await expect(page.getByRole("button", { name: /Hide requested/ })).toHaveCount(0);
});

test("Requested: the setting decides where the filter starts", async ({ page }) => {
  await gotoWithStore(page, {
    history: requestedHistory,
    config: { hide_requested_by_default: true },
  });
  await openRecords(page);

  await expect(page.getByTestId("history-item")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Show all (2 hidden)" })).toBeVisible();

  // The button overrides the setting for the session, without saving it back.
  await page.getByRole("button", { name: "Show all (2 hidden)" }).click();
  await expect(page.getByTestId("history-item")).toHaveCount(3);

  await page.reload();
  await openRecords(page);
  await expect(page.getByTestId("history-item")).toHaveCount(1);
});

test("Requested: says so when the filter empties the list", async ({ page }) => {
  await gotoWithStore(page, {
    history: [{ ...yakuza, sentTo: { tidarr: TIDARR_SENT_AT } }],
    config: { hide_requested_by_default: true },
  });
  await openRecords(page);

  await expect(page.getByTestId("history-item")).toHaveCount(0);
  await expect(page.getByText("Everything has been requested.")).toBeVisible();
});

test("Requested: the result panel lists the services and the tag date", async ({ page }) => {
  await gotoWithStore(page, { history: requestedHistory });
  await openRecords(page);

  await historyCard(page, "Yakuza").getByRole("button").first().click();
  await expect(page.locator(".MuiTypography-h5")).toHaveText("Yakuza");

  // A single tag is shown plainly rather than hidden behind an accordion.
  await expect(page.getByText("Tagged on 5/17/2024, 11:46:18 AM")).toBeVisible();
  await expect(page.getByRole("button", { name: /Tagged \d+ times/ })).toHaveCount(0);

  await expect(page.getByText("requested on 5/17/2024, 11:48:20 AM")).toBeVisible();
  await expect(page.getByText("requested on 5/17/2024, 11:50:00 AM")).toBeVisible();
});

test("Requested: several tags stay behind the accordion, with the dates inside", async ({
  page,
}) => {
  await gotoWithStore(page, { history: requestedHistory });
  await openRecords(page);

  await historyCard(page, "Fly Like an Eagle").getByRole("button").first().click();
  await expect(page.locator(".MuiTypography-h5")).toHaveText("Fly Like an Eagle");

  const summary = page.getByRole("button", { name: "Tagged 2 times" });
  await expect(summary).toBeVisible();
  await expect(page.getByText("5/17/2024, 11:43:20 AM")).not.toBeVisible();

  await summary.click();
  await expect(page.getByText("5/17/2024, 11:43:20 AM")).toBeVisible();
});
