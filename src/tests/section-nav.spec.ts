import { test, expect, openApp, enterPrintMode } from './fixtures'
import type { Page } from '@playwright/test'

const scrollPastHero = async (page: Page) => {
  await page.evaluate(() => {
    const hero = document.getElementById('top')
    window.scrollTo(0, hero ? hero.getBoundingClientRect().height + window.scrollY + 200 : 1500)
  })
  await expect(page.locator('.section-nav')).toHaveClass(/is-visible/)
}

test('dock is hidden over the hero and appears after scrolling past it', async ({ page }) => {
  const { errors } = await openApp(page)
  const nav = page.locator('.section-nav')
  await expect(nav).not.toHaveClass(/is-visible/)
  await expect(nav).toHaveCSS('pointer-events', 'none')
  await scrollPastHero(page)
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(nav).not.toHaveClass(/is-visible/)
  expect(errors).toEqual([])
})

test('buttons jump to their sections and back to top', async ({ page }) => {
  await openApp(page)
  await scrollPastHero(page)

  for (const [label, id] of [
    ['Jump to Skills', 'skills'],
    ['Jump to Experience', 'timeline'],
    ['Jump to How I work', 'how-i-work'],
  ] as const) {
    await page.getByRole('button', { name: label }).click()
    // smooth scroll over long distances can take >1s — wait until it lands
    await page.waitForFunction(
      (sid) => Math.abs(document.getElementById(sid)!.getBoundingClientRect().top - 110) < 40,
      id,
      { timeout: 8000 },
    )
    // scrollspy marks the section we just landed in
    await expect(page.getByRole('button', { name: label })).toHaveClass(/is-active/)
  }

  await page.getByRole('button', { name: 'Jump to Top' }).click()
  await page.waitForFunction(() => window.scrollY < 40, undefined, { timeout: 8000 })
})

test('dock keeps the bottom corner free for the footer links', async ({ page }) => {
  await openApp(page)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  const nav = page.locator('.section-nav')
  await expect(nav).toHaveClass(/is-visible/)
  const gap = await page.evaluate(() => {
    const el = document.querySelector('.section-nav')!
    return window.innerHeight - el.getBoundingClientRect().bottom
  })
  // ≥ one button height of clearance so the footer's contact buttons stay clickable
  expect(gap).toBeGreaterThanOrEqual(44)
})

test('dock is hidden in print', async ({ page }) => {
  await openApp(page)
  await enterPrintMode(page)
  await expect(page.locator('.section-nav')).toBeHidden()
})
