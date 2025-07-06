import { defineConfig } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  reporter: 'html',
  use: {
    baseURL,
    storageState: './e2e/auth-storage.json'
  }
});
