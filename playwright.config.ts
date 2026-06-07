import { defineConfig, devices } from '@playwright/test'
import { readFileSync } from 'node:fs'

// Load .env.local into the test-runner process (E2E_MASTER_* etc.).
// Next loads it for the app via webServer, but the Playwright runner needs it too.
try {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '')
    }
  }
} catch {
  // .env.local absent — env-dependent specs will skip.
}

export default defineConfig({
  testDir: './__tests__/e2e',
  // Serial: the authenticated specs share one master account + one backing DB,
  // so parallel workers would race on the Supabase session. One worker is correct here.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
