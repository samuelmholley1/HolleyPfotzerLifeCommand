import { defineConfig } from '@playwright/test';
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  reporter: 'html',
  use: {
    baseURL,
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  webServer: {
    command: 'yarn dev',
    cwd: __dirname,
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 120_000,
    env: { NODE_ENV: 'test' },
  },
});
