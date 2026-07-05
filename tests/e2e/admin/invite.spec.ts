import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const MAILPIT = 'http://127.0.0.1:54324'

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Poll Mailpit (the local stack's mail server) for the newest message to an
// address; return its HTML (or text).
async function latestEmailBody(email: string): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const listRes = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`)
    const list = (await listRes.json()) as { messages: Array<{ ID: string; Created: string }> }
    if (list.messages?.length > 0) {
      const newest = [...list.messages].sort((a, b) => b.Created.localeCompare(a.Created))[0]
      const msgRes = await fetch(`${MAILPIT}/api/v1/message/${newest.ID}`)
      const msg = (await msgRes.json()) as { HTML?: string; Text?: string }
      return msg.HTML || msg.Text || ''
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`no email arrived for ${email}`)
}

function extractLink(html: string): string {
  const m =
    html.match(/href="(https?:\/\/[^"]+)"/i) ||
    html.match(/(https?:\/\/[^\s"<]+)/i)
  if (!m) throw new Error('no link found in invite email')
  return m[1].replace(/&amp;/g, '&')
}

test.describe('관리자 초대 플로우', () => {
  const email = `invitee_${Date.now()}@d4p.test`
  const password = 'Invite123!@#'

  test.afterAll(async () => {
    const { data } = await admin.auth.admin.listUsers({ perPage: 200 })
    const u = data.users.find((x) => x.email === email)
    if (u) await admin.auth.admin.deleteUser(u.id)
  })

  test('master 초대 → 링크에서 비밀번호 설정 → 활성화 → 로그인', async ({ page }) => {
    // 1) master invites through the managers UI (default master storageState).
    await page.goto('/admin/managers')
    await page.getByRole('button', { name: '관리자 초대' }).click()
    await page.getByPlaceholder('초대할 이메일 주소').fill(email)
    await page.getByRole('button', { name: '초대 보내기' }).click()
    await expect(page.getByText('초대 메일을 발송했습니다.')).toBeVisible()

    // 2) pull the invite email + open its link with a fresh (invitee) session.
    const link = extractLink(await latestEmailBody(email))
    await page.context().clearCookies()
    await page.goto(link)

    // 3) accept: set a password → auto-activated → landed in the CMS.
    await page.waitForURL(/\/admin\/invite\/accept/)
    await page.getByPlaceholder('비밀번호 (최소 8자)').fill(password)
    await page.getByPlaceholder('비밀번호 확인').fill(password)
    await page.getByRole('button', { name: '가입 완료' }).click()
    await page.waitForURL(/\/admin\/projects/, { timeout: 30000 })

    // 4) the invitee can now sign in fresh with the password they set.
    await page.context().clearCookies()
    await page.goto('/admin/login')
    await page.getByPlaceholder('이메일 주소').fill(email)
    await page.getByPlaceholder('비밀번호').fill(password)
    await page.getByRole('button', { name: /로그인/ }).click()
    await page.waitForURL(/\/admin\/projects/, { timeout: 30000 })
  })
})
