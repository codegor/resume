import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { test, expect } from './fixtures'
import { offlineFileName } from '../ui/utils/offline-name'

// Same algorithm the build (scripts/finalize-single.mjs) uses to name the file.
const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url)))) // src/tests → <repo>
// name + updated live in the authored source base.json (the full resume.json is in dist/ only).
const res = JSON.parse(readFileSync(resolve(repoRoot, 'public/assets/resume/base.json'), 'utf8'))
const offlineFile = offlineFileName(res.name, res.updated)

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'check the single-file build once')
})

test('offline single-file build is self-contained — no external JS/CSS, images inlined', async ({
  page,
}) => {
  const requests: string[] = []
  page.on('request', (r) => requests.push(r.url()))

  await page.goto('/' + offlineFile)
  await page.waitForFunction(
    () => (window as Window & { __appReady?: boolean }).__appReady === true,
    {
      timeout: 20000,
    },
  )

  // no external bundle requests — JS+CSS+fonts are inlined
  const ext = requests.filter((u) => /\/assets\/(js|css|fonts)\//.test(u))
  expect(ext, `unexpected external requests: ${ext.join(', ')}`).toEqual([])

  // the hero photo's AVIF variant is inlined as a data URI in its <picture> <source>
  // (so it renders offline); the heavier original streams from VITE_MEDIA_BASE_URL.
  const heroPic = page.locator('picture.smart-pic', { has: page.locator('.hero-photo') }).first()
  await expect(heroPic.locator('source[type="image/avif"]').first()).toHaveAttribute(
    'srcset',
    /^data:image\/avif/,
  )
})
