import fs from 'node:fs';
import { defineConfig } from '@playwright/test';

const firefoxExecutable = '/home/karlos/.cache/ms-playwright/firefox-1538/firefox/firefox';
const chromiumExecutable = '/home/karlos/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';
const edgeExecutable = process.env.PW_EDGE_EXECUTABLE;

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
  },
  projects: [
    {
      name: 'chrome',
      use: {
        browserName: 'chromium',
        launchOptions: {
          executablePath: chromiumExecutable,
        },
      },
    },
    {
      name: 'firefox',
      use: {
        browserName: 'firefox',
        launchOptions: {
          executablePath: firefoxExecutable,
        },
      },
    },
    {
      name: 'edge',
      use: {
        browserName: 'chromium',
        launchOptions: {
          executablePath: fs.existsSync(edgeExecutable ?? '') ? edgeExecutable : chromiumExecutable,
        },
      },
    },
  ],
  webServer: {
    command: 'python3 -m http.server 4173',
    cwd: './tmp-e2e-dist',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
