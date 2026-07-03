import { test, expect, type Page } from '@playwright/test'
import path from 'node:path'

// Vapor Select.Root is a custom listbox: click trigger, then click the option.
async function selectStatus(page: Page, label: string) {
  await page.getByTestId('status-trigger').click()
  await page.getByRole('option', { name: label }).click()
}

// Mirrors lib/slug.ts#slugify. The admin project API (mapProject) never
// echoes `slug` back, so for an all-ASCII title the slug is predictable and
// computed here rather than round-tripped through the API.
function slugify(input: string): string {
  return (
    input
      .normalize('NFKC')
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '') || 'untitled'
  )
}

test.describe.configure({ mode: 'serial' })

test.describe('통합: 관리자 변경 → 사이트 즉시 반영 (원버그 회귀)', () => {
  const stamp = Date.now()
  const title = `Reveal Test ${stamp}` // ASCII → predictable server slug
  const slug = slugify(title)
  let projectId: string
  let newTitle: string

  test('게시 프로젝트를 만들면 사이트 목록/상세에 즉시 보인다', async ({ page }) => {
    await page.goto('/admin/projects/new')
    await page.getByPlaceholder('프로젝트명을 입력하세요').fill(title)
    await page.getByPlaceholder('프로젝트에 대한 자세한 설명을 입력하세요').fill('revalidation 검증')
    await page.getByPlaceholder('서울시 강남구').fill('서울시 종로구') // required field
    await selectStatus(page, '게시')
    await page.getByTestId('photo-file-input').setInputFiles(path.resolve(__dirname, '../fixtures/sample.png'))
    await expect(page.getByTestId('uploaded-photo').first()).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: '프로젝트 저장' }).click()
    await page.waitForURL(/\/admin\/projects$/)

    // GET /api/admin/projects responds { success, data: { items, total } };
    // project field is `.name` (mapProject maps title -> name), not `.title`.
    const res = await page.request.get('/api/admin/projects?sort=created_at&dir=desc&limit=50')
    const { data } = await res.json()
    const proj = data.items.find((p: { name: string; id: string }) => p.name === title)
    expect(proj, 'created project present').toBeTruthy()
    projectId = proj.id

    // No manual revalidate/wait: the mutation handler called revalidateEntity.
    await page.goto(`/projects/${slug}`)
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
    await page.goto('/projects')
    await expect(page.locator(`a.d4p-card[href="/projects/${slug}"]`)).toBeVisible()
  })

  test('제목을 수정하면 사이트 상세가 즉시 갱신된다', async ({ page }) => {
    newTitle = `${title} (edited)`
    await page.goto(`/admin/projects/${projectId}/edit`)
    await page.getByPlaceholder('프로젝트명을 입력하세요').fill(newTitle)
    await page.getByRole('button', { name: '변경사항 저장' }).click()
    await page.waitForURL(new RegExp(`/admin/projects/${projectId}`))

    // Editing title alone never changes the slug (uniqueSlug/slugify runs
    // only on create per lib/slug.ts comment: "existing ids/slugs are never
    // changed"), so the detail page stays at the same slug.
    await page.goto(`/projects/${slug}`)
    await expect(page.getByRole('heading', { level: 1, name: newTitle })).toBeVisible()
  })

  test('삭제하면 사이트 목록/상세에서 사라진다', async ({ page }) => {
    await page.goto('/admin/projects')
    const row = page.getByRole('row', { name: new RegExp(newTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })
    await row.getByRole('button', { name: '삭제' }).click()
    await page.getByRole('dialog').getByRole('button', { name: '삭제' }).click()
    await expect(page.getByText('프로젝트가 삭제되었습니다.')).toBeVisible()

    await page.goto('/projects')
    await expect(page.locator(`a.d4p-card[href="/projects/${slug}"]`)).toHaveCount(0)
    const res = await page.goto(`/projects/${slug}`)
    expect(res?.status()).toBe(404)
  })
})

test('통합: home_featured 변경이 홈에 반영된다', async ({ page }) => {
  // EntityPicker is a Dialog: open the "대표 프로젝트" picker (first
  // "프로젝트 선택" trigger on the page — a second one exists under
  // "메인 노출"), pick the option by its accessible name, then confirm.
  await page.goto('/admin/home-settings')
  await page.getByRole('button', { name: '프로젝트 선택' }).first().click()
  await page.getByRole('button', { name: '판교 공공도서관' }).click()
  await page.getByRole('button', { name: '확인' }).click()
  await page.getByRole('button', { name: '저장' }).click()
  await expect(page.getByText('홈 설정이 저장되었습니다.')).toBeVisible()

  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: '판교 공공도서관' })).toBeVisible()

  // Restore featured to gangnam so other runs/suites see the seed default.
  await page.goto('/admin/home-settings')
  await page.getByRole('button', { name: '프로젝트 선택' }).first().click()
  await page.getByRole('button', { name: '강남 오피스 리노베이션' }).click()
  await page.getByRole('button', { name: '확인' }).click()
  await page.getByRole('button', { name: '저장' }).click()
  await expect(page.getByText('홈 설정이 저장되었습니다.')).toBeVisible()
})
