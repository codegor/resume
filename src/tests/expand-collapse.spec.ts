import { test, expect, openApp } from './fixtures'

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Expand-all toggle is in the desktop top bar')
})

test('Expand all opens project cards', async ({ page }) => {
  await openApp(page)
  await page.locator('.tb-toggles .essw', { hasText: 'Expand all' }).click()
  await expect(page.locator('.project.open').first()).toBeVisible()
})
