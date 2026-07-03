import { test, expect } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

// Seeded project "강남 오피스 리노베이션" (gangnam-office). We add an item tag
// to its second photo (라운지, currently untagged) and confirm the derived
// relation is persisted (project GET echoes images[].itemIds).
const GANGNAM_ID = '66666666-0000-0000-0000-000000000001'
const EAMES_NAME = '이임스 라운지' // item 44444444-…002

test.describe('프로젝트 사진 아이템 태깅', () => {
  test('사진에 아이템을 태깅하면 파생 연결이 저장된다', async ({ page }) => {
    await page.goto(`/admin/projects/${GANGNAM_ID}/edit`)

    // The photo rows are rendered; open the item picker on the 2nd photo row.
    const secondRow = page.getByTestId('uploaded-photo').nth(1)
    await secondRow.getByTestId('photo-item-tagging').getByRole('button', { name: '아이템 선택' }).click()
    await page.getByRole('button', { name: EAMES_NAME }).click()
    await page.getByRole('button', { name: '확인' }).click()

    await page.getByRole('button', { name: '변경사항 저장' }).click()
    // Anchor to the post-save redirect target (the view page). Without `$` the
    // regex also matches the current /edit URL, so the wait would resolve before
    // the PUT completes and the API read below would race it (see revalidation.spec.ts).
    await page.waitForURL(new RegExp(`/admin/projects/${GANGNAM_ID}$`))

    // Verify via the admin API that a project photo now carries the eames item tag.
    const res = await page.request.get(`/api/admin/projects/${GANGNAM_ID}`)
    const { data } = await res.json()
    const taggedItemIds = (data.images ?? []).flatMap((img: { itemIds?: string[] }) => img.itemIds ?? [])
    expect(taggedItemIds).toContain('44444444-0000-0000-0000-000000000002')

    // Restore the seed state so a rerun without db reset starts clean: the item
    // picker toggles, so re-tagging eames on a second run would instead remove
    // it. Untag the photo and save (the anchored wait guarantees the PUT lands).
    await page.goto(`/admin/projects/${GANGNAM_ID}/edit`)
    await page
      .getByTestId('uploaded-photo')
      .nth(1)
      .getByTestId('photo-item-tagging')
      .getByRole('button', { name: '선택 제거' })
      .click()
    await page.getByRole('button', { name: '변경사항 저장' }).click()
    await page.waitForURL(new RegExp(`/admin/projects/${GANGNAM_ID}$`))
  })
})
