import { test, expect, openApp } from './fixtures'

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'iphone', 'mobile masthead is the ≤820px layout')
})

test('mobile masthead renders the hero and contact menu', async ({ page }) => {
  await openApp(page)
  await expect(page.locator('.hero')).toBeVisible()
  await expect(page.locator('.topbar')).toBeVisible()
  // mobile (i) contact popover
  const menuBtn = page.locator('.tb-menu-wrap .iconbtn').first()
  await expect(menuBtn).toBeVisible()
  await menuBtn.click()
  await expect(page.locator('.tb-menu')).toBeVisible()
})
