import { test, expect } from '@playwright/test'

test.describe('포토', () => {
  test('그리드에 사진 타일이 표시된다', async ({ page }) => {
    await page.goto('/photos')
    await expect(page.getByRole('heading', { level: 1, name: 'PHOTOS' })).toBeVisible()
    await expect(page.getByTestId('photo-tile').first()).toBeVisible()
    expect(await page.getByTestId('photo-tile').count()).toBeGreaterThanOrEqual(6)
    await expect(
      page.locator('a[href="/photos/55555555-0000-0000-0000-000000000006"]')
    ).toBeVisible()
  })

  test('타일 클릭 시 라이트박스가 열린다', async ({ page }) => {
    await page.goto('/photos')
    await page.getByTestId('photo-tile').first().click()
    await expect(page.locator('.d4p-photo-modal')).toBeVisible()
    await page.getByRole('button', { name: '닫기' }).click()
    await expect(page.locator('.d4p-photo-modal')).toHaveCount(0)
  })

  test('아이템 전용 사진도 상세와 연결 아이템을 표시한다', async ({ page }) => {
    const response = await page.goto('/photos/55555555-0000-0000-0000-000000000006')

    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1, name: '이임스 라운지' })).toBeVisible()
    await expect(page.locator('a.d4p-card[href="/items/eames-lounge"]')).toBeVisible()
  })
})
