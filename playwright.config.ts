import { defineConfig, devices } from '@playwright/test'
import { config as loadEnv } from 'dotenv'
import path from 'node:path'

// Load the local-stack env BEFORE building config so webServer.env can forward
// it to `next dev`. Shell/process env wins over Next's .env.local, so this
// keeps the E2E server on the local Supabase regardless of a stray .env.local.
loadEnv({ path: path.resolve(__dirname, '.env.test') })

const E2E_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
}

const MASTER_STATE = path.resolve(__dirname, 'tests/e2e/.auth/master.json')
const MANAGER_STATE = path.resolve(__dirname, 'tests/e2e/.auth/manager.json')

export default defineConfig({
  testDir: './tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /global\.setup\.ts/ },
    {
      name: 'site',
      testDir: './tests/e2e/site',
      fullyParallel: true,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'admin',
      testDir: './tests/e2e/admin',
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'], storageState: MASTER_STATE },
      dependencies: ['setup'],
    },
    {
      name: 'integration',
      testDir: './tests/e2e/integration',
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'], storageState: MASTER_STATE },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: E2E_ENV,
  },
})
