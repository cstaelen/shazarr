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
    page.getByRole("button", { name: "Configuration" }),
  ).toBeVisible();
  await expect(page).toHaveScreenshot();

  // Run song recognition
  await page.getByTestId("record-button").click();
  await expect(page.getByText("recording...")).toBeVisible();
  await page.waitForTimeout(5000);

  // Expect inline result card (not a drawer)
  await expect(page.getByText("Found !")).toBeVisible();
  await expect(page.getByTestId("inline-result-card")).toBeVisible();
  const loader = await page.locator("img.loading")?.isVisible();
  if (loader) {
    await expect(page.locator("img.loading")).not.toBeVisible({
      timeout: 10000,
    });
  }
  await page.waitForTimeout(1000);

  await expect(page.getByTestId("inline-result-card")).toContainText("Chillin'");
  await expect(page.getByTestId("inline-result-card")).toContainText("Modjo");
  await expect(page).toHaveScreenshot();

  // Dismiss inline card (close button, NOT delete from history)
  await page.getByTestId("inline-result-card").getByRole("button", { name: "Dismiss result" }).click();
  await expect(page.getByTestId("inline-result-card")).not.toBeVisible();

  // Expect to be on main screen with Records button visible
  await expect(page.getByText("Ready")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Records" }),
  ).toBeVisible();

  // Open history drawer
  await page.getByRole("button", { name: "Records" }).click();
  await expect(page.getByTestId("history-item")).toBeVisible();
  await expect(page.getByTestId("history-item")).toContainText(
    "Chillin' - Modjo",
  );

  // Click history item to open Result drawer
  await page.getByTestId("history-item").getByRole("button").first().click();
  await expect(page.getByText("Chillin'")).toHaveCount(2);
  await expect(page.getByText("Modjo", { exact: true })).toBeVisible();
  await expect(page).toHaveScreenshot();

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page).toHaveScreenshot();

  // Close Result drawer
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByText("Ready")).toBeVisible();
});
