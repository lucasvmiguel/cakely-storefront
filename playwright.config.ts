import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against a production build, with the Hostinger API
// replaced by fakes (see e2e/), so they never touch the real store.
const PORT = 4173;
const CATALOG_PORT = 4174;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    timezoneId: "Europe/Amsterdam",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // The main purchase tests again on a phone, where the layout differs.
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@purchase/ },
  ],
  webServer: [
    {
      command: "node e2e/fake-catalog-server.js",
      url: `http://127.0.0.1:${CATALOG_PORT}/health`,
      env: { PORT: String(CATALOG_PORT) },
    },
    {
      command: "npm run build && node server.js",
      url: `http://127.0.0.1:${PORT}/robots.txt`,
      timeout: 180_000,
      env: {
        NODE_ENV: "production",
        PORT: String(PORT),
        HOSTINGER_API_URL: `http://127.0.0.1:${CATALOG_PORT}/v2`,
        // A made-up id: events go into window.dataLayer, and the GA script
        // itself is blocked by the tests.
        GA_MEASUREMENT_ID: "G-TEST",
        META_PIXEL_ID: "",
        SITE_URL: `http://127.0.0.1:${PORT}`,
      },
    },
  ],
});
