import { test as setup, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import path from 'node:path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// SAFETY NET (spec §9/§12): the E2E harness must never touch a remote DB.
// Hard-fail at import time if the Supabase URL is not loopback.
const host = new URL(SUPABASE_URL).hostname
if (host !== '127.0.0.1' && host !== 'localhost') {
  throw new Error(
    `E2E refuses to run against non-local Supabase host "${host}". ` +
      `Expected 127.0.0.1/localhost. Check .env.test.`,
  )
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function provision(email: string, password: string, role: 'master' | 'content_manager') {
  // Create the auth user (email pre-confirmed). Idempotent: on "already
  // registered" we look the user up and reset the known password.
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  let userId = created.data.user?.id
  if (!userId) {
    const { data } = await admin.auth.admin.listUsers({ perPage: 200 })
    const found = data.users.find((u) => u.email === email)
    if (!found) throw new Error(`could not create or find user ${email}`)
    userId = found.id
    await admin.auth.admin.updateUserById(userId, { password, email_confirm: true })
  }
  // The on_auth_user_created trigger inserted a pending content_manager profile;
  // upsert it to the role/approval this test user needs.
  const { error } = await admin
    .from('profiles')
    .upsert({ id: userId, email, name: `E2E ${role}`, role, status: 'approved' })
  if (error) throw error
  return userId
}

setup('provision users and save auth state', async ({ browser }) => {
  await provision(process.env.E2E_MASTER_EMAIL!, process.env.E2E_MASTER_PASSWORD!, 'master')
  await provision(process.env.E2E_CM_EMAIL!, process.env.E2E_CM_PASSWORD!, 'content_manager')

  // Log in through the real UI (client-side @supabase/ssr sets the session
  // cookies) and persist storageState for each role.
  for (const [email, password, file] of [
    [process.env.E2E_MASTER_EMAIL!, process.env.E2E_MASTER_PASSWORD!, 'tests/e2e/.auth/master.json'],
    [process.env.E2E_CM_EMAIL!, process.env.E2E_CM_PASSWORD!, 'tests/e2e/.auth/manager.json'],
  ] as const) {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto('http://127.0.0.1:3000/admin/login')
    await page.getByPlaceholder('이메일 주소').fill(email)
    await page.getByPlaceholder('비밀번호').fill(password)
    await page.getByRole('button', { name: /로그인/ }).click()
    await page.waitForURL(/\/admin\/projects/, { timeout: 15000 })
    await context.storageState({ path: path.resolve(__dirname, '..', '..', file) })
    await context.close()
  }
})
