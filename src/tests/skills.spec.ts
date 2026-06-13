import { test, expect, openApp } from './fixtures'

test('clicking a skill highlights it site-wide and clears', async ({ page }) => {
  await openApp(page)
  await page.locator('#skills button.skill').first().click()
  await expect(page.locator('.skill-banner')).toBeVisible()
  await page.locator('.skill-banner .filter-clear').click()
  await expect(page.locator('.skill-banner')).toHaveCount(0)
})

test('skill search shows a found-count badge', async ({ page }) => {
  await openApp(page)
  await page.locator('.fb-search input').fill('postgres')
  await expect(page.locator('.fb-search .ss-count')).toBeVisible()
})

test('a no-match skill search shows the empty-state message', async ({ page }) => {
  await openApp(page)
  await page.locator('.fb-search input').fill('symfom')
  const empty = page.locator('#skills .skills-empty')
  await expect(empty).toBeVisible()
  await expect(empty).toContainText('No skill matches')
  // a real skill clears it
  await page.locator('.fb-search input').fill('postgres')
  await expect(empty).toHaveCount(0)
})
