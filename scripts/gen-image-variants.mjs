// Generates responsive image variants (AVIF + WebP, plus JPEG for opaque photos)
// for every raster asset the site shows via the <picture> element (SmartImg.vue /
// the era-cloud image-set). Run ONCE on the dev_env node container (sharp lives in
// the repo-root node_modules), then pull the generated files back to the repo:
//
//   docker exec node sh -c "cd /var/www/resume && yarn gen:variants"
//
// Policy (per-type):
//   • opaque photos (certs, hero photo, video poster) → .avif + .webp + .jpg, JPEG is
//     the <img> fallback (config points at .jpg).
//   • transparent images (provider logos, era word-clouds) → .avif + .webp, the
//     original .png stays the fallback (avif/webp keep alpha; JPEG would not).
//   • the cert-placeholder.svg is vector → skipped.
//
// Cert masters are read from examples/ (the canonical, full-res, gitignored sources the
// owner updates); the spaced/legacy master filenames are mapped to the kebab-case,
// type-prefixed output names config.json now references.
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'
import { createRequire } from 'node:module'

const here = dirname(fileURLToPath(import.meta.url))
const require = createRequire(resolve(here, '../package.json'))
const sharp = require('sharp')

const assets = resolve(here, '../public/assets')
const examples = resolve(here, '../examples')
const kb = (n) => `${(n / 1024).toFixed(0)} KB`

// Cert cards: [examples master filename, output base name in assets/certs] — opaque.
const CERTS = [
  ['certificate-highload-fwdays-2026.png', 'certificate-highload-fwdays-2026'],
  ['certificate-fwdays-ai-summit.png', 'certificate-fwdays-ai-summit'],
  ['certificate-devops-fwdays-2026.png', 'certificate-devops-fwdays-2026'],
  ['certificate-php-fwdays-2025.png', 'certificate-php-fwdays-2025'],
  ['certificate-architecture-fwdays-2025.png', 'certificate-architecture-fwdays-2025'],
  ['certificate-fwdays-devrain-ai.png', 'certificate-fwdays-devrain-ai'],
  ['certificate-highload-fwdays-2025.png', 'certificate-highload-fwdays-2025'],
  ['certificate-javascript-fwdays-2025.png', 'certificate-javascript-fwdays-2025'],
  ['Crash Course Deep Dive into LLM APIs.png', 'crash-course-deep-dive-into-llm-apis'],
  ['Architecture As Code.png', 'course-architecture-as-code'],
  ['Workshop Security Architecture in Practice.png', 'workshop-security-architecture-in-practice'],
  ['Crash Course Technical Leadership.png', 'crash-course-technical-leadership'],
  [
    'Course Agentic Engineering for large projects.png',
    'course-agentic-engineering-for-large-projects',
  ],
  ['Platform Architecture AI edition.png', 'platform-architecture-ai-edition'],
  ['Exiting the Monolith.png', 'crash-course-exiting-the-monolith'],
  ['certificate-domain-driven-design-workshop.png', 'workshop-domain-driven-design'],
  [
    'certificate-software-architecture-design-course-3.png',
    'course-software-architecture-design-in-practice',
  ],
  ['certificate-microservice-architecture-course-2.png', 'course-microservices-architecture'],
]

// Other opaque photos read from public/assets: [src rel, out base rel, maxWidth].
const PHOTOS = [
  ['foto.jpg', 'foto', 720],
  ['intro-poster.png', 'intro-poster', 720],
]

// Transparent images (keep the original .png fallback): [src rel, out base rel, maxWidth].
// NOTE: the era word-cloud PNGs are intentionally NOT here — they're already tiny
// palette PNGs and re-encoding them to avif/webp makes them BIGGER, so they stay
// PNG-only (lazy-loaded + inlined in the offline build).
const TRANSPARENT = [
  ['providers/fwdays.png', 'providers/fwdays', 240],
  ['providers/vueschool.png', 'providers/vueschool', 240],
]

async function emit(srcPath, outBaseAbs, { jpeg, maxW }) {
  if (!existsSync(srcPath)) {
    console.log(`  SKIP (missing): ${srcPath}`)
    return
  }
  const pipe = () => sharp(srcPath).rotate().resize({ width: maxW, withoutEnlargement: true })
  const wrote = []

  const avif = await pipe()
    .avif({ quality: jpeg ? 50 : 55, effort: 4 })
    .toBuffer()
  writeFileSync(outBaseAbs + '.avif', avif)
  wrote.push(`avif ${kb(avif.length)}`)

  const webp = await pipe()
    .webp({ quality: jpeg ? 78 : 82, alphaQuality: 100 })
    .toBuffer()
  writeFileSync(outBaseAbs + '.webp', webp)
  wrote.push(`webp ${kb(webp.length)}`)

  if (jpeg) {
    const jpg = await pipe().jpeg({ quality: 80, mozjpeg: true }).toBuffer()
    writeFileSync(outBaseAbs + '.jpg', jpg)
    wrote.push(`jpg ${kb(jpg.length)}`)
  }

  const src = statSync(srcPath).size
  console.log(
    `  ${outBaseAbs.replace(assets + '/', '')}  (src ${kb(src)})  ->  ${wrote.join(', ')}`,
  )
}

async function main() {
  console.log('Certificates (from examples/, opaque → avif+webp+jpg):')
  for (const [master, base] of CERTS) {
    await emit(join(examples, master), join(assets, 'certs', base), { jpeg: true, maxW: 1000 })
  }
  console.log('\nPhotos (opaque → avif+webp+jpg):')
  for (const [src, base, maxW] of PHOTOS) {
    await emit(join(assets, src), join(assets, base), { jpeg: true, maxW })
  }
  console.log('\nTransparent (logos + era clouds → avif+webp, keep .png):')
  for (const [src, base, maxW] of TRANSPARENT) {
    await emit(join(assets, src), join(assets, base), { jpeg: false, maxW })
  }
  console.log('\nDone.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
