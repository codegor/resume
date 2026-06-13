import { test, expect, openApp } from './fixtures'

test('boots, renders all sections, no console errors', async ({ page }) => {
  const app = await openApp(page)

  await expect(page.locator('.topbar')).toBeVisible()
  await expect(page.locator('.hero')).toBeVisible()
  await expect(page.locator('#skills .skill').first()).toBeVisible()
  await expect(page.locator('.epoch-group').first()).toBeVisible()
  await expect(page.locator('#certificates')).toBeVisible()
  await expect(page.locator('.footer')).toBeVisible()

  expect(page.locator('#__boot_err')).toHaveCount(0)
  expect(app.errors, `console errors: ${app.errors.join(' | ')}`).toEqual([])
})

test('applies noindex robots meta from config', async ({ page }) => {
  await openApp(page)
  // config.json seo.noindex = true → robots meta injected
  await expect(page.locator('meta[data-seo][name="robots"]').first()).toHaveCount(1)
})
