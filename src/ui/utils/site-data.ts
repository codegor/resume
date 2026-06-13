/**
 * Runtime data adapter — config→résumé migration, Step 1.
 *
 * Step 1 physically moved the filterable metadata OUT of config.json and INTO
 * resume.json so every résumé item is self-contained: project filters/outcomes/
 * video now live on `work_experience[].projects[]`, conference & course meta on
 * their `items[]`, and the role `filters[]`, `providers{}` and per-filter
 * `roleLabel` sit at the resume top level.
 *
 * The ~12 components/utils that drive filtering still read the OLD config shape
 * (`siteConfig().projects / conferences / certificates / providers / filters /
 * videos / roleTagLabels`). buildDerivedConfig rebuilds those exact lookup maps
 * FROM resume.json and merges them onto the config object, so every consumer
 * stays byte-for-byte identical — only the source of truth moved. Wired once in
 * App.vue: `setSiteConfig(buildDerivedConfig(cfg, res))`.
 */
import type { SiteConfig, FilterDef, ProviderDef, TaggedEntry } from '@/types/config'
import type { ResumeData, LearnItem } from '@/types/resume'

const has = <T>(v: T | null | undefined): v is T => v != null

/** Copy only the config-meta fields (+ offline-inlined `*Avif` siblings) that the
 *  LearnCard / ConfItem / ConfList / site-filters consumers read — so a derived
 *  certificates/conferences entry matches the old config-map shape exactly. */
function metaOf(it: LearnItem): TaggedEntry {
  const e: TaggedEntry = {}
  if (has(it.filters)) e.filters = it.filters
  if (has(it.skills)) e.skills = it.skills
  if (has(it.provider)) e.provider = it.provider
  if (has(it.cert)) e.cert = it.cert
  if (has(it.certImg)) e.certImg = it.certImg
  if (has(it.certImgAvif)) e.certImgAvif = it.certImgAvif
  if (has(it.certUrl)) e.certUrl = it.certUrl
  if (has(it.url)) e.url = it.url
  if (has(it.desc)) e.desc = it.desc
  return e
}

export function buildDerivedConfig(cfg: SiteConfig, res: ResumeData): SiteConfig {
  const filters: FilterDef[] = res.filters || []
  const providers: Record<string, ProviderDef> = res.providers || {}

  // roleTagLabels{ id: label } reconstructed from filters[].roleLabel (the fold-in target).
  const roleTagLabels: Record<string, string> = {}
  filters.forEach((f) => {
    if (has(f.roleLabel)) roleTagLabels[f.id] = f.roleLabel
  })

  // projects{ "Company::project": { filters?, outcomes? } } from work_experience;
  // videos{} = config's intro/intro_short + each project's inline `video`.
  const projects: NonNullable<SiteConfig['projects']> = {}
  const videos: NonNullable<SiteConfig['videos']> = { ...(cfg.videos || {}) }
  ;(res.work_experience || []).forEach((exp) => {
    ;(exp.projects || []).forEach((p) => {
      const entry: NonNullable<SiteConfig['projects']>[string] = {}
      if (has(p.filters)) entry.filters = p.filters
      if (has(p.outcomes)) entry.outcomes = p.outcomes
      projects[`${exp.company}::${p.project}`] = entry
      if (has(p.video)) videos[`${exp.company}::${p.project}`] = p.video
    })
  })

  // certificates{ title: meta } ← professional_courses.items; conferences{ title: meta } ← conferences.items.
  const certificates: NonNullable<SiteConfig['certificates']> = {}
  ;((res.professional_courses && res.professional_courses.items) || []).forEach((raw) => {
    const it = raw as LearnItem
    certificates[it.title] = metaOf(it)
  })
  const conferences: NonNullable<SiteConfig['conferences']> = {}
  ;((res.conferences && res.conferences.items) || []).forEach((raw) => {
    const it = raw as LearnItem
    conferences[it.title] = metaOf(it)
  })

  return { ...cfg, filters, providers, roleTagLabels, projects, conferences, certificates, videos }
}
