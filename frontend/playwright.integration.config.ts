import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-integration',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'https://localhost:8443',
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
  },
});
