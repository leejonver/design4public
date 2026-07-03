import { test, expect } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

// Derived project→photo→item tagging (spec §7-1): tag a project photo with an
// item via the edit UI and confirm the derived relation round-trips (project GET
// echoes images[].itemIds).
//
// Each test provisions its OWN throwaway project with a UNIQUE photo URL, then
// tears it down. This isolation is deliberate: EntityPicker is a *toggle*, so a
// test that re-tags a shared seed photo is only correct if that photo starts in
// a known state. Sharing one seed row across concurrent runs (e.g. --repeat-each
// with >1 worker) let one run's toggle/save observe another's, flipping the tag
// back off or reading the non-atomic photo re-sync mid-flight. A per-run project
// removes that coupling at the source.
const EAMES_NAME = '이임스 라운지'
const EAMES_ID = '44444444-0000-0000-0000-000000000002'

test.describe('프로젝트 사진 아이템 태깅', () => {
  test('사진에 아이템을 태깅하면 파생 연결이 저장된다', async ({ page }, testInfo) => {
    // Unique per concurrent run so no two runs ever share a project/photo row.
    const nonce = `${Date.now()}-${testInfo.workerIndex}-${testInfo.repeatEachIndex}`
    const photoUrl = `http://127.0.0.1:54321/storage/v1/object/public/images/seed/office-2.jpg?e2e=${nonce}`

    const createRes = await page.request.post('/api/admin/projects', {
      data: {
        name: `E2E 태깅 ${nonce}`,
        description: '아이템 태깅 파생 연결 검증용 프로젝트입니다',
        location: '서울시 강남구',
        completionYear: 2024,
        status: 'draft',
        photos: [{ url: photoUrl, title: '태깅 대상 사진', isMain: true }],
      },
    })
    expect(createRes.ok(), 'project created').toBeTruthy()
    const projectId = (await createRes.json()).data.id as string

    try {
      await page.goto(`/admin/projects/${projectId}/edit`)

      // Wait for the edit form to hydrate with loaded project data before
      // interacting — photo rows render after the client-side fetch resolves.
      await expect(page.getByPlaceholder('프로젝트명을 입력하세요')).toHaveValue(/.+/)
      const photoRow = page.getByTestId('uploaded-photo').first()
      await expect(photoRow).toBeVisible()

      // Open the item picker and ENSURE eames is selected (idempotent: the option
      // is a toggle, so only click when not already pressed). Reading aria-pressed
      // off the committed option state — not a blind click — keeps this correct
      // regardless of the photo's starting tags.
      await photoRow.getByTestId('photo-item-tagging').getByRole('button', { name: '아이템 선택' }).click()
      const eamesOption = page.getByRole('button', { name: EAMES_NAME })
      await expect(eamesOption).toBeVisible()
      if ((await eamesOption.getAttribute('aria-pressed')) !== 'true') {
        await eamesOption.click()
      }
      await expect(eamesOption).toHaveAttribute('aria-pressed', 'true')
      await page.getByRole('button', { name: '확인' }).click()

      // The picker chip reflects the committed itemIds; asserting it visible before
      // saving guarantees handleSubmit reads the tagged state.
      await expect(photoRow.getByTestId('photo-item-tagging').getByText(EAMES_NAME)).toBeVisible()

      await page.getByRole('button', { name: '변경사항 저장' }).click()
      // Anchor to the post-save redirect target (the view page). Without `$` the
      // regex also matches the current /edit URL, so the wait would resolve before
      // the PUT completes and the API read below would race it.
      await page.waitForURL(new RegExp(`/admin/projects/${projectId}$`))

      // Verify via the admin API that the project photo now carries the eames tag.
      // Poll to absorb read-after-write lag; the project is private to this run so
      // the value is stable once written.
      await expect
        .poll(async () => {
          const res = await page.request.get(`/api/admin/projects/${projectId}`)
          const { data } = await res.json()
          return (data.images ?? []).flatMap((img: { itemIds?: string[] }) => img.itemIds ?? [])
        })
        .toContain(EAMES_ID)
    } finally {
      // Best-effort teardown so repeated local runs don't accumulate projects.
      await page.request.delete(`/api/admin/projects/${projectId}`)
    }
  })
})
