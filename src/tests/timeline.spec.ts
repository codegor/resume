import { test, expect, openApp } from './fixtures'

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'spine measured on the desktop layout')
})

test('serpentine spine renders and survives a resize', async ({ page }) => {
  await openApp(page)
  const path = page.locator('.tl-spine path').first()
  await expect(path).toHaveAttribute('d', /^M/)
  await page.setViewportSize({ width: 1000, height: 900 })
  await page.waitForTimeout(700)
  await expect(page.locator('.tl-spine path').first()).toHaveAttribute('d', /^M/)
})
