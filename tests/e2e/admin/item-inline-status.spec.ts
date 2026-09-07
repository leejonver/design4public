import { test, expect } from '@playwright/test'

const AERON = '44444444-0000-0000-0000-000000000001'

test('아이템 목록에서 상태를 바로 바꾼다', async ({ page }) => {
  try {
    await page.goto('/admin/items')
    // Narrow to the seed row so items created by other specs cannot push it off page 1.
    await page.getByPlaceholder('아이템명 또는 설명 검색').fill('아에론')
    // Wait for the debounced refetch to land (4 seed rows → 1) before opening the
    // select; otherwise the row re-renders under the open popup and it never settles.
    await expect(page.locator('tbody tr')).toHaveCount(1)
    const row = page.getByRole('row', { name: /아에론 체어/ })
    // combobox 0 = 브랜드, 1 = 상태
    await row.getByRole('combobox').nth(1).click()
    await page.getByRole('option', { name: '단종' }).click()
    await expect(row.getByRole('combobox').nth(1)).toHaveText('단종')
    await expect
      .poll(async () => (await (await page.request.get(`/api/admin/items/${AERON}`)).json()).data.status)
      .toBe('discontinued')
  } finally {
    await page.request.put(`/api/admin/items/${AERON}`, { data: { status: 'available' } })
  }
})
