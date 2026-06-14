// Unit tests for the i18n composable: phrase-as-key fallback, interpolation, plurals,
// missing-key logging (any lang), and lang switching. Runs in the node env (the module
// guards all DOM/localStorage access), so we test pure logic only.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  t,
  tc,
  lang,
  setLang,
  availableLangs,
  _registerLocaleForTests,
} from '../../ui/composables/i18n'

// Several cases below deliberately look up throwaway phrases (`No. {year}`, `{n} project`) that
// aren't in en.json, so the composable fires its dev-time `[i18n] missing …` console.info. That's
// expected behaviour, not a real missing translation — silence it so it doesn't masquerade as a
// failure in the test output. The one case that actually asserts on the log makes its own spy.
beforeEach(() => {
  lang.value = 'en'
  vi.spyOn(console, 'info').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('t()', () => {
  it('returns the phrase itself for en (identity)', () => {
    expect(t('Show fewer')).toBe('Show fewer')
  })

  it('interpolates {params} and leaves missing params untouched', () => {
    expect(t('No. {year}', { year: 2026 })).toBe('No. 2026')
    expect(t('Hi {name}')).toBe('Hi {name}')
  })

  it('logs console.info once per lang::phrase when a key is missing', () => {
    _registerLocaleForTests('zz', { 'Show fewer': 'Менш' })
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    lang.value = 'zz'
    expect(t('Show fewer')).toBe('Менш') // present → translated, no log
    expect(t('Not translated')).toBe('Not translated') // missing → key + log
    expect(t('Not translated')).toBe('Not translated') // logged again? no (deduped)
    expect(spy).toHaveBeenCalledTimes(1)
    spy.mockRestore()
  })
})

describe('tc()', () => {
  it('picks singular/plural by n for en and injects {n}', () => {
    expect(tc('{n} project', '{n} projects', 1)).toBe('1 project')
    expect(tc('{n} project', '{n} projects', 3)).toBe('3 projects')
  })

  it('uses pipe-separated forms via Intl.PluralRules for a 3-form locale', () => {
    _registerLocaleForTests('uk', { '{n} projects': '{n} проєкт|{n} проєкти|{n} проєктів' }, [
      'one',
      'few',
      'many',
    ])
    lang.value = 'uk'
    expect(tc('{n} project', '{n} projects', 1)).toBe('1 проєкт') // one
    expect(tc('{n} project', '{n} projects', 3)).toBe('3 проєкти') // few
    expect(tc('{n} project', '{n} projects', 5)).toBe('5 проєктів') // many
  })
})

describe('setLang()', () => {
  it('ignores unregistered languages', () => {
    setLang('xx')
    expect(lang.value).toBe('en')
  })

  it('switches to a registered language', () => {
    _registerLocaleForTests('zz', {})
    expect(availableLangs()).toContain('zz')
    setLang('zz')
    expect(lang.value).toBe('zz')
  })
})
