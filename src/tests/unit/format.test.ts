// Unit tests for the small pure formatting helpers.
import { describe, it, expect } from 'vitest'
import { slugify, langLevelPct, roleLabelsFor } from '../../ui/utils/format'
import { setSiteConfig } from '../../ui/config'
import type { SiteConfig } from '../../ui/types/config'

describe('format', () => {
  it('slugify lowercases and dash-collapses', () => {
    expect(slugify('AI / LLM')).toBe('ai-llm')
    expect(slugify('  Hello, World!  ')).toBe('hello-world')
    expect(slugify('searadar.com')).toBe('searadar-com')
  })

  it('langLevelPct maps levels to bar widths', () => {
    expect(langLevelPct('Mastery level')).toBe(100)
    expect(langLevelPct('Native')).toBe(100)
    expect(langLevelPct('Advanced level')).toBe(86)
    expect(langLevelPct('Upper Intermediate')).toBe(72)
    expect(langLevelPct('Intermediate')).toBe(58)
  })

  it('roleLabelsFor maps filter ids via roleTagLabels (drops unknowns)', () => {
    setSiteConfig({ roleTagLabels: { ai: 'AI/LLM', backend: 'Back-end' } } as unknown as SiteConfig)
    expect(roleLabelsFor(['ai', 'backend', 'unknown'])).toEqual(['AI/LLM', 'Back-end'])
    expect(roleLabelsFor(undefined)).toEqual([])
  })
})
