import { test, expect, openApp } from './fixtures'

// Headlines/Recent toggles live in the top-bar toggle group (desktop layout).
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop-only toggles')
})

test('Headlines turns on compact + Recent·5y', async ({ page }) => {
  await openApp(page)
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-compact', 'off')

  const headlines = page.locator('.tb-toggles .essw:visible', { hasText: 'Headlines' })
  await headlines.click()
  await expect(html).toHaveAttribute('data-compact', 'on')
  // toggleCompact also enables Recent·5y
  await expect(page.locator('.tb-toggles .essw.on:visible', { hasText: 'Recent' })).toHaveCount(1)
})

test('Recent·5y narrows the timeline to fewer eras', async ({ page }) => {
  await openApp(page)
  const all = await page.locator('.epoch-group').count()
  await page.locator('.tb-toggles .essw:visible', { hasText: 'Recent' }).click()
  await expect(page.locator('.epoch-group')).not.toHaveCount(all)
})

// The fixtures pin the toggles OFF; clear that override to see the real first-visit defaults.
test('first visit defaults to Headlines + Recent, timeline shows a teaser + reveal button', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.removeItem('resume-compact')
    localStorage.removeItem('resume-recent')
  })
  await openApp(page)
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-compact', 'on')
  await expect(page.locator('.tb-toggles .essw.on:visible', { hasText: 'Recent' })).toHaveCount(1)

  // Headlines shows a faded TEASER (a real glimpse of the timeline) + the reveal button
  await expect(page.locator('#timeline .timeline-reveal')).toBeVisible()
  await expect(page.locator('#timeline .timeline-teaser-clip')).toBeVisible()

  // clicking it drops Headlines but KEEPS Recent·5y → the teaser is replaced by the full timeline
  await page.locator('#timeline .timeline-reveal').click()
  await expect(html).toHaveAttribute('data-compact', 'off')
  await expect(page.locator('.tb-toggles .essw.on:visible', { hasText: 'Recent' })).toHaveCount(1)
  // state transition (not a data-coupled count): teaser gone, real timeline + its epochs visible
  await expect(page.locator('#timeline .timeline-teaser-clip')).toBeHidden()
  await expect(page.locator('.epoch-group').first()).toBeVisible()
  // Recent still hides older eras, so the "+N earlier eras" pill is offered
  await expect(page.locator('.epoch-more-row')).toBeVisible()
})

// Engaging a focus filter / skill / search while in Headlines should drop Headlines (so the
// results are visible) but keep Recent·5y.
test('clicking a focus filter in Headlines drops Headlines, keeps Recent·5y', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('resume-compact')
    localStorage.removeItem('resume-recent')
  })
  await openApp(page)
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-compact', 'on')

  await page.locator('button.chip', { hasText: 'Backend' }).first().click()
  await expect(html).toHaveAttribute('data-compact', 'off')
  await expect(page.locator('.tb-toggles .essw.on:visible', { hasText: 'Recent' })).toHaveCount(1)
})
