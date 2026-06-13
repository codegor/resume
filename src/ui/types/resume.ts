// Shape of assets/resume.json (store.data). Permissive by design — the résumé
// content evolves freely; we type the fields the app actually reads.
import type { FilterDef, ProviderDef, VideoDef, Outcome } from '@/types/config'

export interface SkillItem {
  name: string
  experience?: string
  details?: SkillEntry[]
  components?: SkillEntry[]
  sub?: string
  [k: string]: unknown
}
export type SkillEntry = string | SkillItem

export interface SkillGroup {
  title?: string
  experience?: string
  items?: SkillEntry[]
  tools?: SkillEntry[]
  highlights?: SkillEntry[]
  [k: string]: unknown
}

export type Skills = {
  note?: string
} & Record<string, SkillGroup | SkillEntry[] | string | undefined>

export interface Project {
  project: string
  role?: string
  client?: string
  team?: string
  period?: string
  responsibility?: string
  description?: string
  key_achievements?: string[]
  technologies?: string[]
  // Step-1 migration: filter tags, measured outcomes and the intro video moved
  // here from config.json (previously joined by a "Company::project" key).
  filters?: string[]
  outcomes?: Outcome[]
  video?: VideoDef
  [k: string]: unknown
}

/** A professional_courses / conferences item: display fields (title/date/…) plus
 *  the filter / skill / certificate meta moved here from config.json in Step 1. */
export interface LearnItem {
  title: string
  year?: string
  date?: string
  status?: string
  certificate?: boolean
  pin?: number
  location?: string
  // moved from config.json (config.{certificates,conferences}[title]):
  filters?: string[]
  skills?: string[]
  provider?: string
  cert?: boolean
  certImg?: string
  certImgAvif?: string
  certUrl?: string
  url?: string
  desc?: string
  [k: string]: unknown
}

export interface WorkExperience {
  company: string
  period?: string
  duration?: string
  type?: string
  location?: string
  summary?: string
  projects?: Project[]
  [k: string]: unknown
}

/** Hero Q&A aside (answer supports *em* / **strong** emphasis). */
export interface ShortInterview {
  question: string
  answer: string
}

/** The "How I work" principle section (lead supports *em* / **strong** emphasis). */
export interface HowIWorkPoint {
  title: string
  desc?: string
}
export interface HowIWork {
  label?: string
  title: string
  lead?: string
  points?: HowIWorkPoint[]
}

export interface EducationItem {
  institution: string
  period?: string
  degree?: string
  specialty?: string
  honors?: string
  additional?: string[]
  [k: string]: unknown
}

export interface LanguageItem {
  language: string
  level: string
  [k: string]: unknown
}

export interface ResumeData {
  name: string
  updated?: string
  contacts?: Record<string, string>
  experience_years?: number | string
  summary?: string
  tagline?: string
  about_me?: { short_interview?: ShortInterview } & Record<string, unknown>
  how_i_work?: HowIWork
  skills: Skills
  // Step-1 migration: the role filters + provider logos moved here from config.json.
  filters?: FilterDef[]
  providers?: Record<string, ProviderDef>
  work_experience?: WorkExperience[]
  education?: EducationItem[]
  professional_courses?: { provider?: string; items?: LearnItem[] }
  conferences?: { provider?: string; items?: LearnItem[] }
  languages?: LanguageItem[]
  other_skills?: string[]
  [k: string]: unknown
}
