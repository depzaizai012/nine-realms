import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/production",
  timeout: 30000,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4178",
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    headless: true,
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROME_PATH || undefined,
    },
  },
  webServer: {
    command: "node scripts/production-server.js",
    url: "http://127.0.0.1:4178",
    reuseExistingServer: !process.env.CI,
  },
});
