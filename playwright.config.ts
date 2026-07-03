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

export default defineConfig({
  testDir: './tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  // Against `next dev`, many workers hitting cold (not-yet-compiled) routes at
  // once make the compiler queue requests until they time out — the residual
  // flake source once auth/session issues are fixed. Cap concurrency so
  // first-hit compiles stay fast; the suite still runs comfortably under 2min.
  workers: 2,
  reporter: 'html',
  // The suite runs against `next dev`, which compiles each route on its first
  // hit. Give web-first assertions (e.g. toHaveURL after a nav click) headroom
  // for that cold compile so the gate doesn't flake on the default 5s.
  expect: { timeout: 10000 },
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
    {
      // Direct-REST RLS probes: hit PostgREST with its own anon/service/CM
      // clients (no browser session), so no storageState. Depends on setup for
      // the provisioned CM/master users.
      name: 'security',
      testDir: './tests/e2e/security',
      fullyParallel: false,
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
