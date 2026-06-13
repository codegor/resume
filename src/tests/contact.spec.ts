import { test, expect, openApp } from './fixtures'

test('the footer feedback form accepts input', async ({ page }) => {
  await openApp(page)
  const form = page.locator('.feedback').first()
  await form.scrollIntoViewIfNeeded()
  const ta = form.locator('textarea')
  await ta.fill('Great résumé — very clear.')
  await expect(ta).toHaveValue('Great résumé — very clear.')
  await expect(form.locator('button[type="submit"]')).toBeVisible()
})
