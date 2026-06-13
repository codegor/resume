import { readFileSync } from 'node:fs'
import { test, expect, openApp } from './fixtures'

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'download menu lives in the desktop top bar')
})

test('Markdown (.md) export downloads a populated résumé', async ({ page }) => {
  await openApp(page)
  await page.locator('.dl-wrap .iconbtn').click()
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('.dl-menu .dl-item', { hasText: 'Markdown' }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/\.md$/)

  // it's a real, populated résumé — not an empty stub
  const file = await download.path()
  const md = readFileSync(file, 'utf8')
  expect(md.length, 'non-trivial markdown').toBeGreaterThan(1000)
  expect(md, 'has the name').toMatch(/egor\s+berezovsky/i)
  expect(md, 'has markdown headings').toMatch(/^#{1,3}\s/m)
  expect(md, 'lists skills').toMatch(/skill/i)
  expect(md, 'lists experience/work').toMatch(/experience|work|timeline/i)
})
