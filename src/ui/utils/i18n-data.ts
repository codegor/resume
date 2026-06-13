// Runtime resolver for localized DATA values (resume.json / config.json).
//
// A text field is either a plain value (= English) or a per-language map that includes
// `en`:  { "en": "…", "uk": "…" }. localizeData() deep-copies a fetched JSON tree,
// resolving every such map to the active language (en fallback), so all downstream
// consumers (components, md-export, SEO, the derived lookup maps) keep receiving plain
// values. Run it on the pristine fetched objects BEFORE buildDerivedConfig().
import type { Localized } from '@/types/i18n'

const LOCALE_KEY_RE = /^[a-z]{2}(-[A-Z]{2})?$/

// A localized value is a plain object that HAS an `en` key and whose keys are ALL
// locale codes — distinguishing { en, uk } from real data objects that merely contain
// an `en`-named sibling.
export function isLocalizedValue(v: unknown): v is Record<string, unknown> {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return false
  const keys = Object.keys(v as object)
  if (keys.length === 0 || !Object.prototype.hasOwnProperty.call(v, 'en')) return false
  return keys.every((k) => LOCALE_KEY_RE.test(k))
}

// Pick the value for `lang` from a localized map, falling back to en. Non-localized
// values pass through unchanged.
export function resolveLocalized<T>(v: Localized<T>, lang: string): T {
  if (isLocalizedValue(v)) {
    const map = v as Record<string, T>
    return lang in map ? map[lang] : map.en
  }
  return v as T
}

// Deep copy of a JSON value with every localized map resolved to `lang`. Recurses into
// the picked value so a whole-array form ({ en: [...], uk: [...] }) resolves too.
export function localizeData<T = unknown>(node: unknown, lang: string): T {
  if (isLocalizedValue(node)) {
    const map = node as Record<string, unknown>
    return localizeData(lang in map ? map[lang] : map.en, lang)
  }
  if (Array.isArray(node)) {
    return node.map((item) => localizeData(item, lang)) as unknown as T
  }
  if (node !== null && typeof node === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, val] of Object.entries(node as Record<string, unknown>)) {
      out[k] = localizeData(val, lang)
    }
    return out as T
  }
  return node as T
}
