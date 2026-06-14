// One-shot source-image optimizer. Re-encodes the bulky images under public/assets
// IN PLACE (git history preserves the originals) so the hosted site loads faster and
// the inlined ones in the offline single-file build stay small. Cert screenshots are streamed
// from the prod root in the offline build, but optimizing them still shrinks the
// hosted page and the image a recipient opens via the offline placeholder.
//
// Run on the dev_env node container (sharp lives in the repo-root node_modules):
//   docker exec node sh -c "cd /var/www/resume && yarn optimize:images"
//
// Idempotent enough to re-run, but each run re-encodes — run once, then verify.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join, extname } from 'node:path'
import { createRequire } from 'node:module'

const here = dirname(fileURLToPath(import.meta.url))
// sharp is a devDependency in the repo-root package.json — resolve it from there.
const require = createRequire(resolve(here, '../package.json'))
const sharp = require('sharp')

const assets = resolve(here, '../public/assets')
const kb = (n) => `${(n / 1024).toFixed(0)} KB`

/** Re-encode one file in place. `make` receives a fresh sharp() pipe and returns a Buffer. */
async function reencode(rel, make) {
  const path = join(assets, rel)
  if (!existsSync(path)) {
    console.log(`  skip (missing): ${rel}`)
    return { before: 0, after: 0 }
  }
  const before = statSync(path).size
  const meta = await sharp(path).metadata()
  const out = await make(sharp(path), meta)
  // never let a re-encode grow a file (e.g. already-tiny PNGs)
  if (out.length >= before) {
    console.log(
      `  keep ${rel}  ${meta.width}x${meta.height}  ${kb(before)} (re-encode not smaller)`,
    )
    return { before, after: before }
  }
  writeFileSync(path, out)
  console.log(`  ${rel}  ${meta.width}x${meta.height}  ${kb(before)} -> ${kb(out.length)}`)
  return { before, after: out.length }
}

const pngQuant = (pipe, maxW) =>
  pipe
    .resize({ width: maxW, withoutEnlargement: true })
    .png({ palette: true, quality: 78, effort: 10, compressionLevel: 9 })
    .toBuffer()

async function main() {
  let before = 0
  let after = 0
  const tally = (r) => {
    before += r.before
    after += r.after
  }

  console.log('intro-poster (video poster, shown small in a circle):')
  tally(await reencode('intro-poster.png', (p) => pngQuant(p, 640)))

  console.log('hero photo:')
  tally(
    await reencode('foto.jpg', (p) =>
      p
        .resize({ width: 760, withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer(),
    ),
  )

  console.log('eras (decorative timeline images):')
  for (const f of readdirSync(join(assets, 'eras')).filter((f) => extname(f) === '.png')) {
    tally(await reencode(join('eras', f), (p) => pngQuant(p, 900)))
  }

  console.log('certs (screenshots — externalized in the offline build, hosted + opened full):')
  for (const f of readdirSync(join(assets, 'certs')).filter((f) => extname(f) === '.png')) {
    tally(await reencode(join('certs', f), (p) => pngQuant(p, 1100)))
  }

  console.log(`\nTOTAL  ${kb(before)} -> ${kb(after)}  (saved ${kb(before - after)})`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
