// Unit tests for the filter logic — the single source of truth for "what belongs to a filter".
import { describe, it, expect, beforeAll } from 'vitest'
import { setSiteConfig } from '../../ui/config'
import { skillMatchesTech, tagsFor, inFilter, projectInFilter } from '../../ui/utils/site-filters'
import type { SiteConfig } from '../../ui/types/config'

beforeAll(() => {
  setSiteConfig({
    filters: [
      { id: 'all', label: 'All' },
      { id: 'backend', label: 'Backend', skillGroups: ['backend'], keywords: ['php', 'symfony'] },
    ],
    skillAliases: { 'vue.js': 'vue', vue: 'vue', 'node.js': 'node', node: 'node' },
    projects: { 'Co::P': { filters: ['backend'] } },
    conferences: { 'Conf Y': { filters: ['backend'], skills: ['PHP'] } },
  } as unknown as SiteConfig)
})

describe('site-filters', () => {
  it('skillMatchesTech is version- and alias-agnostic', () => {
    expect(skillMatchesTech('Vue.js 2.6.14', 'Vue')).toBe(true)
    expect(skillMatchesTech('Symfony 6.4', 'Symfony')).toBe(true)
    expect(skillMatchesTech('Node.js', 'node')).toBe(true)
    expect(skillMatchesTech('React', 'Vue')).toBe(false)
  })

  it('tagsFor returns the tagged filter ids', () => {
    expect(tagsFor('project', 'Co::P')).toEqual(['backend'])
    expect(tagsFor('project', 'missing')).toEqual([])
  })

  it('inFilter respects "all" and the explicit tag', () => {
    expect(inFilter('project', 'Co::P', 'all')).toBe(true)
    expect(inFilter('project', 'Co::P', 'backend')).toBe(true)
    expect(inFilter('conference', 'Conf Y', 'backend')).toBe(true)
    expect(inFilter('project', 'Co::P', 'frontend')).toBe(false)
  })

  it('projectInFilter matches a tagged project', () => {
    expect(projectInFilter('Co::P', [], {}, 'all')).toBe(true)
    expect(projectInFilter('Co::P', [], {}, 'backend')).toBe(true)
  })
})
