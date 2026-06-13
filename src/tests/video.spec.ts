import { test, expect, openApp } from './fixtures'

test('opens and closes the video modal', async ({ page }) => {
  await openApp(page)
  await page.locator('.vnote').first().click()
  await expect(page.locator('.vmodal')).toBeVisible()
  await page.locator('.vmodal-close').click()
  await expect(page.locator('.vmodal')).toHaveCount(0)
})
