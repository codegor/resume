import { test, expect, openApp } from './fixtures'

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'guide button is in the desktop top bar')
})

test('opens the How-to-use guide and closes with Esc', async ({ page }) => {
  await openApp(page)
  await page.locator('.guidebtn').click()
  await expect(page.locator('.guide-modal')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.guide-modal')).toHaveCount(0)
})

test('the guide renders its stories and closes via the close button', async ({ page }) => {
  await openApp(page)
  await page.locator('.guidebtn').click()

  const modal = page.locator('.guide-modal')
  await expect(modal).toBeVisible()
  // content actually renders
  await expect(modal.locator('.guide-title')).toContainText('How to read this résumé')
  expect(await modal.locator('.guide-story').count()).toBeGreaterThan(5)

  // Regression guard: the close button reuses the shared `.vmodal-close` primitive.
  // If that styling is missing (e.g. it gets scoped to another component) the button
  // collapses to an unstyled box in normal flow — no absolute positioning, transparent
  // background. Assert it is the real, styled control.
  const closeBtn = page.locator('.guide-close')
  await expect(closeBtn).toBeVisible()
  const style = await closeBtn.evaluate((el) => {
    const s = getComputedStyle(el)
    return { position: s.position, bg: s.backgroundColor, w: s.width, h: s.height }
  })
  expect(style.position, 'close button must be absolutely positioned').toBe('absolute')
  expect(style.bg, 'close button must have a solid (accent) background').not.toBe(
    'rgba(0, 0, 0, 0)',
  )
  expect(style.w, 'close button must keep its 42px size').toBe('42px')
  expect(style.h).toBe('42px')

  // Functional: clicking the button (not Esc) closes the modal.
  await closeBtn.click()
  await expect(modal).toHaveCount(0)
})
