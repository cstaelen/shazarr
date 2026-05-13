import test, { expect, Page } from "@playwright/test";

import { gotoWithLocalStorage, waitForImgLoaded } from "./utils/helpers";

async function testExternalServiceButtons(
  label: string,
  url: string,
  page: Page,
) {
  await expect(page.locator(".MuiTypography-h5")).toHaveText("Yakuza");

  const ctx = page.context();
  const nonLocalPattern = /^(?!.*127\.0\.0\.1)(?!.*localhost).*$/;
  const capturedUrl = new Promise<string>((resolve) => {
    void ctx.route(nonLocalPattern, (route) => {
      resolve(route.request().url());
      route.abort();
    });
  });

  const pagePromise = ctx.waitForEvent("page");
  await page.getByText(label).click();
  await pagePromise;
  await ctx.unroute(nonLocalPattern);
  await expect(await capturedUrl).toEqual(url);
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
  await page.getByRole("button", { name: "Records" }).click();

  await page.getByTestId("history-item").nth(2).getByRole("button").first().click();

  await waitForImgLoaded(page);
  await page.waitForTimeout(1000);
  await expect(page.getByText("Download with LidarrDownload")).toHaveScreenshot(
    { maxDiffPixelRatio: 0.05 },
  );

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
    "http://tidarr.server.docker/search/Yakuza%20Szymon",
    page,
  );

  // Options should be persistent
  await page.reload();

  await page.getByRole("button", { name: "Configuration" }).click();
  await expect(page.getByRole("dialog")).toHaveScreenshot();
});
