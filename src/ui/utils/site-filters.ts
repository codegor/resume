/* =====================================================================
   SiteFilters — the single source of truth for "what belongs to a filter".
   Every section (skills, timeline, certificates) asks these helpers instead
   of reaching into the config directly, so filtering behaves identically
   everywhere. Driven by config.json (filters[].skillGroups + keywords →
   tech relevance; projects/conferences/certificates {filters:[…]} tagging).
   Ported from site-filters.js — now an ES module reading siteConfig().
   ===================================================================== */
import { siteConfig } from '@/config'
import type { FilterDef, SiteConfig } from '@/types/config'
import type { Skills, SkillEntry } from '@/types/resume'

export type ContentType = 'project' | 'conference' | 'certificate'
const TYPE_MAP: Record<ContentType, keyof SiteConfig> = {
  project: 'projects',
  conference: 'conferences',
  certificate: 'certificates',
}

const cfg = (): SiteConfig => siteConfig()

export function filterById(id: string): FilterDef | null {
  return (cfg().filters || []).find((f) => f.id === id) || null
}

/* filter ids a given content item is tagged with (project / conference / certificate) */
export function tagsFor(type: ContentType, key: string): string[] {
  const map = (cfg()[TYPE_MAP[type]] || {}) as Record<string, { filters?: string[] }>
  const entry = map[key]
  return (entry && entry.filters) || []
}

/* is this item shown under the active filter? ("all" shows everything) */
export function inFilter(type: ContentType, key: string, active: string): boolean {
  if (!active || active === 'all') return true
  return tagsFor(type, key).indexOf(active) !== -1
}

/* leading alphabetic word of a string, lowercased ("PHP 8.2" -> "php") */
function leadWord(s: string): string {
  const m = String(s || '')
    .toLowerCase()
    .match(/[a-z]+/)
  return m ? m[0] : ''
}

const itemName = (it: SkillEntry): string => (typeof it === 'string' ? it : it.name)
const itemKids = (it: SkillEntry): SkillEntry[] | undefined =>
  typeof it === 'string' ? undefined : it.details || it.components

type SkillsArg = Skills | null | undefined
const groupOf = (skills: Skills, g: string): unknown => (skills as Record<string, unknown>)[g]

/* lowercase keyword tokens that define a filter, gathered from its skill
   groups (every skill name + nested detail) plus its explicit keywords.
   Returns null for "all" / unknown filters (= no tech filtering). */
export function tokensForFilter(skills: SkillsArg, filterId: string): string[] | null {
  if (!skills || !filterId || filterId === 'all') return null
  const f = filterById(filterId)
  if (!f) return null
  const out: string[] = []
  const push = (name: string): void => {
    const w = leadWord(name)
    if (w.length >= 3) out.push(w)
  }
  const pull = (arr?: SkillEntry[]): void => {
    ;(arr || []).forEach((it) => {
      push(itemName(it))
      const kids = itemKids(it)
      if (Array.isArray(kids)) kids.forEach((k) => push(itemName(k)))
    })
  }
  ;(f.skillGroups || []).forEach((g) => {
    const gd = groupOf(skills, g)
    if (!gd) return
    if (Array.isArray(gd)) pull(gd as SkillEntry[])
    else {
      const grp = gd as { items?: SkillEntry[]; tools?: SkillEntry[]; highlights?: SkillEntry[] }
      pull(grp.items)
      pull(grp.tools)
      pull(grp.highlights)
    }
  })
  ;(f.keywords || []).forEach(push)
  return out.length ? out.filter((v, i) => out.indexOf(v) === i) : null
}

/* does a technology string belong to the active filter's token set? */
export function techMatches(tech: string, tokens: string[] | null): boolean {
  if (!tokens) return true
  const tl = String(tech || '').toLowerCase()
  return tokens.some((w) => tl.indexOf(w) !== -1)
}

