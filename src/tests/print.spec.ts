import { test, expect, openApp } from './fixtures'

test('print media reveals the print-only contact block', async ({ page }) => {
  await openApp(page)
  // hidden on screen, shown under @media print
  await expect(page.locator('.print-contacts').first()).toBeHidden()
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.print-contacts').first()).toBeVisible()
})
