import { test, expect } from '@playwright/test'
import path from 'node:path'

// Runs under the 'integration' project (storageState = master.json), so admin
// mutations are authorized. Verifies the write-path reindex hook end to end:
// creating a PUBLISHED project makes it searchable via /api/search. Trigram-only
// (no OPENAI_API_KEY in the E2E server) — embedding is NULL, title indexes fine.
test.describe('검색 인덱스 갱신', () => {
  test('published 프로젝트 생성 → 검색에 즉시 나타난다', async ({ page, request }) => {
    const marker = `검색인덱스${Date.now()}`

    await page.goto('/admin/projects/new')
    await page.getByPlaceholder('프로젝트명을 입력하세요').fill(marker)
    await page.getByPlaceholder('프로젝트에 대한 자세한 설명을 입력하세요').fill('E2E 검색 인덱스 테스트용 설명입니다')
    await page.getByPlaceholder('서울시 강남구').fill('서울시 종로구')
    await page.getByPlaceholder('2024').fill('2025')

    // Vapor Select.Root is a custom listbox: click trigger, then click the option.
    await page.getByTestId('status-trigger').click()
    await page.getByRole('option', { name: '게시' }).click()

    // Upload a real file to local storage (form requires ≥1 photo).
    await page.getByTestId('photo-file-input').setInputFiles(path.resolve(__dirname, '../fixtures/sample.png'))
    await expect(page.getByTestId('uploaded-photo').first()).toBeVisible({ timeout: 15000 })

    await page.getByRole('button', { name: '프로젝트 저장' }).click()
    await page.waitForURL(/\/admin\/projects$/)

    // The POST handler awaited reindexEntity before responding, so the row is
    // already in search_index. Poll /api/search for resilience against the
    // dev-server first-hit compile of the /api/search route.
    await expect
      .poll(
        async () => {
          const res = await request.get(`/api/search?q=${encodeURIComponent(marker)}`)
          const json = await res.json()
          return json.groups.project.some((h: { title: string }) => h.title === marker)
        },
        { timeout: 15000 },
      )
      .toBe(true)
  })
})