/* ---- active-skill ↔ technology matching (version-agnostic + aliases) ---- */
function skillBase(s: string): string {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/\s+v?\d[\d.]*\+?$/, '')
    .trim()
}
function aliasOf(base: string): string {
  const map = cfg().skillAliases || {}
  return map[base] || base
}
/* does `haystack` START with `needle` as a whole leading word? */
function startsWithWord(haystack: string, needle: string): boolean {
  const WORD = /[a-z0-9.+#-]/
  if (haystack.indexOf(needle) !== 0) return false
  const after = haystack.charAt(needle.length)
  return !after || !WORD.test(after)
}
export function skillMatchesTech(tech: string, skill: string): boolean {
  if (!skill) return false
  const sb = skillBase(skill)
  const tb = skillBase(tech)
  if (!sb || !tb) return false
  if (aliasOf(sb) === aliasOf(tb)) return true
  return sb.length >= 2 && startsWithWord(tb, sb)
}
/* does the active skill appear anywhere in a project's tech list? */
export function projectUsesSkill(technologies: string[] | undefined, skill: string): boolean {
  return (technologies || []).some((t) => skillMatchesTech(t, skill))
}

/* case-insensitive fuzzy overlap between two labels. */
export function looseMatch(a: string, b: string): boolean {
  a = String(a || '').toLowerCase()
  b = String(b || '').toLowerCase()
  if (!a || !b) return false
  return a === b || (b.length > 2 && a.indexOf(b) !== -1) || (a.length > 2 && b.indexOf(a) !== -1)
}

/* every skill-chip name shown in the Skills section (all groups + nested). */
export function allSkillNames(skills: SkillsArg): string[] {
  if (!skills) return []
  const out: string[] = []
  const push = (n: string): void => {
    if (n) out.push(String(n))
  }
  const pull = (arr?: SkillEntry[]): void => {
    ;(arr || []).forEach((it) => {
      push(itemName(it))
      const kids = itemKids(it)
      if (Array.isArray(kids)) kids.forEach((k) => push(itemName(k)))
    })
  }
  Object.keys(skills).forEach((g) => {
    if (g === 'note') return
    const gd = groupOf(skills, g)
    if (!gd) return
    if (Array.isArray(gd)) pull(gd as SkillEntry[])
    else {
      const grp = gd as { items?: SkillEntry[]; tools?: SkillEntry[]; highlights?: SkillEntry[] }
      pull(grp.items)
      pull(grp.tools)
      pull(grp.highlights)
    }
  })
  return out
}

/* strip a trailing "(…)" qualifier from a skill label ("Manual QA (16y)" → "Manual QA"). */
function cleanLabel(n: string): string {
  return String(n || '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim()
}

/* is this technology actually listed as a skill in the Skills section? */
export function techIsSkill(tech: string, skills: SkillsArg): boolean {
  const tb = aliasOf(skillBase(cleanLabel(tech)))
  if (!tb) return false
  return allSkillNames(skills).some((n) => aliasOf(skillBase(cleanLabel(n))) === tb)
}

/* does the active skill match any label in a list (e.g. a course's skills)? */
export function skillInList(skill: string, list: string[] | undefined): boolean {
  if (!skill) return false
  return (list || []).some((s) => looseMatch(skill, s))
}

/* all skill names belonging to a filter's skill groups (parentheticals stripped). */
export function filterSkillNames(skills: SkillsArg, filterId: string): string[] | null {
  if (!skills || !filterId || filterId === 'all') return null
  const f = filterById(filterId)
  if (!f) return null
  const names: string[] = []
  const push = (n: string): void => {
    const c = cleanLabel(n)
    if (c) names.push(c)
  }
  const pull = (arr?: SkillEntry[]): void => {
    ;(arr || []).forEach((it) => {
      push(itemName(it))
      const kids = itemKids(it)
      if (Array.isArray(kids)) kids.forEach((k) => push(itemName(k)))
    })
  }
  ;(f.skillGroups || []).forEach((g) => {
    const gd = groupOf(skills, g)
    if (!gd) return
    if (Array.isArray(gd)) pull(gd as SkillEntry[])
    else {
      const grp = gd as { items?: SkillEntry[]; tools?: SkillEntry[]; highlights?: SkillEntry[] }
      pull(grp.items)
      pull(grp.tools)
      pull(grp.highlights)
    }
  })
  return names
}

/* is a project technology RELEVANT to the active filter? */
export function techRelevantToFilter(tech: string, skills: SkillsArg, filterId: string): boolean {
  if (!filterId || filterId === 'all') return true
  const f = filterById(filterId)
  if (!f) return true
  const names = filterSkillNames(skills, filterId)
  if (names && names.some((n) => skillMatchesTech(tech, n))) return true
  const tl = String(tech || '').toLowerCase()
  return (f.keywords || []).some((w) => {
    w = String(w).toLowerCase()
    return w.length >= 2 && tl.indexOf(w) !== -1
  })
}

/* should a project be VISIBLE under the active filter? */
export function projectInFilter(
  key: string,
  technologies: string[] | undefined,
  skills: SkillsArg,
  active: string,
): boolean {
  if (!active || active === 'all') return true
  if (tagsFor('project', key).indexOf(active) !== -1) return true
  const names = filterSkillNames(skills, active)
  if (!names || !names.length) return false
  return (technologies || []).some((t) => names.some((n) => skillMatchesTech(t, n)))
}

/* ---- free-text search (the Focus-bar search field) ---- */
export function queryHit(text: string | undefined, q: string): boolean {
  return (
    !!q &&
    String(text || '')
      .toLowerCase()
      .indexOf(q) !== -1
  )
}
export function projectMatchesQuery(
  p: { project?: string; client?: string; technologies?: string[] },
  q: string,
): boolean {
  if (!q) return true
  return (
    queryHit(p.project, q) ||
    queryHit(p.client, q) ||
    (p.technologies || []).some((t) => queryHit(t, q))
  )
}
export function learnMatchesQuery(type: ContentType, title: string, q: string): boolean {
  if (!q) return true
  if (queryHit(title, q)) return true
  const c = cfg()
  const map = (type === 'certificate' ? c.certificates : c.conferences) || {}
  const entry = map[title] || {}
  return (entry.skills || []).some((s) => queryHit(s, q))
}

// Aggregate for ergonomic importing (mirrors the old window.SiteFilters surface).
export const SiteFilters = {
  filterById,
  tagsFor,
  inFilter,
  tokensForFilter,
  techMatches,
  skillMatchesTech,
  projectUsesSkill,
  looseMatch,
  allSkillNames,
  techIsSkill,
  filterSkillNames,
  techRelevantToFilter,
  projectInFilter,
  skillInList,
  queryHit,
  projectMatchesQuery,
  learnMatchesQuery,
}
