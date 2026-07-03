import { test, expect } from '@playwright/test'

test.describe('포토', () => {
  test('그리드에 사진 타일이 표시된다', async ({ page }) => {
    await page.goto('/photos')
    await expect(page.getByRole('heading', { level: 1, name: 'PHOTOS' })).toBeVisible()
    await expect(page.getByTestId('photo-tile').first()).toBeVisible()
    expect(await page.getByTestId('photo-tile').count()).toBeGreaterThan(0)
  })

  test('타일 클릭 시 라이트박스가 열린다', async ({ page }) => {
    await page.goto('/photos')
    await page.getByTestId('photo-tile').first().click()
    await expect(page.locator('.d4p-photo-modal')).toBeVisible()
    await page.getByRole('button', { name: '닫기' }).click()
    await expect(page.locator('.d4p-photo-modal')).toHaveCount(0)
  })
})
