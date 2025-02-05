import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // Look for test files in the "tests" directory, relative to this configuration file.
  testDir: "./testing/tests",
  snapshotDir: "./testing/snapshots",
  outputDir: "./testing/test-results",

  // Run all tests in parallel.
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env.CI,

  // Retry on CI only.
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI.
  workers: undefined,

  // Reporter to use
  reporter: [
    [
      // process.env.CI ? "html" : "list",
      "html",
      {
        host: "0.0.0.0",
        outputFolder: "./testing/playwright-report",
        open: !process.env.CI,
      },
    ],
  ],

  use: {
    // Base URL to use in actions like `await page.goto('/')`.
    baseURL: "http://127.0.0.1:5173",

    // Collect trace when on failed test.
    trace: "retain-on-failure",
    ignoreHTTPSErrors: true,
    // An object containing additional HTTP headers to be sent with every request.
    bypassCSP: true,
    launchOptions: {
      args: ["--disable-web-security", "--ignore-certificate-errors"],
    },
    permissions: ["microphone"],
    timezoneId: "Europe/Paris",
  },
  // Configure projects for major browsers.
  projects: [
    {
      name: "Android Chrome",
      use: { ...devices["Nexus 6"] },
    },
  ],
  // Run your local dev server before starting the tests.
  webServer: {
    command: "VITE_STAGE=testing npm run start",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
  },
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      threshold: 0.3,
      maxDiffPixelRatio: 0.025,
    },
  },
});
