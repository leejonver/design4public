import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

test.describe('문의 폼', () => {
  test('제출 시 로컬 inquiries 테이블에 행이 생성된다', async ({ page }) => {
    const unique = `e2e-${Date.now()}@example.com`
    await page.goto('/projects/gangnam-office')
    // Two "문의하기" buttons exist on this page: a hidden one in the sticky
    // header (opacity/pointer-events gated until scroll) and the always-visible
    // one in the project masthead. Scope to the masthead to avoid clicking the
    // hidden one, which would hang on Playwright's actionability check.
    await page.locator('.d4p-pmast').getByRole('button', { name: '문의하기' }).click()
    await expect(page.getByRole('heading', { name: '문의하기' })).toBeVisible()

    await page.getByPlaceholder('홍길동').fill('테스트 문의자')
    await page.getByPlaceholder('name@studio.kr').fill(unique)
    await page.getByPlaceholder('(주)스튜디오').fill('E2E 컴퍼니')
    await page.getByPlaceholder('문의하실 내용을 입력해 주세요.').fill('E2E 자동화 문의 내용입니다.')
    await page.getByRole('button', { name: '문의 보내기' }).click()

    await expect(page.getByRole('heading', { name: '문의가 접수되었습니다' })).toBeVisible()

    // Assert the row landed in the local DB.
    const { data, error } = await admin.from('inquiries').select('name,email,message').eq('email', unique)
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data![0].name).toBe('테스트 문의자')
  })

  test('필수 항목 누락 시 에러 메시지', async ({ page }) => {
    await page.goto('/projects/gangnam-office')
    await page.locator('.d4p-pmast').getByRole('button', { name: '문의하기' }).click()
    await page.getByRole('button', { name: '문의 보내기' }).click()
    await expect(page.getByText('이름, 이메일, 문의 내용은 필수 항목입니다.')).toBeVisible()
  })
})
