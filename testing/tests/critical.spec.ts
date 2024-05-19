import test, { expect } from "@playwright/test";

test("Critical: Should be able to record, recognize and display result", async ({
  page,
}) => {
  page.goto("/");
  // Home testing
  await expect(page.getByText("Shazarr")).toBeVisible();
  await expect(page.getByText("Offroad")).toBeVisible();
  await expect(page.getByText("Ready")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Services configuration" }),
  ).toBeVisible();
  await expect(page).toHaveScreenshot();

  // Run son recognition
  await page.getByRole("button").first().click();
  await expect(page.getByText("recording...")).toBeVisible();
  await page.waitForTimeout(5000);

  // Expect result
  await expect(page.getByText("Found !")).toBeVisible();
  const loader = await page.locator("img.loading")?.isVisible();
  if (loader) {
    await expect(page.locator("img.loading")).not.toBeVisible({
      timeout: 10000,
    });
  }
  await page.waitForTimeout(1000);

  await expect(page.getByText("Chillin'")).toHaveCount(2);
  await expect(page.getByText("Modjo", { exact: true })).toBeVisible();
  await expect(page).toHaveScreenshot();

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page).toHaveScreenshot();

  // Expect history
  await page.getByRole("button", { name: "Show records (1)" }).click();

  await expect(page.getByTestId("history-item")).toBeVisible();
  await expect(page.getByTestId("history-item")).toContainText(
    "Chillin' - Modjo",
  );
  await expect(page.getByTestId("history-item").locator("button")).toHaveCount(
    4,
  );

  // Expect closing history
  await page.getByRole("button", { name: "Close records" }).click();
  await expect(page.getByTestId("history-item")).not.toBeVisible();

  // Expect closing track result
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByTestId("Close")).not.toBeVisible();

  // Expect to be on main screen
  await expect(page.getByText("Ready")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Show records (1)" }),
  ).toBeVisible();
});
