// Drift guard: because the en fast-path returns the key verbatim, a phrase used in code
// but missing from en.json would render fine yet silently break every other language.
// This test fails the build if any used key is absent from en.json, and ensures en.json
// stays a strict identity map.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { join } from 'node:path'
import en from '../../ui/locales/en.json'
import { SKILL_GROUP_TITLES } from '../../ui/utils/skills'
import { TITLES } from '../../ui/utils/md-export'

const UI_DIR = fileURLToPath(new URL('../../ui', import.meta.url))
const enKeys = new Set(Object.keys(en as Record<string, string>))

function walk(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const s = statSync(p)
    if (s.isDirectory()) out.push(...walk(p))
    else if (/\.(vue|ts)$/.test(name)) out.push(p)
  }
  return out
}

// strip HTML, block, and line comments so doc examples (e.g. t('…') in a comment) aren't
// scanned. The line-comment regex requires start-of-line or whitespace before //, so
// `https://…` inside a string survives.
function stripComments(src: string): string {
  return src
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/gm, '$1')
}

function normalize(s: string): string {
  // mirror T.vue: collapse ASCII whitespace only, preserve &nbsp;/U+00A0
  return s.replace(/[ \t\r\n]+/g, ' ').replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, '')
}

// unescape a JS string-literal body (mirror the generator) so '\'' / "\"" match the runtime key
function unesc(s: string): string {
  return s.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\')
}

// collect every translation key referenced in the source
function collectUsedKeys(): Map<string, string> {
  const used = new Map<string, string>() // key -> first file it appeared in
  const add = (key: string, file: string) => {
    if (key && !used.has(key)) used.set(key, file)
  }
  for (const file of walk(UI_DIR)) {
    const rel = file.slice(UI_DIR.length + 1)
    const src = stripComments(readFileSync(file, 'utf8'))

    // t('…') / $t('…')  — string-literal first arg only
    for (const m of src.matchAll(/(?<![\w.])\$?t\(\s*(['"])((?:\\.|(?!\1).)*)\1/g))
      add(unesc(m[2]), rel)
    // tc('one','other', …) / $tc(…) — both literal forms
    for (const m of src.matchAll(
      /(?<![\w.])\$?tc\(\s*(['"])((?:\\.|(?!\1).)*)\1\s*,\s*(['"])((?:\\.|(?!\3).)*)\3/g,
    )) {
      add(unesc(m[2]), rel)
      add(unesc(m[4]), rel)
    }
    // <t …>slot</t> — skip slots with nested elements or mustache (dynamic, not a key)
    for (const m of src.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)) {
      const inner = m[1]
      if (inner.includes('<') || inner.includes('{{')) continue
      add(normalize(inner), rel)
    }
    // <tc one="…" other="…" /> — attribute values
    for (const m of src.matchAll(/<tc\b[^>]*?>/g)) {
      const tag = m[0]
      const one = tag.match(/\bone\s*=\s*"([^"]*)"/)
      const other = tag.match(/\bother\s*=\s*"([^"]*)"/)
      if (one) add(one[1], rel)
      if (other) add(other[1], rel)
    }
    // $t(prop || 'fallback literal') — default copy passed to a child via props
    for (const m of src.matchAll(/(?<![\w.])\$?t\(\s*[\w.]+\s*\|\|\s*(['"])((?:\\.|(?!\1).)*)\1/g))
      add(unesc(m[2]), rel)
    // <feedback-form q="…" …> — translatable copy passed as literal attributes
    for (const m of src.matchAll(/<feedback-form\b[^>]*?>/g)) {
      for (const a of ['q', 'sub', 'subject', 'placeholder', 'btn']) {
        const am = m[0].match(new RegExp('\\b' + a + '\\s*=\\s*"([^"]*)"'))
        if (am) add(am[1], rel)
      }
    }
  }
  return used
}

describe('en.json identity map', () => {
  it('every value equals its key', () => {
    for (const [k, v] of Object.entries(en as Record<string, string>)) {
      expect(v, `en.json["${k}"] must equal its key`).toBe(k)
    }
  })
})

describe('every used translation key exists in en.json', () => {
  const used = collectUsedKeys()
  it('reports no missing keys', () => {
    const missing = [...used].filter(([k]) => !enKeys.has(k)).map(([k, f]) => `${f}: "${k}"`)
    expect(missing, `add these to src/ui/locales/en.json:\n${missing.join('\n')}`).toEqual([])
  })
})

describe('skill-group title maps reference en.json keys', () => {
  it('SKILL_GROUP_TITLES values are all keys', () => {
    const missing = Object.values(SKILL_GROUP_TITLES).filter((v) => !enKeys.has(v))
    expect(missing).toEqual([])
  })
  it('TITLES values are all keys', () => {
    const missing = Object.values(TITLES).filter((v) => !enKeys.has(v))
    expect(missing).toEqual([])
  })
})
