import { test as base, expect, type Page } from '@playwright/test'

// Headlines + Recent·5y now default ON for a fresh visitor (collapses the timeline & compacts
// skills). The suite's feature tests assume the FULL view, so pin both OFF before the app boots
// (an init script runs before the app reads localStorage, on http AND file:// pages). The
// default-on behaviour itself is covered explicitly in compact-recent.spec.ts.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('resume-compact', 'off')
        localStorage.setItem('resume-recent', 'off')
      } catch {
        /* localStorage unavailable — ignore */
      }
    })
    await use(page)
  },
})
export { expect }

/** Navigate to the app (clearing persisted view-state), wait until it's mounted,
 *  and return a handle whose `errors` array collects console + page errors. */
export async function openApp(page: Page, path = '/'): Promise<{ errors: string[] }> {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(String(e)))
  // Each test runs in a fresh, isolated context (empty localStorage), so no clear needed.
  await page.goto(path)
  await page.waitForFunction(
    () => (window as Window & { __appReady?: boolean }).__appReady === true,
    {
      timeout: 20000,
    },
  )
  return { errors }
}

/**
 * Put the app into the exact state the "Print / Save as PDF" button produces:
 * `printing=true` (expands all collapsed content) + every lazy image forced to load
 * + `@media print` emulated. Mirrors store.print()'s loadAllImages() step so the
 * print/PDF assertions see the same layout a real print would.
 */
export async function enterPrintMode(page: Page): Promise<void> {
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')))
  await page.evaluate(async () => {
    const imgs = Array.from(document.images).filter((im) => !im.complete)
    imgs.forEach((im) => {
      try {
        im.loading = 'eager'
      } catch {
        /* read-only on old engines */
      }
    })
    await Promise.race([
      Promise.all(imgs.map((im) => im.decode().catch(() => undefined))),
      new Promise((r) => setTimeout(r, 5000)),
    ])
  })
  await page.emulateMedia({ media: 'print' })
  await page.waitForTimeout(250)
}

/**
 * Assert the print/PDF layout is healthy (no big blank gaps, nothing missing):
 *  • no forced page-break before the long sections (they flow continuously),
 *  • the epoch header chain isn't `break-after: avoid` (that dragged content to the
 *    next page and left a gap),
 *  • every visible image has actually loaded (no blank cert / photo boxes),
 *  • the print-only contact block is shown.
 * Call after enterPrintMode().
 */
export async function assertPrintHealthy(page: Page): Promise<void> {
  const r = await page.evaluate(() => {
    const bb = (id: string) => {
      const el = document.getElementById(id)
      return el ? getComputedStyle(el).breakBefore : 'auto'
    }
    const epTitle = document.querySelector('.epoch-title')
    const blank = Array.from(document.images)
      .filter((im) => getComputedStyle(im).display !== 'none' && im.naturalWidth === 0)
      .map((im) => (im.currentSrc || im.src || '').slice(-60))
    return {
      breakBefore: ['skills', 'timeline', 'certificates'].map(bb),
      epochTitleBreakAfter: epTitle ? getComputedStyle(epTitle).breakAfter : 'auto',
      blank,
    }
  })
  expect(r.breakBefore, 'sections must flow (no forced page-break)').toEqual([
    'auto',
    'auto',
    'auto',
  ])
  expect(r.epochTitleBreakAfter, 'epoch header must not be pinned (causes gaps)').not.toBe('avoid')
  expect(r.blank, `blank/unloaded images in print: ${r.blank.join(', ')}`).toEqual([])
  await expect(page.locator('.print-contacts').first()).toBeVisible()
}

/** Expected targets for the contact links — patterns, so config tweaks don't break the test. */
export const CONTACT_PATTERNS: Record<string, RegExp> = {
  telegram: /^https:\/\/t\.me\//,
  linkedin: /linkedin\.com\//,
  github: /github\.com\//,
  email: /^mailto:[^@]+@/,
}
