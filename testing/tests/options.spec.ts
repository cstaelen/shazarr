import test, { expect, Page } from "@playwright/test";

import { gotoWithLocalStorage, waitForImgLoaded } from "./utils/helpers";

let serviceUrlExpected: string;

async function testExternalServiceButtons(
  label: string,
  url: string,
  page: Page,
) {
  // Run service button test
  await expect(page.locator(".MuiTypography-h5")).toHaveText("Yakuza");

  await page.getByText(label).click();
  await page.waitForTimeout(200);
  const pages = await page.context().pages();
  await expect(serviceUrlExpected).toEqual(url);

  await pages[1].close();
}

test("Options: Should see options panel and use service buttons", async ({
  page,
}) => {
  await gotoWithLocalStorage("/", page);

  // Open config panel
  await page.getByRole("button", { name: "Configuration" }).click();

  // Fill fields and save
  await page
    .getByPlaceholder("Lidarr URL (http://...)")
    .fill("http://lidarr.server.docker");
  await page
    .getByPlaceholder("Tidarr URL (http://...)")
    .fill("http://tidarr.server.docker");
  await page
    .getByPlaceholder("Custom service (http://...?")
    .fill("http://custom.server.docker?query=");
  await page.getByPlaceholder("Custom service name").fill("My Awesome Service");

  await page.getByRole("button", { name: "Save configuration" }).click();

  await expect(
    page.getByPlaceholder("Lidarr URL (http://...)"),
  ).not.toBeVisible();

  // Go to result page
  await page.getByRole("button", { name: "Show records (3)" }).click();

  await page
    .locator("div:nth-child(3) > .MuiCardActions-root > button")
    .first()
    .click();

  await waitForImgLoaded(page);
  await page.waitForTimeout(1000);
  await expect(page.getByText("Download with LidarrDownload")).toHaveScreenshot(
    { maxDiffPixelRatio: 0.05 },
  );

  // init new frame index to listen future events
  await page.evaluate(() => {
    window.open("http://init.test");
  });
  await page.waitForTimeout(200);
  const pages = await page.context().pages();
  pages[1].context().on("request", (error) => {
    serviceUrlExpected = error.url();
  });

  await pages[1].close();

  // Test button availability on result screen
  await testExternalServiceButtons(
    "My Awesome Service",
    "http://custom.server.docker/?query=Yakuza%20Szymon",
    page,
  );
  await testExternalServiceButtons(
    "Download with Lidarr",
    "http://lidarr.server.docker/add/search?term=Blue%20Coloured%20Mountain%20Szymon",
    page,
  );
  await testExternalServiceButtons(
    "Download with Tidarr",
    "http://tidarr.server.docker/?query=Yakuza%20Szymon",
    page,
  );

  // Options should be persistent
  await page.reload();

  await page.getByRole("button", { name: "Configuration" }).click();
  await expect(
    page
      .getByRole("dialog")
      .locator("div")
      .filter({ hasText: "Github page - v0.0.0Save" }),
  ).toHaveScreenshot();
});
