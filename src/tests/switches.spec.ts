import { test, expect, openApp } from './fixtures'

// View switches = the Headlines / Recent · 5y / Expand-all toggles (ViewToggles → `.tb-toggles`).
// >980px: they sit inline in the top bar. ≤980px: they move to their own sticky `.switches-bar`,
// and once the Focus bar scrolls up and covers it, they mirror into the ⓘ menu (store.switchesInMenu).

test.describe('View switches — inline in the top bar (>980px)', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name === 'iphone', 'the inline switches are the >980px layout')
  })

  test('switches sit in the top bar; the mobile switches-bar is absent', async ({ page }) => {
    await openApp(page)
    await expect(page.locator('.topbar-inner > .tb-toggles')).toBeVisible()
    await expect(page.locator('.switches-bar')).toBeHidden()
  })
})

test.describe('View switches — mobile hand-off (≤980px)', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'iphone',
      'the switches-bar + ⓘ mirror are the ≤980px behaviour',
    )
  })

  test('switches live in their own sticky bar and mirror into the ⓘ menu when the Focus bar sticks', async ({
    page,
  }) => {
    await openApp(page)
    // the inline copy is folded away; the sticky switches-bar carries them
    await expect(page.locator('.topbar-inner > .tb-toggles')).toBeHidden()
    await expect(page.locator('.switches-bar')).toBeVisible()

    // scroll so the Focus bar reaches the top and covers the switches-bar → store.switchesInMenu
    await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = 'auto'
      const fb = () => document.getElementById('filterbar') as HTMLElement
      window.scrollTo(0, 99999)
      await new Promise((r) => setTimeout(r, 150))
      const home = window.scrollY + fb().getBoundingClientRect().top
      window.scrollTo(0, Math.round(home - 60 + 40))
      await new Promise((r) => setTimeout(r, 120))
    })

    await page.locator('.tb-menu-wrap .iconbtn').first().click()
    await expect(page.locator('.tb-menu .tb-menu-switches')).toBeVisible()
  })
})
