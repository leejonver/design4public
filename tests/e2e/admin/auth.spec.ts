import { test, expect } from '@playwright/test'

test.describe('인증 가드', () => {
  test('미인증 사용자는 /admin/projects 접근 시 로그인으로 리다이렉트', async ({ page }) => {
    await test.step('clear state', async () => {
      await page.context().clearCookies()
    })
    await page.goto('/admin/projects')
    await expect(page).toHaveURL(/\/admin\/login/)
  })
})
