import { test, expect, openApp } from './fixtures'
import type { Page } from '@playwright/test'

// The page uses scroll-behavior: smooth — disable it for deterministic scrolling, load the lazy
// content (scroll to the very bottom once), then park the Focus bar past its sticky line so it
// collapses to the rail. rect.top <= 60 (TOPBAR_H) is the stick point.
async function stickFocusBar(page: Page): Promise<void> {
  await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto'
    const fb = () => document.getElementById('filterbar') as HTMLElement
    window.scrollTo(0, 99999)
    await new Promise((r) => setTimeout(r, 150))
    const home = window.scrollY + fb().getBoundingClientRect().top
    window.scrollTo(0, Math.round(home - 60 + 40))
    await new Promise((r) => setTimeout(r, 120))
  })
}

async function scrollToTop(page: Page): Promise<void> {
  await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto'
    window.scrollTo(0, 0)
    await new Promise((r) => setTimeout(r, 120))
  })
}

// Wait for the in-flight smooth auto-scroll (the search's first-keystroke jump to Skills) to fully
// converge and stop. Its re-assert loop (utils/dom scrollToEl) keeps emitting smooth scrolls for up
// to ~10s; if a late one fires after the Enter-blur below it collapses the bar early — a CI-only
// flake on slower frames. Polling for a settled scrollY guarantees the loop is done before we
// scroll by hand. (A fixed timeout raced it.)
async function waitScrollSettled(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        let last = NaN
        let stable = 0
        let frames = 0
        const tick = (): void => {
          const y = Math.round(window.scrollY)
          if (y === last) stable += 1
          else {
            stable = 0
            last = y
          }
          if (stable >= 8 || frames++ > 600) resolve()
          else requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }),
  )
}

