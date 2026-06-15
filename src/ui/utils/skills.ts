// Skill-chip helpers (ported from v-skills.js): turn a skills group (any shape)
// into a flat chip list, rank by experience, and total free-text search matches.
import type { ResumeData, SkillEntry, SkillGroup, WorkExperience, LearnItem } from '@/types/resume'
import {
  projectMatchesQuery,
  learnMatchesQuery,
  skillMatchesTech,
  looseMatch,
} from '@/utils/site-filters'

export interface Chip {
  name: string
  exp?: string | null
  big?: boolean
  sub?: boolean
  isNew?: boolean // first appears in the most-recent project
  trendWeight?: number // resolved current-trend weight (0 when none)
}

/* word-boundary containment: does `needle` appear inside `hay` flush against a word
   edge on both sides? (so active "go" matches "go" / "go lang" but NOT "mongodb"). */
export function skWordContains(hay: string, needle: string): boolean {
  if (!needle) return false
  const isWord = (c: string): boolean => /[a-z0-9]/.test(c)
  let i = hay.indexOf(needle)
  while (i !== -1) {
    const before = i === 0 ? '' : hay[i - 1]
    const after = i + needle.length >= hay.length ? '' : hay[i + needle.length]
    if ((!before || !isWord(before)) && (!after || !isWord(after))) return true
    i = hay.indexOf(needle, i + 1)
  }
  return false
}

export const SKILL_GROUP_TITLES: Record<string, string> = {
  agent_development: 'Agent Development · AI / LLM',
  software_architect: 'Software Architect',
  team_lead: 'Team Lead',
  backend: 'Backend',
  frontend: 'Frontend',
  qa: 'QA & Testing',
  devops: 'DevOps · SRE',
  ide: 'IDE & Tools',
  principles: 'Principles',
  want_to_learn: 'Want to learn next or get more practice',
}
export const SKILL_GROUP_COLOR: Record<string, string> = {
  agent_development: 'var(--e5)',
  software_architect: 'var(--e3)',
  team_lead: 'var(--e4)',
  backend: 'var(--accent)',
  frontend: 'var(--e2)',
  devops: 'var(--e1)',
  qa: 'var(--e4)',
  ide: 'var(--faint)',
  principles: 'var(--faint)',
  want_to_learn: 'var(--accent)',
}
export const SKILL_LINE_GROUPS = ['agent_development', 'software_architect', 'want_to_learn']

export function skillNormItems(arr: SkillEntry[] | undefined): Chip[] {
  const out: Chip[] = []
  ;(arr || []).forEach((it) => {
    if (typeof it === 'string') {
      out.push({ name: it, exp: null, big: true })
      return
    }
    out.push({ name: it.name, exp: it.experience || null })
    const kids = it.details || it.components
    if (Array.isArray(kids))
      kids.forEach((k) => {
        if (typeof k === 'string') out.push({ name: k, exp: null, sub: true })
        else out.push({ name: k.name, exp: k.experience || null, sub: true })
      })
  })
  return out
}

/* ONE place that turns a skills group (any shape) into a flat chip list. */
export function skillChipsFor(gkey: string, gdata: SkillGroup | SkillEntry[] | undefined): Chip[] {
  const g = gdata
  let chips: Chip[] = []
  if (Array.isArray(g)) chips = skillNormItems(g)
  else if (!g) chips = []
  else if (gkey === 'team_lead') {
    chips = skillNormItems(g.tools)
    ;(g.highlights || []).forEach((h) =>
      chips.push(typeof h === 'string' ? { name: h } : { name: h.name, exp: h.experience || null }),
    )
  } else if (SKILL_LINE_GROUPS.includes(gkey)) {
    ;((g.items || []) as SkillEntry[]).forEach((it) =>
      chips.push(
        typeof it === 'string' ? { name: it } : { name: it.name, exp: it.experience || null },
      ),
    )
  } else chips = skillNormItems(g.items)
  return chips.map(normChipExp)
}

/* Some skills bake the duration into the name string ("System Design (14y)") while others
   use a separate `experience` field. Normalise the former into the latter so every chip
   renders the same way — a clean name + the muted "·y" suffix — and so the name matches
   trends/projects cleanly. Non-duration parentheticals are left untouched. */
