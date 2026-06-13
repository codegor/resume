import { readFileSync, statSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { test, expect, enterPrintMode, assertPrintHealthy, CONTACT_PATTERNS } from './fixtures'
import { offlineFileName } from '../ui/utils/offline-name'
import type { Page } from '@playwright/test'

// Same algorithm the build (scripts/finalize-single.mjs) uses to name the offline file —
// a STABLE name (no "(1)" copies): egor_berezovsky_resume_offline_06.2026.html
const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url)))) // src/tests → <repo>
// name + updated live in the authored source base.json (the full resume.json is in dist/ only).
const res = JSON.parse(readFileSync(resolve(repoRoot, 'public/assets/resume/base.json'), 'utf8'))
const offlineFile = offlineFileName(res.name, res.updated)

// One fixed path on disk → saveAs() overwrites it, so only ONE copy ever exists.
const savedOffline = resolve(repoRoot, 'test-results', 'offline-latest.html')

// All of these drive the top-bar / contact-row / filter-bar, which only exist in the
// desktop layout (mobile folds them into the (i) menu) — so this is a desktop-only spec.
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'offline build verified on the desktop layout')
})

// Tests run fullyParallel, so a file:// test can start before the download test. Produce
// the saved offline file ONCE up front (download → saveAs to a fixed path, overwriting) so
// every test has it regardless of order; the download test below still asserts the flow.
test.beforeAll(async ({ browser }, testInfo) => {
  if (testInfo.project.name !== 'desktop') return
  const page = await browser.newPage()
  try {
    await page.goto('/')
    await waitReady(page)
    await page.locator('.dl-wrap > button.iconbtn').click()
    const [dl] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('.dl-menu a.dl-item[download]').click(),
    ])
    await dl.saveAs(savedOffline)
  } finally {
    await page.close()
  }
})

/** Wait until the app has mounted (it sets window.__appReady after boot). */
async function waitReady(page: Page): Promise<void> {
  await page.waitForFunction(
    () => (window as Window & { __appReady?: boolean }).__appReady === true,
    { timeout: 20000 },
  )
}

/** Open the saved offline file via file:// (the file the user actually downloads). */
async function openOffline(page: Page): Promise<void> {
  await page.goto(pathToFileURL(savedOffline).href)
  await waitReady(page)
}

test('"Download offline version" downloads a stable-named self-contained file', async ({
  page,
}) => {
  await page.goto('/')
  await waitReady(page)

  // Open the download menu, then click the offline-download anchor (the only [download]).
  await page.locator('.dl-wrap > button.iconbtn').click()
  const dlItem = page.locator('.dl-menu a.dl-item[download]')
  await expect(dlItem).toBeVisible()
  await expect(dlItem).toHaveAttribute('download', offlineFile)

  const [dl] = await Promise.all([page.waitForEvent('download'), dlItem.click()])

  // STABLE name — same every time, no browser "(1)"-style copies.
  expect(dl.suggestedFilename()).toBe(offlineFile)

  // Save to a FIXED path (overwrites → one copy on disk) and check it's a real, fat file.
  await dl.saveAs(savedOffline)
  expect(existsSync(savedOffline), `saved offline file at ${savedOffline}`).toBe(true)
  expect(statSync(savedOffline).size, 'self-contained file is non-trivial').toBeGreaterThan(500_000)
})

test('the downloaded offline file boots and renders every section (file://)', async ({ page }) => {
  expect(existsSync(savedOffline), 'the offline file was downloaded in beforeAll').toBe(true)

  // Only fail on real JS/page errors — streamed-media network errors are expected offline.
  const fatal: string[] = []
  page.on('pageerror', (e) => fatal.push(String(e)))

  await openOffline(page)

  await expect(page.locator('.hero')).toBeVisible()
  await expect(page.locator('#skills .skill').first()).toBeVisible()
  await expect(page.locator('.epoch-group').first()).toBeVisible()
  await expect(page.locator('#certificates')).toBeVisible()
  await expect(page.locator('.footer')).toBeVisible()

  expect(page.locator('#__boot_err')).toHaveCount(0)
  expect(fatal, `page errors: ${fatal.join(' | ')}`).toEqual([])
})

test('the offline file: theme + Headlines toggles work', async ({ page }) => {
  await openOffline(page)
  const html = page.locator('html')

  const before = await html.getAttribute('data-theme')
  await page.locator('.iconbtn[data-tip="Light / dark theme"]').click()
  await expect(html).not.toHaveAttribute('data-theme', before || 'light')

  await expect(html).toHaveAttribute('data-compact', 'off')
  await page.locator('.tb-toggles .essw', { hasText: 'Headlines' }).click()
  await expect(html).toHaveAttribute('data-compact', 'on')
})

test('the offline file: skill search finds matches', async ({ page }) => {
  await openOffline(page)
  await page.locator('.fb-search input').fill('symfony')
  await expect(page.locator('.fb-search .ss-count')).toBeVisible()
  await expect(
    page
      .locator('#skills .skill')
      .filter({ hasText: /symfony/i })
      .first(),
  ).toBeVisible()
})

test('the offline file: video modal opens and closes', async ({ page }) => {
  await openOffline(page)
  await page.locator('.vnote').first().click()
  await expect(page.locator('.vmodal-back')).toBeVisible()
  await page.locator('.vmodal-close').click()
  await expect(page.locator('.vmodal-back')).toHaveCount(0)
})

test('the offline file: the How-to-use guide opens and closes with Esc', async ({ page }) => {
  await openOffline(page)
  await page.locator('.guidebtn').click()
  await expect(page.locator('.guide-modal')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.guide-modal')).toHaveCount(0)
})

test('the offline file: certificates render (image from inlined AVIF)', async ({ page }) => {
  await openOffline(page)
  await expect(page.locator('#certificates .cert').first()).toBeVisible()
})

test('the offline file: contact + live-résumé links, and no offline-download item', async ({
  page,
}) => {
  await openOffline(page)

  // Contact links exist with valid targets (telegram/linkedin/github/email).
  const hrefs = await page
    .locator('.contact-row a.cbtn')
    .evaluateAll((els) => els.map((e) => e.getAttribute('href') || ''))
  for (const [name, re] of Object.entries(CONTACT_PATTERNS)) {
    expect(
      hrefs.some((h) => re.test(h)),
      `a contact link matches ${name} (${re}) — got ${hrefs.join(', ')}`,
    ).toBe(true)
  }

  // The "open online version" (globe) link → http(s), new tab.
  const prod = page.locator('.prodbtn')
  await expect(prod).toHaveAttribute('href', /^https?:\/\/.+/)
  await expect(prod).toHaveAttribute('target', '_blank')

  // The "Download offline version" item is hidden on the offline build (no sibling file).
  await page.locator('.dl-wrap > button.iconbtn').click()
  await expect(page.locator('.dl-menu')).toBeVisible()
  await expect(page.locator('.dl-menu a.dl-item[download]')).toHaveCount(0)
})

test('the offline file prints healthy (no gaps, every image loaded)', async ({ page }) => {
  await openOffline(page)
  await enterPrintMode(page)
  await assertPrintHealthy(page)
})
