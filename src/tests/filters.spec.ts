import { test, expect, openApp } from './fixtures'

test('a role filter activates, narrows projects, and clears', async ({ page }) => {
  await openApp(page)
  const before = await page.locator('.epoch-group .project').count()

  const role = page.locator('.filterbar .chip').nth(1) // first role after "All"
  await role.click()
  await expect(role).toHaveClass(/on/)
  await expect(page.locator('.filterbar .chip.on')).toHaveCount(1)

  // a filter removes non-matching projects from the timeline
  const after = await page.locator('.epoch-group .project').count()
  expect(after).toBeLessThanOrEqual(before)

  await page.locator('.filter-clear').click()
  await expect(role).not.toHaveClass(/on/)
})