const EXP_IN_NAME = /^(.*?)\s*\((\d+(?:\.\d+)?\s*[ym])\)\s*$/i
function normChipExp(c: Chip): Chip {
  const m = String(c.name || '').match(EXP_IN_NAME)
  if (!m) return c
  return { ...c, name: m[1].trim(), exp: c.exp || m[2].replace(/\s+/g, '') }
}

/* "8y" / "6m" / "1.5y" → months (0 when unknown) */
export function skillExpMonths(exp: string | null | undefined): number {
  const m = String(exp || '').match(/(\d+(?:\.\d+)?)\s*(y|m)/i)
  if (!m) return 0
  return parseFloat(m[1]) * (m[2].toLowerCase() === 'y' ? 12 : 1)
}
export function skillSearchMatch(name: string, q: string): boolean {
  return !!q && (name || '').toLowerCase().includes(q)
}

export interface FoundCounts {
  skills: number
  projects: number
  learn: number
  total: number
}

/* totals for the free-text search — Focus-bar badge + Skills status line */
export function searchFoundCounts(data: ResumeData | null, q: string): FoundCounts | null {
  if (!q || !data) return null
  let skills = 0
  Object.keys(data.skills || {}).forEach((k) => {
    if (k === 'note' || !data.skills[k]) return
    skills += skillChipsFor(k, data.skills[k] as SkillGroup).filter((c) =>
      skillSearchMatch(c.name, q),
    ).length
  })
  let projects = 0
  ;(data.work_experience || []).forEach((e) =>
    (e.projects || []).forEach((p) => {
      if (projectMatchesQuery(p, q)) projects++
    }),
  )
  let learn = 0
  ;((data.professional_courses || {}).items || []).forEach((c) => {
    if (learnMatchesQuery('certificate', (c as { title: string }).title, q)) learn++
  })
  ;((data.conferences || {}).items || []).forEach((c) => {
    if (learnMatchesQuery('conference', (c as { title: string }).title, q)) learn++
  })
  return { skills, projects, learn, total: skills + projects + learn }
}

/* =====================================================================
   "NEW" markers + current-trend accent
   ---------------------------------------------------------------------
   A skill/tech is "NEW" at the FIRST chronological place it appears.
   Two independent scopes: across PROJECTS (skills grid + timeline) and
   across the pooled CERT+CONFERENCE set. The trend accent is driven by a
   single global `trendSkills` weight map (current trends, config.json).
   All matching reuses the alias-aware site-filters helpers.
   ===================================================================== */

/* does label `a` and label `b` refer to the same skill/tech?
   alias-aware + version-agnostic first (both arg orders), fuzzy fallback. */
export function markerMatch(a: string, b: string): boolean {
  if (!a || !b) return false
  if (skillMatchesTech(a, b) || skillMatchesTech(b, a)) return true
  return a.length >= 3 && b.length >= 3 && looseMatch(a, b)
}

/* "February 2026" / "2026" → ms (NaN when unparseable). */
export function parseDateTs(s: string | null | undefined): number {
  return Date.parse(String(s || ''))
}
/* "02.2023 – 05.2026" / "08.2022" / "2019" → start ms (NaN when unknown). */
export function parsePeriodStartTs(period: string | null | undefined): number {
  const mm = String(period || '').match(/(\d{1,2})\.(\d{4})/)
  if (mm) return Date.UTC(+mm[2], +mm[1] - 1, 1)
  const yy = String(period || '').match(/\d{4}/)
  return yy ? Date.UTC(+yy[0], 0, 1) : NaN
}

export interface Occ {
  tech: string
  ts: number
}

const _projOcc = new WeakMap<object, Occ[]>()
/* every project technology paired with its project's start timestamp (memoized). */
export function projectOccurrences(we: WorkExperience[] | undefined): Occ[] {
  if (!we) return []
  const hit = _projOcc.get(we)
  if (hit) return hit
  const out: Occ[] = []
  we.forEach((e) =>
    (e.projects || []).forEach((p) => {
      const ts = parsePeriodStartTs(p.period || e.period)
      ;(p.technologies || []).forEach((t) => out.push({ tech: t, ts }))
    }),
  )
  _projOcc.set(we, out)
  return out
}

