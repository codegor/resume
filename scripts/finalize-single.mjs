// Moves the single-file build (dist/.single/index.html) to its final, dynamically
// named offline file (e.g. egor_berezovsky_resume_offline_06.2026.html) and removes
// the temp dir, without clobbering the multifile dist/index.html.
import { existsSync, mkdirSync, copyFileSync, rmSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const dist = resolve(repoRoot, 'dist')
const src = resolve(dist, '.single/index.html')

// Keep this in sync with src/ui/utils/offline-name.ts (a plain .mjs can't import the .ts).
// The top-bar "Download offline version" link is generated with the same algorithm, so
// it must resolve to the exact filename written here.
function offlineFileName(name, updated) {
  const slug =
    String(name || 'resume')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'resume'
  const m = String(updated || '').match(/(\d{4})-(\d{2})/)
  const date = m ? `${m[2]}.${m[1]}` : ''
  return date ? `${slug}_resume_offline_${date}.html` : `${slug}_resume_offline.html`
}

// name + updated for the offline filename come from the authored source base.json (the full
// resume.json is generated only into dist/ during the build, not public/).
const res = JSON.parse(readFileSync(resolve(repoRoot, 'public/assets/resume/base.json'), 'utf8'))
const destName = offlineFileName(res.name, res.updated)
const dest = resolve(dist, destName)

if (!existsSync(src)) {
  console.error(`[finalize-single] expected ${src} — did "vite build --mode single" run?`)
  process.exit(1)
}
mkdirSync(dist, { recursive: true })
copyFileSync(src, dest)
rmSync(resolve(dist, '.single'), { recursive: true, force: true })
console.log(`[finalize-single] wrote dist/${destName}`)