test.describe('Focus rail — mobile shell (≤980px)', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'iphone', 'the collapsible rail is the ≤980px behaviour')
  })

  test('expanded at the top, collapses to a rail when stuck, re-expands at home', async ({
    page,
  }) => {
    await openApp(page)
    await scrollToTop(page)
    await expect(page.locator('#filterbar .filterbar-inner')).toBeVisible()
    await expect(page.locator('#filterbar .fb-rail')).toHaveCount(0)

    await stickFocusBar(page)
    await expect(page.locator('#filterbar .fb-rail')).toBeVisible()
    await expect(page.locator('#filterbar .filterbar-inner')).toHaveCount(0)
    await expect(page.locator('#filterbar .fb-more')).toBeVisible() // funnel "open all filters"

    await scrollToTop(page)
    await expect(page.locator('#filterbar .filterbar-inner')).toBeVisible()
    await expect(page.locator('#filterbar .fb-rail')).toHaveCount(0)
  })

  test('tapping the funnel opens the Focus bar (and the next scroll re-collapses it)', async ({
    page,
  }) => {
    await openApp(page)
    await stickFocusBar(page)
    await expect(page.locator('#filterbar .fb-rail')).toBeVisible()

    await page.locator('#filterbar .fb-more').click()
    await expect(page.locator('#filterbar .filterbar-inner')).toBeVisible()

    // a further scroll while still stuck snaps it back to the rail
    await page.evaluate(() => window.scrollBy(0, 60))
    await expect(page.locator('#filterbar .fb-rail')).toBeVisible()
  })

  test('rail summarises the active filter + search with a count badge; ✕ clears all', async ({
    page,
  }) => {
    await openApp(page)
    await scrollToTop(page)
    // search first (in the expanded bar), then a role filter — which collapses the bar to its rail
    await page.locator('#filterbar .fb-search input').fill('rabbitmq')
    await waitScrollSettled(page)
    await page.locator('#filterbar .filterbar-inner .chips .chip').nth(1).click()

    await expect(page.locator('#filterbar .fb-rail')).toBeVisible()
    await expect(page.locator('#filterbar .fb-badge')).toHaveText('2') // filter + search
    await expect(page.locator('#filterbar .fb-rail-scroll .chip.on')).toBeVisible()
    await expect(page.locator('#filterbar .sum-pill.search')).toContainText('rabbitmq')

    await page.locator('#filterbar .clear-x').click()
    await expect(page.locator('#filterbar .fb-badge')).toHaveCount(0)
  })

  test('the whole FOCUS label row collapses the bar (not just the chevron)', async ({ page }) => {
    await openApp(page)
    await stickFocusBar(page)
    await page.locator('#filterbar .fb-more').click()
    await expect(page.locator('#filterbar .filterbar-inner')).toBeVisible()
    await page.locator('#filterbar .fb-row').click()
    await expect(page.locator('#filterbar .fb-rail')).toBeVisible()
  })

  test('typing in the search keeps the bar open; it collapses only after blur + scroll', async ({
    page,
  }) => {
    await openApp(page)
    await stickFocusBar(page)
    await page.locator('#filterbar .fb-more').click()
    const input = page.locator('#filterbar .fb-search input')
    await input.click()
    await input.fill('rabbit')
    await waitScrollSettled(page)
    await expect(page.locator('#filterbar .filterbar-inner')).toBeVisible()
    await expect(input).toBeFocused()
    // a finger-scroll WHILE the search is focused must NOT yank the input away
    await page.evaluate(() => window.scrollBy(0, 80))
    await page.waitForTimeout(180)
    await expect(page.locator('#filterbar .filterbar-inner')).toBeVisible()
    await expect(input).toBeFocused()
    // Enter drops focus; the next scroll then collapses
    await input.press('Enter')
    await expect(input).not.toBeFocused()
    await page.evaluate(() => window.scrollBy(0, 40))
    await expect(page.locator('#filterbar .fb-rail')).toBeVisible()
  })

  test('picking a role from the rail jumps to Skills and stays collapsed', async ({ page }) => {
    await openApp(page)
    await stickFocusBar(page)
    await page
      .locator('#filterbar .fb-rail-scroll .chip')
      .filter({ hasText: 'Architect' })
      .first()
      .click()
    await page.waitForFunction(
      () => Math.abs(document.getElementById('skills')!.getBoundingClientRect().top - 110) < 60,
      undefined,
      { timeout: 8000 },
    )
    await expect(page.locator('#filterbar .fb-rail')).toBeVisible()
  })

  test('does not oscillate open/closed when parked exactly at the stick threshold', async ({
    page,
  }) => {
    await openApp(page)
    const flips = await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = 'auto'
      const fb = () => document.getElementById('filterbar') as HTMLElement
      window.scrollTo(0, 99999)
      await new Promise((r) => setTimeout(r, 150))
      window.scrollTo(0, 0)
      await new Promise((r) => setTimeout(r, 150))
      const home = window.scrollY + fb().getBoundingClientRect().top
      window.scrollTo(0, Math.round(home - 60 + 1)) // exactly at the threshold
      let prev: boolean | null = null
      let flips = 0
      for (let i = 0; i < 12; i++) {
        await new Promise((r) => setTimeout(r, 50))
        const rail = !!fb().querySelector('.fb-rail')
        if (prev !== null && rail !== prev) flips++
        prev = rail
      }
      return flips
    })
    expect(flips, 'the rail must settle, not flip open/closed at the threshold').toBe(0)
  })
})

test.describe('Focus bar — desktop & iPad never collapse (>980px)', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name === 'iphone', 'desktop/iPad keep the full Focus chip row')
  })

  test('stays a full chip row even when scrolled to the sticky top', async ({ page }) => {
    await openApp(page)
    await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = 'auto'
      window.scrollTo(0, 2000)
      await new Promise((r) => setTimeout(r, 150))
    })
    await expect(page.locator('#filterbar .filterbar-inner')).toBeVisible()
    await expect(page.locator('#filterbar .fb-rail')).toHaveCount(0)
  })
})
