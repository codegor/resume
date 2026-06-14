// The reactive app store (theme, compact view, filters, active skill, modals,
// print). Ported from v-app.js. Provided once in App.vue and consumed via
// useStore(); also a module singleton so utilities can reach it if needed.
import { reactive, nextTick, inject, type InjectionKey } from 'vue'
import type { ResumeData } from '@/types/resume'
import { siteConfig } from '@/config'
import { techIsSkill } from '@/utils/site-filters'
import { downloadResumeMarkdown } from '@/utils/md-export'
import { scrollToId, scrollToActiveSkillGroup, toast, loadAllImages } from '@/utils/dom'
import { t } from '@/composables/i18n'

export const store = reactive({
  data: null as ResumeData | null,
  ready: false,
  err: null as string | null,
  updated: null as string | null,
  theme: localStorage.getItem('resume-theme') || 'light',
  compact: localStorage.getItem('resume-compact') === 'on',
  expandAll: false,
  expandTick: 0,
  recentOnly: localStorage.getItem('resume-recent') === 'on',
  activeFilter: 'all',
  activeSkill: null as string | null,
  skillQuery: '',
  videoKey: null as string | null,
  guideOpen: false,
  // Which top-bar dropdown is open ('download' | 'contact' | null). Shared so the two
  // are mutually exclusive — opening one closes the other (each menu derives its open
  // state from this), even though their wrappers stop click propagation.
  openMenu: null as string | null,
  printing: false,
  // mobile only: true while the on-page view switches have scrolled out of view (the Focus
  // bar has taken the sticky slot) — the ⓘ menu mirrors them while this is set. Transient
  // scroll state, driven by the controller in App.vue; not persisted.
  switchesInMenu: false,
  // mobile (≤980px): Focus bar expanded? driven by the scroll controller in App.vue; not persisted
  focusOpen: true,
  // ≤980px mobile shell; kept fresh by a matchMedia listener in App.vue
  isMobile: window.matchMedia('(max-width: 980px)').matches,

  setFilter(id: string) {
    this.activeFilter = id
    this.activeSkill = null
  },
  setSkill(name: string | null) {
    this.activeSkill = name
  },
  setFocusOpen(v: boolean) {
    this.focusOpen = v
  },
  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark'
  },
  toggleCompact() {
    this.compact = !this.compact
    this.recentOnly = this.compact
  },
  toggleExpandAll() {
    this.expandAll = !this.expandAll
    this.expandTick++
  },
  /* a card collapsed by hand → drop the "Expand all" toggle (without collapsing the
     others); clicking Expand all again re-broadcasts "open everything". */
  noteCollapsed() {
    if (this.expandAll) this.expandAll = false
  },
  toggleRecentOnly() {
    this.recentOnly = !this.recentOnly
  },
  /* a work period ("02.2023 – 05.2026") counts as recent if it ENDS within the last
     5 years — drives the "Recent · 5y" view. The window is anchored on the résumé's
     last-update date (`data.updated`), not the wall clock, so the cut-off stays stable
     and matches the dates printed on the page. */
  isRecentPeriod(period: string): boolean {
    const ys = String(period || '').match(/\d{4}/g)
    if (!ys) return true
    const endY = Math.max.apply(null, ys.map(Number))
    const ref = String(this.data?.updated || '').match(/\d{4}/)
    const refY = ref ? Number(ref[0]) : new Date().getFullYear()
    return endY >= refY - 5
  },
  async print() {
    this.printing = true
    // wait for the expanded layout to render, then make sure every card/photo image
    // has actually loaded before printing — else the print/PDF paints blank boxes
    // for the lazy images that were below the fold or just revealed.
    await nextTick()
    await loadAllImages()
    window.print()
  },
  exportMd() {
    if (this.data) downloadResumeMarkdown(this.data, siteConfig(), this.updated)
  },
  clearAll() {
    this.activeFilter = 'all'
    this.activeSkill = null
    this.recentOnly = false
    this.skillQuery = ''
  },
  /* clear only what the mobile rail's ✕ advertises + counts — the focus filter, skill highlight
     and skill search — and NOT the Recent·5y view, which it neither shows nor badges. (clearAll
     additionally resets recentOnly, so don't use it for that button.) */
  clearFilters() {
    this.activeFilter = 'all'
    this.activeSkill = null
    this.skillQuery = ''
  },
  openVideo(k: string) {
    this.videoKey = k
  },
  closeVideo() {
    this.videoKey = null
  },
  openGuide() {
    this.guideOpen = true
  },
  closeGuide() {
    this.guideOpen = false
  },
  // top-bar dropdowns: toggle one open (closing whichever other was open), or close all.
  toggleMenu(name: string) {
    this.openMenu = this.openMenu === name ? null : name
  },
  closeMenus() {
    this.openMenu = null
  },
  onSkillClick(name: string) {
    this.activeSkill =
      this.activeSkill && this.activeSkill.toLowerCase() === name.toLowerCase() ? null : name
    setTimeout(() => scrollToId('timeline'), 60)
  },
  onTechClick(tech: string) {
    const same = this.activeSkill && this.activeSkill.toLowerCase() === tech.toLowerCase()
    this.activeSkill = same ? null : tech
    if (same) return
    const isSkill = techIsSkill(tech, this.data && this.data.skills)
    if (isSkill) {
      toast(t('Highlighting “{tech}” across skills & projects', { tech }))
      setTimeout(scrollToActiveSkillGroup, 60)
    } else {
      toast(t('Filtering everything by “{tech}”', { tech }))
      setTimeout(() => scrollToId('timeline'), 60)
    }
  },
})

export type Store = typeof store

export const storeKey: InjectionKey<Store> = Symbol('store')

export function useStore(): Store {
  return inject(storeKey, store)
}
