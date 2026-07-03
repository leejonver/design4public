import { test, expect, type Page } from '@playwright/test'
import path from 'node:path'

// Vapor Select.Root is a custom listbox: click trigger, then click the option.
async function selectStatus(page: Page, label: string) {
  await page.getByTestId('status-trigger').click()
  await page.getByRole('option', { name: label }).click()
}

test.describe.configure({ mode: 'serial' })

test.describe('프로젝트 CRUD', () => {
  const stamp = Date.now()
  const title = `E2E 프로젝트 ${stamp}`

  test('사진 첨부와 함께 프로젝트를 생성한다', async ({ page }) => {
    await page.goto('/admin/projects/new')
    await page.getByPlaceholder('프로젝트명을 입력하세요').fill(title)
    await page.getByPlaceholder('프로젝트에 대한 자세한 설명을 입력하세요').fill('E2E 설명')
    await page.getByPlaceholder('서울시 강남구').fill('서울시 종로구')
    await page.getByPlaceholder('2024').fill('2025')
    await selectStatus(page, '게시')

    // Upload a real file to local storage (form requires ≥1 photo).
    await page.getByTestId('photo-file-input').setInputFiles(path.resolve(__dirname, '../fixtures/sample.png'))
    await expect(page.getByTestId('uploaded-photo').first()).toBeVisible({ timeout: 15000 })

    await page.getByRole('button', { name: '프로젝트 저장' }).click()
    await page.waitForURL(/\/admin\/projects$/)
    await expect(page.getByText(title)).toBeVisible()
  })

  test('프로젝트를 수정한다', async ({ page }) => {
    // Find the project id via the admin API (rows carry no stable selector).
    // GET /api/admin/projects responds { success, data: { items, total } } — not a bare array.
    const res = await page.request.get('/api/admin/projects?sort=created_at&dir=desc&limit=50')
    const { data } = await res.json()
    const proj = data.items.find((p: any) => p.name === title)
    expect(proj, 'created project present').toBeTruthy()

    await page.goto(`/admin/projects/${proj.id}/edit`)
    await page.getByPlaceholder('프로젝트에 대한 자세한 설명을 입력하세요').fill('수정된 설명')
    await page.getByRole('button', { name: '변경사항 저장' }).click()
    await page.waitForURL(new RegExp(`/admin/projects/${proj.id}`))
  })

  test('프로젝트를 삭제한다', async ({ page }) => {
    await page.goto('/admin/projects')
    const row = page.getByRole('row', { name: new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })
    await row.getByRole('button', { name: '삭제' }).click()
    // ConfirmDialog "프로젝트 삭제"
    await page.getByRole('dialog').getByRole('button', { name: '삭제' }).click()
    await expect(page.getByText('프로젝트가 삭제되었습니다.')).toBeVisible()
    await expect(page.getByText(title)).toHaveCount(0)
  })
})
