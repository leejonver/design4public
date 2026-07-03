import { test, expect } from '@playwright/test'
import path from 'node:path'

test.describe.configure({ mode: 'serial' })

test.describe('아이템 CRUD', () => {
  const name = `E2E 아이템 ${Date.now()}`

  test('아이템을 생성한다 (브랜드/상태 선택 + 이미지)', async ({ page }) => {
    await page.goto('/admin/items/new')
    await page.getByPlaceholder('아이템명을 입력하세요').fill(name)
    await page.getByPlaceholder('아이템에 대한 자세한 설명을 입력하세요').fill('E2E 아이템 설명 텍스트')
    // Brand Select.Root — no value yet, so the trigger shows its placeholder text.
    await page.getByText('브랜드를 선택하세요').click()
    await page.getByRole('option', { name: '허먼밀러' }).click()
    // Status Select.Root — defaults to 'available', so the trigger already shows
    // its label ('구입가능') rather than the '상태 선택' placeholder; exercise the
    // listbox by reselecting the same option.
    await page.getByText('구입가능').click()
    await page.getByRole('option', { name: '구입가능' }).click()
    // image
    await page.getByTestId('photo-file-input').setInputFiles(path.resolve(__dirname, '../fixtures/sample.png'))
    await expect(page.getByTestId('uploaded-photo').first()).toBeVisible({ timeout: 15000 })
    // a free tag (≥1 required)
    await page.getByPlaceholder('태그 입력 후 Enter').fill('모던')
    await page.keyboard.press('Enter')

    await page.getByRole('button', { name: '아이템 저장' }).click()
    await page.waitForURL(/\/admin\/items$/)
    await expect(page.getByText(name)).toBeVisible()
  })
})
