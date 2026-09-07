import path from 'node:path'
import { test, expect } from '@playwright/test'

test('홈 설정 페이지가 로드되고 저장할 수 있다', async ({ page }) => {
  await page.goto('/admin/home-settings')
  await expect(page.getByRole('button', { name: '저장' })).toBeVisible()
  await page.getByRole('button', { name: '저장' }).click()
  await expect(page.getByText('홈 설정이 저장되었습니다.')).toBeVisible()
})

test('히어로 전용 사진을 올리면 홈 히어로가 그 사진 1장으로 바뀐다', async ({ page }) => {
  const before = await (await page.request.get('/api/admin/home-settings')).json()
  try {
    await page.goto('/admin/home-settings')
    await expect(page.getByRole('button', { name: '저장' })).toBeVisible()
    await page.locator('input[type="file"]').setInputFiles(path.resolve(__dirname, '../fixtures/sample.png'))
    await expect(page.getByRole('button', { name: '이미지 삭제' })).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: '저장' }).click()
    await expect(page.getByText('홈 설정이 저장되었습니다.')).toBeVisible()

    await page.goto('/')
    await expect(page.locator('.d4p-hero-slide')).toHaveCount(1)
    await expect(page.locator('.d4p-hero-controls')).toHaveCount(0)
  } finally {
    // restore: drop the hero photo, keep everything else as it was
    await page.request.put('/api/admin/home-settings', {
      data: { ...before.data, featuredImageUrl: null },
    })
  }
})
