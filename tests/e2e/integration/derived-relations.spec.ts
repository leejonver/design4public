import { test, expect } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

// Regression for the derived-relation transition: tagging an item on a project
// photo in the CMS must make that project appear on the item's detail page
// immediately (project mutation revalidates the /items/[slug] pattern — M2).
const GANGNAM_ID = '66666666-0000-0000-0000-000000000001'
const EAMES_SLUG = 'eames-lounge' // item 44444444-…002
const EAMES_NAME = '이임스 라운지'

test('사진에 아이템 태깅 → 아이템 상세의 도입 프로젝트에 즉시 반영', async ({ page }) => {
  // eames is directly linked to gangnam but has NO relation to pangyo in the seed
  // (pangyo has zero project_items and no eames photo_items). Tagging eames on a
  // pangyo photo must make pangyo appear on eames' detail immediately.
  const PANGYO_ID = '66666666-0000-0000-0000-000000000002'

  await page.goto(`/items/${EAMES_SLUG}`)
  await expect(page.locator('a.d4p-card[href="/projects/pangyo-library"]')).toHaveCount(0)

  // Tag eames onto a pangyo project photo.
  await page.goto(`/admin/projects/${PANGYO_ID}/edit`)
  const firstRow = page.getByTestId('uploaded-photo').first()
  await firstRow.getByTestId('photo-item-tagging').getByRole('button', { name: '아이템 선택' }).click()
  await page.getByRole('button', { name: EAMES_NAME }).click()
  await page.getByRole('button', { name: '확인' }).click()
  await page.getByRole('button', { name: '변경사항 저장' }).click()
  // Anchor to the post-save redirect target (the view page). Without `$` the
  // regex also matches the current /edit URL, so the wait would resolve before
  // the PUT completes and the goto below would abort it (see revalidation.spec.ts).
  await page.waitForURL(new RegExp(`/admin/projects/${PANGYO_ID}$`))

  // No manual revalidate/wait: the project PUT called revalidateEntity('project'),
  // which purges the /items/[slug] pattern. pangyo now shows on eames' detail.
  await page.goto(`/items/${EAMES_SLUG}`)
  await expect(page.getByRole('heading', { level: 2, name: '도입 프로젝트' })).toBeVisible()
  await expect(page.locator('a.d4p-card[href="/projects/pangyo-library"]')).toBeVisible()

  // Restore the seed state so a rerun without db reset starts clean (the "before"
  // assertion above requires eames to have no pangyo relation). Remove only the
  // eames chip from the photo — its seeded aeron tag, which item-detail.spec relies
  // on, must stay. The anchored wait guarantees the untag PUT lands before teardown.
  await page.goto(`/admin/projects/${PANGYO_ID}/edit`)
  await page
    .getByTestId('uploaded-photo')
    .first()
    .getByTestId('photo-item-tagging')
    .getByText(EAMES_NAME, { exact: true })
    .locator('..')
    .getByRole('button', { name: '선택 제거' })
    .click()
  await page.getByRole('button', { name: '변경사항 저장' }).click()
  await page.waitForURL(new RegExp(`/admin/projects/${PANGYO_ID}$`))
})
