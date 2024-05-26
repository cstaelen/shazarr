import test, { expect } from "@playwright/test";

test("Offline: Should save record for further recognition", async ({
  page,
}) => {
  await page.context().setOffline(false);
  await page.goto("/");

  await expect(page.getByText("Shazarr")).toBeVisible();

  // Run song recognition and cut internet connection
  await page.getByRole("button").first().click();
  await expect(page.getByText("recording...")).toBeVisible();
  await page.context().setOffline(true);
  await page.waitForTimeout(5000);

  await expect(page.getByText("Offline mode", { exact: true })).toBeVisible();
  await expect(page.getByText("Internet is not reachable. In")).toBeVisible();

  // Open history panel
  await page.getByRole("button", { name: "Show records (1)" }).click();
  await expect(page.getByTestId("history-item")).toHaveCount(1);
  await expect(
    page
      .getByTestId("history-item")
      .locator("div")
      .filter({ hasText: "Offline record - Not" }),
  ).toHaveCount(1);

  // Set online
  await page.context().setOffline(false);
  await page.reload();

  // Search
  await page.getByRole("button", { name: "Show records (1)" }).click();
  await page.getByTestId("history-item").getByRole("button").nth(1).click();
  await expect(page.getByText("searching...")).toBeVisible();
  await page.waitForTimeout(5000);
  await expect(page.getByText("Found !")).toBeVisible();
  await expect(page.getByText("Chillin'")).toHaveCount(2);
  await expect(page.getByText("Modjo", { exact: true })).toBeVisible();
});
