import { test, expect } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

test.describe('브랜드 CRUD', () => {
  const nameKo = `E2E 브랜드 ${Date.now()}`

  test('브랜드를 생성한다', async ({ page }) => {
    await page.goto('/admin/brands/new')
    await page.getByPlaceholder('예: 허먼밀러').fill(nameKo)
    await page.getByPlaceholder('예: Herman Miller').fill('E2E Brand')
    await page.getByPlaceholder('브랜드에 대한 자세한 설명을 입력하세요').fill('E2E 브랜드 설명')
    await page.getByRole('button', { name: '브랜드 저장' }).click()
    await page.waitForURL(/\/admin\/brands$/)
    await expect(page.getByText(nameKo)).toBeVisible()
  })
})
