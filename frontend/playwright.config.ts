import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5173',
  },
  projects: [
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: [
    {
      command: 'uv run uvicorn app.main:app --host 0.0.0.0 --port 8000',
      cwd: '../backend',
      port: 8000,
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: 'npm run dev',
      port: 5173,
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
})
