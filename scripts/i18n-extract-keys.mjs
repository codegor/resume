/* i18n key extractor / sync tool.
 *
 * Scans the UI source (src/ui/**.{vue,ts}) for every translation key used via:
 *   - t('…') / $t('…')               (function form, attributes, script-side)
 *   - tc('one','other', …) / $tc(…)   (plural form — both literal arms)
 *   - <t …>slot text</t>              (the <t> component — slot text IS the key)
 *   - <tc one="…" other="…" />        (the <tc> component props)
 * plus the display-title maps SKILL_GROUP_TITLES (utils/skills.ts) and TITLES
 * (utils/md-export.ts), whose values are read through t() at runtime.
 *
 * Writes src/ui/locales/en.json as a SORTED identity map ("phrase": "phrase") — the
 * canonical key list and the template translators copy to add a language.
 *
 * Run: node scripts/i18n-extract-keys.mjs   (or `yarn i18n:sync`). The unit test
 * src/tests/unit/i18n-keys.test.ts uses the SAME extraction and fails CI if en.json
 * drifts from the code, so re-run this whenever you add/edit a UI string.
 *
 * Extraction MUST stay in lockstep with i18n-keys.test.ts and the normalize() in
 * components/T.vue.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { join } from 'node:path'

const UI_DIR = fileURLToPath(new URL('../src/ui', import.meta.url))
const EN_JSON = fileURLToPath(new URL('../src/ui/locales/en.json', import.meta.url))

function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const s = statSync(p)
    if (s.isDirectory()) out.push(...walk(p))
    else if (/\.(vue|ts)$/.test(name)) out.push(p)
  }
  return out
}

// strip HTML, block, and line comments so doc examples aren't scanned (URLs survive)
function stripComments(src) {
  return src
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/gm, '$1')
}

// mirror T.vue: collapse ASCII whitespace only, preserve &nbsp;/U+00A0
function normalize(s) {
  return s.replace(/[ \t\r\n]+/g, ' ').replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, '')
}

// pull the quoted string values out of a `NAME: Record<string,string> = { … }` literal
function mapValues(src, name) {
  const m = src.match(new RegExp(name + '\\s*:[^=]*=\\s*\\{([\\s\\S]*?)\\n\\}'))
  if (!m) return []
  const vals = []
  for (const mm of m[1].matchAll(/:\s*'((?:\\.|[^'])*)'|:\s*"((?:\\.|[^"])*)"/g)) {
    vals.push((mm[1] ?? mm[2]).replace(/\\'/g, "'").replace(/\\"/g, '"'))
  }
  return vals
}

const keys = new Set()

for (const file of walk(UI_DIR)) {
  const src = stripComments(readFileSync(file, 'utf8'))

  for (const m of src.matchAll(/(?<![\w.])\$?t\(\s*(['"])((?:\\.|(?!\1).)*)\1/g)) {
    keys.add(m[2].replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\'))
  }
  for (const m of src.matchAll(
    /(?<![\w.])\$?tc\(\s*(['"])((?:\\.|(?!\1).)*)\1\s*,\s*(['"])((?:\\.|(?!\3).)*)\3/g,
  )) {
    for (const g of [m[2], m[4]])
      keys.add(g.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\'))
  }
  for (const m of src.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)) {
    const inner = m[1]
    if (inner.includes('<') || inner.includes('{{')) continue
    keys.add(normalize(inner))
  }
  for (const m of src.matchAll(/<tc\b[^>]*?>/g)) {
    const one = m[0].match(/\bone\s*=\s*"([^"]*)"/)
    const other = m[0].match(/\bother\s*=\s*"([^"]*)"/)
    if (one) keys.add(one[1])
    if (other) keys.add(other[1])
  }
  // $t(prop || 'fallback literal') — default copy passed to a child via props
  for (const m of src.matchAll(/(?<![\w.])\$?t\(\s*[\w.]+\s*\|\|\s*(['"])((?:\\.|(?!\1).)*)\1/g)) {
    keys.add(m[2].replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\'))
  }
  // <feedback-form q="…" …> — translatable copy passed as literal attributes
  for (const m of src.matchAll(/<feedback-form\b[^>]*?>/g)) {
    for (const a of ['q', 'sub', 'subject', 'placeholder', 'btn']) {
      const am = m[0].match(new RegExp('\\b' + a + '\\s*=\\s*"([^"]*)"'))
      if (am) keys.add(am[1])
    }
  }
}

// display-title maps read through t() at runtime
for (const v of mapValues(
  readFileSync(join(UI_DIR, 'utils/skills.ts'), 'utf8'),
  'SKILL_GROUP_TITLES',
))
  keys.add(v)
for (const v of mapValues(readFileSync(join(UI_DIR, 'utils/md-export.ts'), 'utf8'), 'TITLES'))
  keys.add(v)

keys.delete('')
const sorted = [...keys].sort((a, b) => a.localeCompare(b))
const obj = {}
for (const k of sorted) obj[k] = k
writeFileSync(EN_JSON, JSON.stringify(obj, null, 2) + '\n')
console.log(`en.json: ${sorted.length} keys written`)
