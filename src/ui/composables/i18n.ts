// Lightweight i18n for the résumé UI. No vue-i18n dependency.
//
// The English phrase IS the key — t() looks a phrase up in the active language's
// dictionary and falls back to the phrase itself. en.json is an identity
// map ("phrase": "phrase") — the canonical key list — and is bundled + loaded here so
// a missing key can be flagged even for English.
//
// Adding a language: create src/ui/locales/<code>.json from en.json, translate the
// values, and register it in `dictionaries` (+ PLURAL_ORDER if it has >2 plural forms).
import { ref } from 'vue'
import en from '@/locales/en.json'

export const LANG_STORAGE_KEY = 'resume-lang'
export const DEFAULT_LANG = 'en'

// Registered dictionaries. en is the identity map (loaded above); future locales are
// added with a static import so they bundle into the single-file offline build too.
const dictionaries: Record<string, Record<string, string>> = {
  en: en as Record<string, string>,
}

// For locales whose plural rules need >2 forms (e.g. uk: one/few/many), the `other`
// key's value holds the forms `|`-separated in this category order.
const PLURAL_ORDER: Record<string, Intl.LDMLPluralRule[]> = {}

const hasDocument = typeof document !== 'undefined'
const hasLocalStorage = (() => {
  try {
    return typeof localStorage !== 'undefined'
  } catch {
    return false
  }
})()

export function availableLangs(): string[] {
  return Object.keys(dictionaries)
}

function detectInitialLang(): string {
  let candidate: string | null = null
  try {
    if (typeof location !== 'undefined' && location.search) {
      candidate = new URLSearchParams(location.search).get('lang')
    }
  } catch {
    /* ignore */
  }
  if (!candidate && hasLocalStorage) {
    try {
      candidate = localStorage.getItem(LANG_STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }
  return candidate && availableLangs().includes(candidate) ? candidate : DEFAULT_LANG
}

export const lang = ref<string>(detectInitialLang())

// reflect the initial language on <html lang> (boot screen sets it pre-paint too)
if (hasDocument) document.documentElement.lang = lang.value

export function setLang(l: string): void {
  if (!availableLangs().includes(l)) return
  lang.value = l
  if (hasLocalStorage) {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, l)
    } catch {
      /* ignore */
    }
  }
  if (hasDocument) document.documentElement.lang = l
}

// dedupe missing-key logging to once per lang::phrase per session
const warned = new Set<string>()
function warnMissing(phrase: string, l: string): void {
  const k = l + '::' + phrase
  if (warned.has(k)) return
  warned.add(k)
  console.info(`[i18n] missing "${phrase}" for "${l}" — using key as fallback`)
}

function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str
  return str.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m))
}

// Resolve a phrase in the active language; falls back to the phrase itself (+ logs once).
export function t(phrase: string, params?: Record<string, string | number>): string {
  const l = lang.value
  const dict = dictionaries[l]
  let out: string
  if (dict && Object.prototype.hasOwnProperty.call(dict, phrase)) {
    out = dict[phrase]
  } else {
    out = phrase
    warnMissing(phrase, l)
  }
  return interpolate(out, params)
}

// Plural-aware translate. en (and any 2-form locale) picks `one`/`other` by n===1.
// A locale with pipe-separated forms in its `other` value selects via Intl.PluralRules.
// `{n}` is injected automatically.
export function tc(
  one: string,
  other: string,
  n: number,
  params?: Record<string, string | number>,
): string {
  const p = { n, ...(params || {}) }
  const l = lang.value
  const dict = dictionaries[l]

  if (dict && PLURAL_ORDER[l]) {
    const raw = Object.prototype.hasOwnProperty.call(dict, other) ? dict[other] : undefined
    if (raw == null) warnMissing(other, l)
    const forms = (raw ?? other).split('|')
    if (forms.length > 1) {
      const cat = new Intl.PluralRules(l).select(n)
      const idx = PLURAL_ORDER[l].indexOf(cat)
      return interpolate(forms[idx >= 0 ? idx : forms.length - 1], p)
    }
  }
  return t(n === 1 ? one : other, p)
}

// Test-only hook: register a fake locale dictionary (+ optional plural order) so the
// non-en code paths can be exercised without shipping a real translation file.
export function _registerLocaleForTests(
  code: string,
  dict: Record<string, string>,
  pluralOrder?: Intl.LDMLPluralRule[],
): void {
  dictionaries[code] = dict
  if (pluralOrder) PLURAL_ORDER[code] = pluralOrder
}
