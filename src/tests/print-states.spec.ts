import { test, expect, openApp, enterPrintMode, assertPrintHealthy } from './fixtures'

// Headlines/Recent toggles + the skill-search box live in the desktop top/filter bars.
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop-only view toggles')
})

test('default view prints healthy (no gaps, every image loaded)', async ({ page }) => {
  await openApp(page)
  await enterPrintMode(page)
  await assertPrintHealthy(page)
})

test('Headlines (compact) changes the résumé and still prints healthy', async ({ page }) => {
  await openApp(page)
  await page.locator('.tb-toggles .essw:visible', { hasText: 'Headlines' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-compact', 'on')
  await enterPrintMode(page)
  await assertPrintHealthy(page)
})

test('Recent·5y narrows the eras and still prints healthy', async ({ page }) => {
  await openApp(page)
  const all = await page.locator('.epoch-group').count()
  await page.locator('.tb-toggles .essw:visible', { hasText: 'Recent' }).click()
  await expect(page.locator('.epoch-group')).not.toHaveCount(all)
  await enterPrintMode(page)
  await assertPrintHealthy(page)
})

test('skill search "symfony" narrows skills and still prints healthy', async ({ page }) => {
  await openApp(page)
  await page.locator('.fb-search input').fill('symfony')
  await expect(page.locator('.fb-search .ss-count')).toBeVisible()
  await expect(
    page
      .locator('#skills .skill')
      .filter({ hasText: /symfony/i })
      .first(),
  ).toBeVisible()
  await enterPrintMode(page)
  await assertPrintHealthy(page)
})
