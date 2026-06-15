// Unit tests for the Step-1 runtime adapter: buildDerivedConfig() rebuilds the old
// config-shaped lookup maps from resume.json so the ~12 consumers stay unchanged.
import { describe, it, expect } from 'vitest'
import { buildDerivedConfig } from '../../ui/utils/site-data'
import type { SiteConfig } from '../../ui/types/config'
import type { ResumeData } from '../../ui/types/resume'

const cfg = {
  contacts: { email: 'x@y.z' },
  epochs: { '01.2020 – 02.2021': { era: 'E' } },
  videos: { intro: { src: 'intro.mp4' } },
} as unknown as SiteConfig

const res = {
  filters: [
    { id: 'all', label: 'All' },
    { id: 'ai', label: 'AI / LLM', roleLabel: 'AI/LLM', skillGroups: ['agent_development'] },
    { id: 'backend', label: 'Backend', roleLabel: 'Backend', skillGroups: ['back_end'] },
  ],
  providers: { fwdays: { logo: 'fw.png' } },
  skills: {},
  work_experience: [
    {
      company: 'FirstSport',
      projects: [
        {
          project: 'Stats',
          filters: ['ai', 'backend'],
          outcomes: [{ delta: '4s → 1s', metric: 'load' }],
          video: { src: 'fs.mp4', previewSrc: 'fs_p.mp4' },
        },
      ],
    },
  ],
  professional_courses: {
    provider: 'fwdays',
    items: [{ title: 'Course X', filters: ['ai'], skills: ['LLM'], cert: true, certImg: 'x.jpg' }],
  },
  conferences: {
    provider: 'fwdays',
    items: [{ title: 'Conf Y', filters: ['backend'], url: 'u', desc: 'd', skills: ['PHP'] }],
  },
} as unknown as ResumeData

const d = buildDerivedConfig(cfg, res)

describe('buildDerivedConfig', () => {
  it('carries filters + providers over from the résumé', () => {
    expect(d.filters).toBe(res.filters)
    expect(d.providers).toBe(res.providers)
  })

  it('reconstructs roleTagLabels from filters[].roleLabel (skips "all")', () => {
    expect(d.roleTagLabels).toEqual({ ai: 'AI/LLM', backend: 'Backend' })
  })

  it('builds the projects map keyed by "Company::project" with filters + outcomes', () => {
    expect(d.projects?.['FirstSport::Stats'].filters).toEqual(['ai', 'backend'])
    expect(d.projects?.['FirstSport::Stats'].outcomes).toEqual([
      { delta: '4s → 1s', metric: 'load' },
    ])
  })

  it('merges per-project video into the videos map and keeps the config intro', () => {
    expect(d.videos?.intro).toEqual({ src: 'intro.mp4' })
    expect(d.videos?.['FirstSport::Stats']).toEqual({ src: 'fs.mp4', previewSrc: 'fs_p.mp4' })
  })

  it('builds the certificates map from professional_courses.items by title', () => {
    expect(d.certificates?.['Course X']).toMatchObject({
      filters: ['ai'],
      skills: ['LLM'],
      cert: true,
      certImg: 'x.jpg',
    })
  })

  it('builds the conferences map from conferences.items by title', () => {
    expect(d.conferences?.['Conf Y']).toMatchObject({
      filters: ['backend'],
      url: 'u',
      desc: 'd',
      skills: ['PHP'],
    })
  })

  it('keeps the untouched config chrome (contacts, epochs)', () => {
    expect(d.contacts).toEqual({ email: 'x@y.z' })
    expect(d.epochs).toEqual({ '01.2020 – 02.2021': { era: 'E' } })
  })
})
