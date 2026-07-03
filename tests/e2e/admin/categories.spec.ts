import { test, expect } from '@playwright/test'

test('카테고리를 추가한다', async ({ page }) => {
  const name = `E2E카테고리${Date.now()}`
  await page.goto('/admin/categories')
  await page.getByRole('button', { name: '새 카테고리' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByText('프로젝트').first().click().catch(() => {}) // type Select default is fine
  await dialog.getByPlaceholder('카테고리명을 입력하세요').fill(name)
  await dialog.getByRole('button', { name: '추가' }).click()
  // Default list sort is name-asc with a 20-row page; search narrows to this
  // row so a large pre-existing category set can't push it off page 1.
  await page.getByPlaceholder('카테고리명 검색').fill(name)
  await expect(page.getByText(name)).toBeVisible()
})
