import { test, expect, openApp } from './fixtures'

test('toggles light/dark and persists across reload', async ({ page }) => {
  await openApp(page)
  const html = page.locator('html')
  const before = await html.getAttribute('data-theme')

  await page.locator('[data-tip="Light / dark theme"]').click()
  await expect(html).not.toHaveAttribute('data-theme', before || 'light')
  const after = await html.getAttribute('data-theme')
  expect(after).not.toBe(before)

  // persistence (localStorage resume-theme) — new context isn't cleared on reload
  await page.reload()
  await page.waitForFunction(
    () => (window as Window & { __appReady?: boolean }).__appReady === true,
  )
  await expect(html).toHaveAttribute('data-theme', after as string)
})
