// Localized data values. A text field in resume.json / config.json (and the authored
// split tree) is EITHER a plain value (= English) OR a per-language map that MUST
// include `en` and may add other locale codes:  { "en": "Hello", "uk": "Привіт" }.
// The runtime resolver (utils/i18n-data.ts) picks the active language with en fallback,
// so every consumer downstream keeps receiving the plain resolved value.
export type Localized<T = string> = T | ({ en: T } & Partial<Record<string, T>>)

// Expose the translate functions as template globals ($t / $tc) so SFC templates can
// translate attribute values without importing anything — and without colliding with
// the <t> / <tc> components (a script-setup `t` binding would otherwise shadow the tag).
declare module 'vue' {
  interface ComponentCustomProperties {
    $t: typeof import('@/composables/i18n').t
    $tc: typeof import('@/composables/i18n').tc
  }
}
