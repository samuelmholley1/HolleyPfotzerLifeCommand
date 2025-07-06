import { defineConfig } from '@playwright/test';
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  reporter: 'html',
  use: {
    baseURL,
    storageState: './e2e/auth-storage.json',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  webServer: {
    env: {
      NEXT_PUBLIC_PW_E2E: '1',
      NEXT_PUBLIC_USE_MOCK_AUTH: 'true',
    },
    cwd: __dirname,
    command: 'yarn dev',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120000,
  },
});
