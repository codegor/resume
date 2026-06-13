import { test, expect, openApp } from './fixtures'

// Headlines/Recent toggles live in the top-bar toggle group (desktop layout).
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop-only toggles')
})

test('Headlines turns on compact + Recent·5y', async ({ page }) => {
  await openApp(page)
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-compact', 'off')

  const headlines = page.locator('.tb-toggles .essw', { hasText: 'Headlines' })
  await headlines.click()
  await expect(html).toHaveAttribute('data-compact', 'on')
  // toggleCompact also enables Recent·5y
  await expect(page.locator('.tb-toggles .essw.on', { hasText: 'Recent' })).toHaveCount(1)
})

test('Recent·5y narrows the timeline to fewer eras', async ({ page }) => {
  await openApp(page)
  const all = await page.locator('.epoch-group').count()
  await page.locator('.tb-toggles .essw', { hasText: 'Recent' }).click()
  await expect(page.locator('.epoch-group')).not.toHaveCount(all)
})
