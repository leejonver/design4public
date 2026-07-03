import { test, expect } from '@playwright/test'

test('홈 설정 페이지가 로드되고 저장할 수 있다', async ({ page }) => {
  await page.goto('/admin/home-settings')
  await expect(page.getByRole('button', { name: '저장' })).toBeVisible()
  await page.getByRole('button', { name: '저장' }).click()
  await expect(page.getByText('홈 설정이 저장되었습니다.')).toBeVisible()
})
