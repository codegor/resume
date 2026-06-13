// Unit tests for the localized-data resolver (utils/i18n-data.ts).
import { describe, it, expect } from 'vitest'
import { isLocalizedValue, resolveLocalized, localizeData } from '../../ui/utils/i18n-data'

describe('isLocalizedValue()', () => {
  it('is true for an {en,…} map with only locale-code keys', () => {
    expect(isLocalizedValue({ en: 'Hi', uk: 'Привіт' })).toBe(true)
    expect(isLocalizedValue({ en: 'Hi' })).toBe(true)
    expect(isLocalizedValue({ en: 'Hi', 'pt-BR': 'Oi' })).toBe(true)
  })

  it('is false for a real object that merely has an `en`-named sibling', () => {
    expect(isLocalizedValue({ en: 'Hi', title: 'X' })).toBe(false)
    expect(isLocalizedValue({ uk: 'Привіт' })).toBe(false) // no `en`
    expect(isLocalizedValue({})).toBe(false)
    expect(isLocalizedValue('Hi')).toBe(false)
    expect(isLocalizedValue(['en'])).toBe(false)
    expect(isLocalizedValue(null)).toBe(false)
  })
})

describe('resolveLocalized()', () => {
  it('picks the lang, falls back to en for unknown lang, passes plain values through', () => {
    expect(resolveLocalized({ en: 'Hi', uk: 'Привіт' }, 'uk')).toBe('Привіт')
    expect(resolveLocalized({ en: 'Hi', uk: 'Привіт' }, 'de')).toBe('Hi')
    expect(resolveLocalized('plain', 'uk')).toBe('plain')
  })
})

describe('localizeData()', () => {
  it('resolves nested localized maps and leaves the rest intact', () => {
    const src = {
      name: 'Egor',
      summary: { en: 'Engineer', uk: 'Інженер' },
      nested: { role: { en: 'Lead', uk: 'Лід' }, period: '2023 – 2026' },
    }
    expect(localizeData(src, 'uk')).toEqual({
      name: 'Egor',
      summary: 'Інженер',
      nested: { role: 'Лід', period: '2023 – 2026' },
    })
    expect(localizeData(src, 'en')).toEqual({
      name: 'Egor',
      summary: 'Engineer',
      nested: { role: 'Lead', period: '2023 – 2026' },
    })
  })

  it('handles per-item localized arrays and whole-field localized arrays', () => {
    const perItem = { points: ['plain', { en: 'second', uk: 'другий' }] }
    expect(localizeData(perItem, 'uk')).toEqual({ points: ['plain', 'другий'] })

    const wholeField = { points: { en: ['a', 'b'], uk: ['а', 'б'] } }
    expect(localizeData(wholeField, 'uk')).toEqual({ points: ['а', 'б'] })
  })

  it('does not mutate the input tree (returns a fresh copy)', () => {
    const src = { summary: { en: 'Engineer', uk: 'Інженер' } }
    const out = localizeData(src, 'uk')
    expect(src.summary).toEqual({ en: 'Engineer', uk: 'Інженер' })
    expect(out).not.toBe(src)
  })
})
