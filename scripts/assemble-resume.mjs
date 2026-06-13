// Step-2 assembler — stitches the authored source under public/assets/ into the FULL
// (old-format) resume.json + config.json that the app loads. The source is the new format:
//   public/assets/config.json   → base config (everything EXCEPT epochs{})   ← edit this
//   public/assets/resume/…      → the résumé content tree                     ← edit this
// The full files are written ONLY to the build output (dist/assets) — they never live in
// public/. (Multifile: written by copyAssetsPlugin. Single/offline: inlined by inlineDataPlugin.
// Dev: served from memory. See vite.config.ts.)
//
// Tree layout (see CONFIG_GUIDE.md):
//   public/assets/resume/base.json                    → résumé minus work_experience + course/conf items
//   public/assets/resume/courses/NN_*.json            → professional_courses.items[]   (NN: 1=oldest)
//   public/assets/resume/conferences/NN_*.json        → conferences.items[]            (NN: 1=oldest)
//   public/assets/resume/epochs/N_*/config.json       → { period, ...config.epochs[period] }
//   public/assets/resume/epochs/N_*/projects/N_*/config.json        → a work_experience[] entry (no projects)
//   public/assets/resume/epochs/N_*/projects/N_*/subprojects/NN_*.json → that entry's projects[] (NN: 1=oldest)
//
// NN_ files and N_ folders are read in filename order (oldest-first) and REVERSED so the
// assembled arrays match the app's newest-first order.
//
// `srcDir` is passed explicitly by vite.config (Vite bundles this module into the config, so
// import.meta.url is unreliable there); the CLI defaults it from import.meta.url.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = () => dirname(dirname(fileURLToPath(import.meta.url)))
const defaultSrcDir = () => resolve(repoRoot(), 'public/assets')

const readJSON = (p) => JSON.parse(readFileSync(p, 'utf8'))
const jsonFiles = (p) =>
  existsSync(p)
    ? readdirSync(p)
        .filter((f) => f.endsWith('.json'))
        .sort()
    : []
// NN_-numbered lists are authored oldest-first; reverse to the app's newest-first order.
const loadList = (p) =>
  jsonFiles(p)
    .map((f) => readJSON(join(p, f)))
    .reverse()

/** Pure: read the source (base config.json + resume/ tree), return the FULL { resume, config }. */
export function buildFromTree(srcDir = defaultSrcDir()) {
  const SRC = join(srcDir, 'resume')
  const base = readJSON(join(SRC, 'base.json'))

  const courses = loadList(join(SRC, 'courses'))
  const conferences = loadList(join(SRC, 'conferences'))

  // epochs/ holds file+folder pairs: an era card `NN_<era>.json` beside a `NN_<era>/` folder
  // of company shells `NN_<co>.json`, each beside a `NN_<co>/` folder of role files. NN is
  // 1=oldest; build oldest-first then reverse → the app's newest-first work_experience.
  const epochsDir = join(SRC, 'epochs')
  const work = []
  const epochs = {}
  for (const eraFile of jsonFiles(epochsDir)) {
    const { period, ...card } = readJSON(join(epochsDir, eraFile))
    epochs[period] = card
    const eraDir = join(epochsDir, eraFile.replace(/\.json$/, ''))
    for (const coFile of jsonFiles(eraDir)) {
      const entry = readJSON(join(eraDir, coFile))
      const coDir = join(eraDir, coFile.replace(/\.json$/, ''))
      work.push({ ...entry, projects: loadList(coDir) })
    }
  }
  work.reverse()

  const resume = { ...base, work_experience: work }
  resume.professional_courses = { ...(base.professional_courses || {}), items: courses }
  resume.conferences = { ...(base.conferences || {}), items: conferences }

  // The base config (everything except epochs{}) is the authored public/assets/config.json;
  // merge the epochs assembled from the tree to produce the full, old-format config.
  const config = { ...readJSON(join(srcDir, 'config.json')), epochs }
  return { resume, config }
}

/** Write the FULL resume.json + config.json into outDir (e.g. dist/assets) — NOT into public/. */
export function writeAssembled(outDir, srcDir = defaultSrcDir()) {
  const { resume, config } = buildFromTree(srcDir)
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'resume.json'), JSON.stringify(resume, null, 2) + '\n')
  writeFileSync(join(outDir, 'config.json'), JSON.stringify(config, null, 2) + '\n')
  return { resume, config }
}

// CLI: `node scripts/assemble-resume.mjs` → write the full files to dist/assets (for inspection;
// a normal `yarn build` regenerates them itself).
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  writeAssembled(resolve(repoRoot(), 'dist/assets'))
  console.log('[assemble-resume] wrote dist/assets/{resume,config}.json from the source tree')
}