const _learnOcc = new WeakMap<object, Occ[]>()
/* every cert/conference skill paired with the item's date (memoized on the data object). */
export function learnOccurrences(data: ResumeData | null | undefined): Occ[] {
  if (!data) return []
  const hit = _learnOcc.get(data)
  if (hit) return hit
  const out: Occ[] = []
  const push = (items: LearnItem[] | undefined): void =>
    (items || []).forEach((it) => {
      const ts = parseDateTs(it.date || it.year)
      ;(it.skills || []).forEach((s) => out.push({ tech: s, ts }))
    })
  push(data.professional_courses?.items)
  push(data.conferences?.items)
  _learnOcc.set(data, out)
  return out
}

const _learnScopeOcc = new WeakMap<object, Occ[]>()
/* the scope a cert/conference skill's "NEW" is measured against: projects AND the pooled
   cert+conference set — so a skill already used on an earlier PROJECT is not "new" when a
   later course/talk covers it (memoized on the data object). */
export function learnScopeOccurrences(data: ResumeData | null | undefined): Occ[] {
  if (!data) return []
  const hit = _learnScopeOcc.get(data)
  if (hit) return hit
  const out = projectOccurrences(data.work_experience).concat(learnOccurrences(data))
  _learnScopeOcc.set(data, out)
  return out
}

/* returns (label, itemTs) → is this item the EARLIEST place `label` appears? */
export function makeFirstAppearance(occ: Occ[]): (label: string, ts: number) => boolean {
  return (label, ts) => {
    if (isNaN(ts)) return false
    for (const o of occ) {
      if (!isNaN(o.ts) && o.ts < ts && markerMatch(o.tech, label)) return false
    }
    return true
  }
}

/* skills-grid NEW test: appears in the latest project AND nowhere earlier. */
export function gridNewChecker(we: WorkExperience[] | undefined): (name: string) => boolean {
  const latest = we && we[0] && we[0].projects && we[0].projects[0]
  if (!latest) return () => false
  const latestTechs = latest.technologies || []
  const latestTs = parsePeriodStartTs(latest.period || (we && we[0] && we[0].period))
  const firstApp = makeFirstAppearance(projectOccurrences(we))
  return (name) => latestTechs.some((t) => markerMatch(t, name)) && firstApp(name, latestTs)
}

/* highest trend weight among matching trend-map keys (0 when none). */
export function trendWeightFor(name: string, trend: Record<string, number> | undefined): number {
  if (!trend || !name) return 0
  let best = 0
  for (const k of Object.keys(trend)) {
    if (markerMatch(k, name)) best = Math.max(best, trend[k] || 0)
  }
  return best
}

const BIG = 1_000_000 // trend weight dominates experience-months in the grid ranking
export function skillScore(chip: Chip): number {
  return (chip.trendWeight || 0) * BIG + skillExpMonths(chip.exp)
}

/* stamp isNew/trendWeight onto TOP-LEVEL grid chips (sub-items never flagged). */
export function decorateChips(
  chips: Chip[],
  opts: { isNew?: (name: string) => boolean; trend?: Record<string, number> },
): Chip[] {
  return chips.map((c) =>
    c.sub
      ? c
      : {
          ...c,
          isNew: opts.isNew ? opts.isNew(c.name) : false,
          trendWeight: trendWeightFor(c.name, opts.trend),
        },
  )
}

export interface ChipMark {
  isNew: boolean
  weight: number
  pill: boolean // top-3 new-by-weight in this item get the bold pill; rest a dot
}
/* mark a string list (project tech / cert skills): NEW + weight, top-3 new → pill. */
export function markChips(
  labels: string[],
  firstApp: (label: string, ts: number) => boolean,
  itemTs: number,
  trend: Record<string, number> | undefined,
): Map<string, ChipMark> {
  const marks = new Map<string, ChipMark>()
  const news: { label: string; weight: number }[] = []
  labels.forEach((l) => {
    if (marks.has(l)) return
    const isNew = firstApp(l, itemTs)
    const weight = trendWeightFor(l, trend)
    marks.set(l, { isNew, weight, pill: false })
    if (isNew) news.push({ label: l, weight })
  })
  news
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .forEach((n) => {
      const m = marks.get(n.label)
      if (m) m.pill = true
    })
  return marks
}
