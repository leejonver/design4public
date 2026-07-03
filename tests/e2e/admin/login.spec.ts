/**
 * 로그인 E2E 테스트
 * Vapor UI(Card 폼) + @supabase/ssr 쿠키 인증 기준
 */

import { test, expect } from '@playwright/test'

// Login page is exercised logged-out; drop the admin project's master state.
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('로그인 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login')
  })

  test('로그인 페이지가 렌더링되어야 합니다', async ({ page }) => {
    await expect(page).toHaveTitle(/design4public/i)
    await expect(page.getByRole('heading', { name: /Design4Public/i })).toBeVisible()
    await expect(page.getByPlaceholder('이메일 주소')).toBeVisible()
    await expect(page.getByPlaceholder('비밀번호')).toBeVisible()
    await expect(page.getByRole('button', { name: /로그인/ })).toBeVisible()
  })

  test('빈 폼으로 제출 시 유효성 검사 메시지가 표시되어야 합니다', async ({ page }) => {
    await page.getByRole('button', { name: /로그인/ }).click()

    await expect(page.getByText('이메일을 입력해주세요.')).toBeVisible()
    await expect(page.getByText('비밀번호를 입력해주세요.')).toBeVisible()
  })

  test('유효하지 않은 이메일 형식은 거부되어야 합니다', async ({ page }) => {
    await page.getByPlaceholder('이메일 주소').fill('invalid-email')
    await page.getByPlaceholder('비밀번호').fill('password123')
    await page.getByRole('button', { name: /로그인/ }).click()

    await expect(page.getByText('올바른 이메일 형식을 입력해주세요.')).toBeVisible()
  })

  test('잘못된 자격 증명으로 로그인 시 에러 메시지가 표시되어야 합니다', async ({ page }) => {
    await page.getByPlaceholder('이메일 주소').fill('wrong@example.com')
    await page.getByPlaceholder('비밀번호').fill('wrongpassword')
    await page.getByRole('button', { name: /로그인/ }).click()

    // 로그인 실패 시 Vapor Callout 에 에러 메시지가 노출됩니다.
    await expect(page.getByText(/올바르지 않습니다|로그인에 실패/)).toBeVisible({ timeout: 5000 })
  })
})
