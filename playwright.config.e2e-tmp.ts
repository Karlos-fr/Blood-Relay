import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    launchOptions: {
      executablePath: '/home/karlos/.cache/ms-playwright/firefox-1538/firefox/firefox',
    },
  },
  webServer: {
    command: 'python3 -m http.server 4173',
    url: 'http://127.0.0.1:4173',
    cwd: './tmp-e2e-dist',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
