// Small formatting helpers (ported from v-extras.js / hero parts).
import { siteConfig } from '@/config'

export const slugify = (s: string): string =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export function langLevelPct(level: string): number {
  const l = (level || '').toLowerCase()
  if (l.includes('mastery') || l.includes('native')) return 100
  if (l.includes('advanced')) return 86
  if (l.includes('upper')) return 72
  if (l.includes('intermediate')) return 58
  return 65
}

/** Render mini-markdown emphasis (**strong**, *em*) to HTML — escape HTML first.
 *  Used for own-content fields that allow emphasis (how_i_work lead, interview answer). */
export function emphasize(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
}

export function roleLabelsFor(filters: string[] | undefined): string[] {
  const map = siteConfig().roleTagLabels || {}
  return (filters || []).map((f) => map[f]).filter(Boolean)
}

/** Role pills shown in the hero / hero-roles (config filters minus "all"; a filter's
 *  optional `short` overrides `label` for a tighter pill, e.g. "AI" not "AI / LLM"). */
export function heroRoleLabels(): string[] {
  return (siteConfig().filters || [])
    .filter((f) => f.id !== 'all')
    .map((f) => f.short || f.label || '')
    .filter(Boolean)
}
