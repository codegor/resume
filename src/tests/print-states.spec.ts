import { test, expect, openApp, enterPrintMode, assertPrintHealthy } from './fixtures'

// Headlines/Recent toggles + the skill-search box live in the desktop top/filter bars.
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop-only view toggles')
})

test('default view prints healthy (no gaps, every image loaded)', async ({ page }) => {
  await openApp(page)
  await enterPrintMode(page)
  await assertPrintHealthy(page)
})

test('Headlines (compact) changes the résumé and still prints healthy', async ({ page }) => {
  await openApp(page)
  await page.locator('.tb-toggles .essw:visible', { hasText: 'Headlines' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-compact', 'on')
  await enterPrintMode(page)
  await assertPrintHealthy(page)
})

test('Recent·5y narrows the eras and still prints healthy', async ({ page }) => {
  await openApp(page)
  const all = await page.locator('.epoch-group').count()
  await page.locator('.tb-toggles .essw:visible', { hasText: 'Recent' }).click()
  await expect(page.locator('.epoch-group')).not.toHaveCount(all)
  await enterPrintMode(page)
  await assertPrintHealthy(page)
})

test('skill search "symfony" narrows skills and still prints healthy', async ({ page }) => {
  await openApp(page)
  await page.locator('.fb-search input').fill('symfony')
  await expect(page.locator('.fb-search .ss-count')).toBeVisible()
  await expect(
    page
      .locator('#skills .skill')
      .filter({ hasText: /symfony/i })
      .first(),
  ).toBeVisible()
  await enterPrintMode(page)
  await assertPrintHealthy(page)
})

// Some browsers (Windows "Microsoft Print to PDF") don't fire `afterprint`, which would leave the
// app stuck in print state. A matchMedia('print') backstop must exit it when the print media ends.
test('leaving print media resets print state even without afterprint', async ({ page }) => {
  // see the real first-visit defaults (fixtures pin the toggles OFF) → Headlines on, timeline collapsed
  await page.addInitScript(() => {
    localStorage.removeItem('resume-compact')
    localStorage.removeItem('resume-recent')
  })
  await openApp(page)
  await expect(page.locator('#timeline button.timeline-reveal')).toBeVisible()

  // enter print purely via media emulation (NO beforeprint/afterprint) → matchMedia change → print on
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('#timeline a.timeline-reveal.more-online')).toBeVisible()

  // leave print media WITHOUT afterprint → the backstop must restore the interactive view
  await page.emulateMedia({ media: null })
  await expect(page.locator('#timeline button.timeline-reveal')).toBeVisible()
  await expect(page.locator('#timeline a.timeline-reveal.more-online')).toHaveCount(0)
})

// Worst case: a print set printing=true but NEITHER afterprint NOR a matchMedia change fired (some
// Windows print/cancel flows). Regaining window focus must drop the stuck print state.
test('regaining focus drops a stuck print state', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('resume-compact')
    localStorage.removeItem('resume-recent')
  })
  await openApp(page)
  await expect(page.locator('#timeline button.timeline-reveal')).toBeVisible()

  // printing=true via beforeprint only (no media change, no afterprint)
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')))
  await expect(page.locator('#timeline a.timeline-reveal.more-online')).toBeVisible()

  // page comes back to the front → safety net resets (print media isn't active)
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect(page.locator('#timeline button.timeline-reveal')).toBeVisible()
  await expect(page.locator('#timeline a.timeline-reveal.more-online')).toHaveCount(0)
})
