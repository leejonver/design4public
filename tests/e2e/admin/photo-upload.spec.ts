import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import path from 'node:path'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

test('사진 업로드가 local storage와 photos 테이블에 반영된다', async ({ page }) => {
  const before = (await admin.from('photos').select('id', { count: 'exact', head: true })).count ?? 0
  const title = `E2E Upload ${Date.now()}`
  await page.goto('/admin/projects/new')
  await page.getByPlaceholder('프로젝트명을 입력하세요').fill(title)
  await page.getByPlaceholder('프로젝트에 대한 자세한 설명을 입력하세요').fill('업로드 검증')
  await page.getByPlaceholder('서울시 강남구').fill('서울시 종로구')
  await page.getByTestId('photo-file-input').setInputFiles(path.resolve(__dirname, '../fixtures/sample.png'))
  await expect(page.getByTestId('uploaded-photo').first()).toBeVisible({ timeout: 15000 })
  // Status stays draft (default) — we only need the photo to persist on save.
  await page.getByRole('button', { name: '프로젝트 저장' }).click()
  await page.waitForURL(/\/admin\/projects$/)
  const after = (await admin.from('photos').select('id', { count: 'exact', head: true })).count ?? 0
  expect(after).toBeGreaterThan(before)
})
