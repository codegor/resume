import { test, expect, openApp, CONTACT_PATTERNS } from './fixtures'

// The desktop top-bar contact row holds the four contact links; the globe button is the
// live-résumé (production) link. (Mobile folds them into the (i) menu — tested elsewhere.)
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop top-bar contact row')
})

test('contact links (Telegram / LinkedIn / GitHub / Email) point at valid targets', async ({
  page,
}) => {
  await openApp(page)
  const hrefs = await page
    .locator('.contact-row a.cbtn')
    .evaluateAll((els) => els.map((e) => e.getAttribute('href') || ''))
  expect(hrefs.length, 'four contact links').toBe(4)
  for (const [name, re] of Object.entries(CONTACT_PATTERNS)) {
    expect(
      hrefs.some((h) => re.test(h)),
      `a contact link matches ${name} (${re}) — got ${hrefs.join(', ')}`,
    ).toBe(true)
  }
  // the three web links open in a new tab
  const blanks = await page.locator('.contact-row a.cbtn[target="_blank"]').count()
  expect(blanks, 'web contacts open in a new tab').toBeGreaterThanOrEqual(3)
})

test('the live-résumé (globe) link points at the production URL in a new tab', async ({ page }) => {
  await openApp(page)
  const prod = page.locator('.prodbtn')
  await expect(prod).toHaveAttribute('href', /^https?:\/\/.+/)
  await expect(prod).toHaveAttribute('target', '_blank')
})
