import { test, expect, openApp } from './fixtures'

test('print media reveals the print-only contact block', async ({ page }) => {
  await openApp(page)
  await expect(page.locator('.print-contacts').first()).toBeHidden()
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.print-contacts').first()).toBeVisible()
})

// Regression guard: the mobile sticky `.switches-bar` (added with the top-switches hand-off) once
// leaked into the printout because it was missing from the @media print hide list. On the ≤980px
// mobile shell it's on-screen — it (and the rest of the screen chrome) must vanish on paper.
test('mobile screen chrome (switches bar, top bar, Focus bar) is hidden in print', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'iphone',
    '.switches-bar only renders in the ≤980px mobile shell',
  )
  await openApp(page)
  // all three are on-screen in the mobile shell...
  await expect(page.locator('.switches-bar')).toBeVisible()
  await expect(page.locator('.topbar')).toBeVisible()
  await expect(page.locator('#filterbar')).toBeVisible()
  await page.emulateMedia({ media: 'print' })
  // ...and every one is gone on paper
  await expect(page.locator('.switches-bar')).toBeHidden()
  await expect(page.locator('.topbar')).toBeHidden()
  await expect(page.locator('#filterbar')).toBeHidden()
})
