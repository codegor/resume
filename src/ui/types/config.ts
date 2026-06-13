// Shape of config.json (window.SITE_CONFIG → siteConfig()). Permissive: only the
// fields the components read are named; the rest is allowed via index signatures.

export interface FilterDef {
  id: string
  label?: string
  short?: string
  // Pill label for the role tags shown on projects / learn cards (the folded-in
  // roleTagLabels map). Differs from `label` only where the chip wants a tighter
  // form (e.g. "AI/LLM" vs the filter label "AI / LLM").
  roleLabel?: string
  icon?: string
  skillGroups?: string[]
  keywords?: string[]
  [k: string]: unknown
}

export interface TaggedEntry {
  filters?: string[]
  skills?: string[]
  provider?: string
  cert?: boolean
  certUrl?: string
  certImg?: string
  // Offline single-file build inlines the AVIF cert image as a data URI here.
  certImgAvif?: string
  url?: string
  desc?: string
  [k: string]: unknown
}

export interface VideoDef {
  src?: string
  // Lightweight clip the inline preview circle plays; falls back to `src` when unset.
  // The full `src` is only fetched when the enlarged modal opens.
  previewSrc?: string
  poster?: string
  title?: string
  [k: string]: unknown
}

export interface Outcome {
  delta: string
  metric: string
}

export interface ProviderDef {
  logo?: string
  // Offline single-file build inlines the provider-logo AVIF as a data URI here.
  logoAvif?: string
  [k: string]: unknown
}

export interface HeroFact {
  icon?: string
  t?: string
}

export interface HeroStat {
  // 'projects' is computed live (work_experience project count); others read `n`.
  key?: string
  n?: string | number
  plus?: string
  l?: string
}

export interface HeroConfig {
  photo?: string
  // Offline build inlines the portrait AVIF as a data URI here.
  photoAvif?: string
  photoCaption?: string
  facts?: HeroFact[]
  stats?: HeroStat[]
  [k: string]: unknown
}

export interface CtaConfig {
  line?: string
  sub?: string
  [k: string]: unknown
}

/** One serpentine-timeline epoch's layout/colour config (config.json.epochs[period]). */
export interface EpochConfig {
  side?: string
  colorVar?: string
  ghostYear?: string
  era?: string
  // Offline build inlines the era-cloud PNG as a data URI here.
  cloud?: string
  [k: string]: unknown
}

/** A timeline marker (config.json.markers[] + synthesized conference/certificate pins). */
export interface Marker {
  kind?: string
  epoch?: string
  title?: string
  sub?: string
  year?: string
  filters?: string[]
  skills?: string[]
  desc?: string
  url?: string
  [k: string]: unknown
}

export interface Testimonial {
  quote?: string
  name?: string
  role?: string
  link?: string
  [k: string]: unknown
}

export interface SiteConfig {
  resumeUrl?: string
  certPlaceholder?: string
  seo?: { noindex?: boolean }
  contacts?: Record<string, string>
  hero?: HeroConfig
  cta?: CtaConfig
  testimonial?: Testimonial
  filters?: FilterDef[]
  neutralSkillGroups?: string[]
  skillAliases?: Record<string, string>
  // current-trend "must-have" skills → weight (1-5). Drives the bold accent and which
  // "NEW" items get the pill (top-3 by weight). Absent/empty = experience-only grid ranking.
  trendSkills?: Record<string, number>
  // also physically float trend-weighted chips to the top of their skills group (default false).
  trendReorder?: boolean
  roleTagLabels?: Record<string, string>
  providers?: Record<string, ProviderDef>
  projects?: Record<string, { outcomes?: Outcome[]; [k: string]: unknown }>
  conferences?: Record<string, TaggedEntry>
  certificates?: Record<string, TaggedEntry>
  epochs?: Record<string, EpochConfig>
  markers?: Marker[]
  videos?: Record<string, VideoDef>
  [k: string]: unknown
}
