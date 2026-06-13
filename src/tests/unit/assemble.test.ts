// Unit tests for the Step-2 assembler: buildFromTree() must reassemble the authored source
// tree (public/assets/resume/** + the base public/assets/config.json) into a valid FULL résumé
// + config, and the build must write that same data into dist/. Run: `yarn test:unit`.
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { buildFromTree } from '../../../scripts/assemble-resume.mjs'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const assetsDir = resolve(repoRoot, 'public/assets')
const treeDir = join(assetsDir, 'resume')
const { resume, config } = buildFromTree(assetsDir)

// Start of a "MM.YYYY – MM.YYYY" period as a sortable YYYYMM number.
const startKey = (period: string): number => {
  const [mm, yyyy] = String(period).split('–')[0].trim().split('.')
  return Number(yyyy) * 100 + Number(mm)
}
const countJson = (dir: string): number =>
  readdirSync(dir).filter((f) => f.endsWith('.json')).length
const hasConfigJson = (dir: string): boolean =>
  readdirSync(dir, { withFileTypes: true }).some((e) =>
    e.isDirectory() ? hasConfigJson(join(dir, e.name)) : e.name === 'config.json',
  )

describe('assemble-resume / buildFromTree', () => {
  it('assembles a non-empty résumé + config', () => {
    expect(resume.name).toBeTruthy()
    expect(Array.isArray(resume.work_experience)).toBe(true)
    expect(resume.work_experience.length).toBeGreaterThan(0)
    expect(config.epochs && typeof config.epochs).toBe('object')
    expect(Object.keys(config.epochs).length).toBeGreaterThan(0)
  })

  it('orders work_experience newest-first', () => {
    const keys = resume.work_experience.map((w: { period: string }) => startKey(w.period))
    const sortedDesc = [...keys].sort((a, b) => b - a)
    expect(keys).toEqual(sortedDesc)
  })

  it('pairs every work period 1:1 with a config.epochs entry', () => {
    const periods = resume.work_experience.map((w: { period: string }) => w.period).sort()
    expect(Object.keys(config.epochs).sort()).toEqual(periods)
  })

  it('keeps every course / conference item (count matches the tree files)', () => {
    expect(resume.professional_courses.items.length).toBe(countJson(join(treeDir, 'courses')))
    expect(resume.conferences.items.length).toBe(countJson(join(treeDir, 'conferences')))
    expect(resume.professional_courses.items.length).toBeGreaterThan(0)
    expect(resume.conferences.items.length).toBeGreaterThan(0)
  })

  it('preserves the per-project filterable metadata (FirstSport: filters + outcomes + video)', () => {
    const fs = resume.work_experience.find((w: { company: string }) => w.company === 'FirstSport')
    expect(fs).toBeTruthy()
    const proj = fs.projects[0]
    expect(Array.isArray(proj.filters)).toBe(true)
    expect(proj.filters.length).toBeGreaterThan(0)
    expect(Array.isArray(proj.outcomes)).toBe(true)
    expect(proj.video && proj.video.src).toBeTruthy()
  })

  it('moved the role filters + providers onto the résumé', () => {
    expect(Array.isArray(resume.filters)).toBe(true)
    expect(resume.filters.length).toBeGreaterThan(1)
    expect(resume.providers && typeof resume.providers).toBe('object')
  })

  it('the source tree uses NN_*.json (no config.json shells)', () => {
    expect(hasConfigJson(treeDir)).toBe(false)
  })

  it('the base public/assets/config.json holds no epochs (they live in the tree)', () => {
    const base = JSON.parse(readFileSync(join(assetsDir, 'config.json'), 'utf8'))
    expect(base.epochs).toBeUndefined()
  })
})

describe('after build: dist output matches the assembled source', () => {
  const distResume = resolve(repoRoot, 'dist/assets/resume.json')
  const distConfig = resolve(repoRoot, 'dist/assets/config.json')

  it.skipIf(!existsSync(distResume))('dist/assets/resume.json deep-equals buildFromTree()', () => {
    expect(JSON.parse(readFileSync(distResume, 'utf8'))).toEqual(resume)
  })
  it.skipIf(!existsSync(distConfig))('dist/assets/config.json deep-equals buildFromTree()', () => {
    expect(JSON.parse(readFileSync(distConfig, 'utf8'))).toEqual(config)
  })
})
