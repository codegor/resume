<template>
  <div v-if="store.err" class="loading">
    <t :params="{ err: store.err }">Couldn't load data — {err}</t>
  </div>
  <div v-else-if="!store.ready" class="loading"><t>Loading résumé…</t></div>
  <template v-else>
    <top-bar />
    <!-- Mobile only: the view switches live in their own sticky bar (on desktop they stay
         inline in the top bar). As you scroll, the Focus bar slides up and covers this bar
         (handoff); while it's covered the switches are mirrored into the ⓘ menu. -->
    <div class="switches-bar">
      <div class="wrap"><view-toggles /></div>
    </div>
    <hero />
    <div class="wrap cta-top"><cta /></div>
    <filter-bar />
    <skill-banner />
    <skills />
    <timeline />
    <how-i-work />
    <testimonial />
    <certificates />
    <edu-lang-section />
    <app-footer />
    <section-nav />
    <toast />
    <video-modal v-if="store.videoKey != null" :video-key="store.videoKey" />
    <guide-modal v-if="store.guideOpen" />
    <reveal-notice />
  </template>
</template>

<script setup lang="ts">
import { watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useStore } from '@/composables/useStore'
import { setSiteConfig } from '@/config'
import { buildDerivedConfig } from '@/utils/site-data'
import { loadAllImages } from '@/utils/dom'
import { printFileName } from '@/utils/offline-name'
// `t` is aliased to $t because this SFC's template uses the <t> component — a `t`
// script binding would shadow the tag.
import { lang, t as $t } from '@/composables/i18n'
import { localizeData } from '@/utils/i18n-data'
import type { SiteConfig } from '@/types/config'
import type { ResumeData } from '@/types/resume'

const store = useStore()

// theme/compact attributes set ASAP so the first paint is correct
document.documentElement.setAttribute('data-theme', store.theme)
document.documentElement.setAttribute('data-compact', store.compact ? 'on' : 'off')

window.__openVideo = (k: string) => store.openVideo(k)

let prevTheme: string | null = null
// non-null ⇄ the print theme+title swap is applied; doubles as the idempotency guard for the
// several print signals below (so they don't re-apply or clobber the saved prevTitle)
let prevTitle: string | null = null
function enterPrint(): void {
  store.printing = true
  loadAllImages() // force lazy/below-fold images to load so the PDF doesn't paint blank boxes
  if (prevTitle !== null) return
  prevTheme = document.documentElement.getAttribute('data-theme')
  document.documentElement.setAttribute('data-theme', 'light')
  // PDF "Save as" filename via document.title (works on Android; Windows blanks it regardless)
  prevTitle = document.title
  document.title = printFileName(store.data?.name, store.data?.updated)
}
function exitPrint(): void {
  store.printing = false
  if (prevTitle === null) return
  if (prevTheme) document.documentElement.setAttribute('data-theme', prevTheme)
  document.title = prevTitle
  prevTitle = null
  prevTheme = null
}
// `afterprint` is unreliable (Windows "Microsoft Print to PDF" and Escape-cancel skip it), which
// would leave store.printing stuck true — so also exit on the print-media change AND on regaining
// focus/visibility. enter/exitPrint are idempotent (prevTitle guard), so overlapping signals are safe.
// (Listeners are wired in onMounted / torn down in onBeforeUnmount below.)
const printMq = window.matchMedia('print')
function resetIfNotPrinting(): void {
  if (store.printing && !printMq.matches) exitPrint()
}
function onPrintMqChange(e: MediaQueryListEvent): void {
  if (e.matches) enterPrint()
  else exitPrint()
}
function onVisibilityChange(): void {
  if (document.visibilityState === 'visible') resetIfNotPrinting()
}

interface Loaded<T> {
  j: T
  lm: string | null
}
function getJSON<T>(url: string): Promise<Loaded<T>> {
  const u = (window.__resources && window.__resources[url]) || url
  return fetch(u).then((r) => {
    if (!r.ok) throw new Error(`${url}: ${r.status}`)
    return r.json().then((j: T) => ({ j, lm: r.headers.get('last-modified') }))
  })
}
function loadJSON<T>(id: string, url: string): Promise<Loaded<T>> {
  const el = document.getElementById(id)
  if (el && el.textContent && el.textContent.trim()) {
    try {
      return Promise.resolve({ j: JSON.parse(el.textContent) as T, lm: null })
    } catch {
      /* malformed inline JSON → fall through to fetch */
    }
  }
  return getJSON<T>(url)
}

/* Keep the document <title> language-aware (the static index.html title is the en
   pre-paint default). Mirrors "{name} — Résumé". */
function applyI18nMeta(res: ResumeData): void {
  const name = (res && res.name) || ''
  document.title = (name ? name + ' — ' : '') + $t('Résumé')
}

/* config.json → seo.noindex: ask search engines & AI crawlers to skip this page. */
function applySeo(cfg: SiteConfig): void {
  const seo = cfg.seo || {}
  document.querySelectorAll('meta[data-seo]').forEach((m) => m.remove())
  if (!seo.noindex) return
  const tags: Array<[string, string]> = [
    ['robots', 'noindex, nofollow, noarchive, noimageindex, nosnippet'],
    ['robots', 'noai, noimageai'],
    ['googlebot', 'noindex, nofollow'],
    ['bingbot', 'noindex, nofollow'],
  ]
  tags.forEach(([name, content]) => {
    const m = document.createElement('meta')
    m.name = name
    m.content = content
    m.setAttribute('data-seo', '1')
    document.head.appendChild(m)
  })
}

// Safety-net delay before force-revealing every section: if the IntersectionObserver
// hasn't fired for content already in view by now (e.g. above-the-fold on load), reveal
// it anyway so nothing stays stuck hidden.
const REVEAL_FALLBACK_MS = 1100

function reveal(el: HTMLElement): void {
  el.style.opacity = '1'
  el.style.transform = 'none'
}
function setupReveal(): void {
  const els = document.querySelectorAll<HTMLElement>('.reveal-up, .reveal, .reveal-section')
  if (window.IntersectionObserver) {
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            reveal(e.target as HTMLElement)
            io.unobserve(e.target)
          }
        }),
      { threshold: 0, rootMargin: '0px 0px -10% 0px' },
    )
    els.forEach((el) => io.observe(el))
  } else els.forEach(reveal)
  setTimeout(() => {
    const secs = [...document.querySelectorAll<HTMLElement>('.reveal-section')]
    secs.forEach((el, i) => setTimeout(() => reveal(el), i * 200))
    setTimeout(
      () => document.querySelectorAll<HTMLElement>('.reveal-up').forEach(reveal),
      secs.length * 200 + 150,
    )
  }, REVEAL_FALLBACK_MS)
}
function revealNew(): void {
  nextTick(() => {
    document.querySelectorAll<HTMLElement>('.reveal-up, .reveal-section').forEach(reveal)
  })
}

// Mobile (≤980px) scroll controller: collapses the Focus bar to its rail once it sticks to the top
// (store.focusOpen) and mirrors the view switches into the ⓘ menu while they're covered
// (store.switchesInMenu). Forced to desktop values above 980px.
const TOPBAR_H = 60
const mqMobile = window.matchMedia('(max-width: 980px)')
let switchesRaf = 0
// has the Focus bar reached its sticky top? drives BOTH the rail collapse and the switches hand-off
let stuck = false
function applyMobile(): void {
  store.isMobile = mqMobile.matches
  if (!mqMobile.matches) store.focusOpen = true // desktop always renders the full Focus bar
}
function syncSwitchesMenu(): void {
  switchesRaf = 0
  if (!store.isMobile) {
    store.switchesInMenu = false
    store.focusOpen = true
    stuck = false
    return
  }
  const fb = document.getElementById('filterbar')
  if (!fb) return
  const top = fb.getBoundingClientRect().top
  // hysteresis dead-band so sub-pixel jitter at the line can't flip the state every frame; the
  // collapse not nudging scrollY (overflow-anchor:none in _base.scss) is what stops it oscillating
  if (top <= TOPBAR_H) stuck = true
  else if (top >= TOPBAR_H + 16) stuck = false
  // don't collapse the Focus bar while the search input is focused — it lives only in the expanded
  // bar, so collapsing would yank it out mid-keystroke (FilterBar relies on this)
  const ae = document.activeElement
  const typingSearch = ae instanceof HTMLElement && !!ae.closest('.fb-search')
  if (store.focusOpen) {
    if (stuck && !typingSearch) store.focusOpen = false
  } else if (!stuck) {
    store.focusOpen = true
  }
  // the switches bar is covered the whole time the Focus bar is stuck — independent of whether the
  // bar is held open (funnel tap / typing) — so mirror the switches into the ⓘ menu while stuck
  store.switchesInMenu = stuck
}
function onSwitchesScroll(): void {
  if (!switchesRaf) switchesRaf = requestAnimationFrame(syncSwitchesMenu)
}
function onMqChange(): void {
  applyMobile()
  syncSwitchesMenu()
}
onMounted(() => {
  window.addEventListener('scroll', onSwitchesScroll, { passive: true })
  window.addEventListener('resize', onSwitchesScroll)
  mqMobile.addEventListener('change', onMqChange)
  window.addEventListener('beforeprint', enterPrint)
  window.addEventListener('afterprint', exitPrint)
  printMq.addEventListener?.('change', onPrintMqChange)
  window.addEventListener('focus', resetIfNotPrinting)
  document.addEventListener('visibilitychange', onVisibilityChange)
  applyMobile()
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onSwitchesScroll)
  window.removeEventListener('resize', onSwitchesScroll)
  mqMobile.removeEventListener('change', onMqChange)
  window.removeEventListener('beforeprint', enterPrint)
  window.removeEventListener('afterprint', exitPrint)
  printMq.removeEventListener?.('change', onPrintMqChange)
  window.removeEventListener('focus', resetIfNotPrinting)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  if (switchesRaf) cancelAnimationFrame(switchesRaf)
})

watch(
  () => store.theme,
  (v) => {
    document.documentElement.setAttribute('data-theme', v)
    localStorage.setItem('resume-theme', v)
  },
)
watch(
  () => store.compact,
  (v) => {
    document.documentElement.setAttribute('data-compact', v ? 'on' : 'off')
    localStorage.setItem('resume-compact', v ? 'on' : 'off')
    // sections/skill-groups that (re)appear when leaving Headlines mount with `reveal-up`
    // (opacity:0); the mount-time IntersectionObserver won't re-observe them, so force-reveal
    // — else they'd stay invisible and leave empty space.
    revealNew()
  },
)
watch(
  () => store.recentOnly,
  (v, old) => {
    localStorage.setItem('resume-recent', v ? 'on' : 'off')
    revealNew()
    // GLOBAL: any time Recent·5y switches OFF — the toggle, the "+N earlier eras — show all" pill,
    // clearAll(), anywhere — show the "now showing everything" notice (not just the toggle button).
    if (old && !v) store.revealNotice = 'recent'
  },
)
// Engaging a focus filter, a skill highlight, or a search means the user wants to SEE results —
// drop Headlines (which hides the timeline & compacts skills) but KEEP Recent·5y. Centralised
// here so it fires no matter how the state was set (chip, skill chip, tech tag, search input).
watch(
  () => [store.activeFilter, store.activeSkill, store.skillQuery],
  () => {
    const active = store.activeFilter !== 'all' || !!store.activeSkill || !!store.skillQuery.trim()
    if (store.compact && active) store.compact = false
  },
)
watch(
  () => store.ready,
  (v) => {
    if (v)
      nextTick(() => {
        setupReveal()
        syncSwitchesMenu()
      })
  },
)
watch(
  () => store.activeFilter,
  () => revealNew(),
)
watch(
  () => store.activeSkill,
  () => revealNew(),
)

// Pristine (un-localized) copies of the fetched JSON; localized values ({en,uk,…}) are
// resolved to the active language on load and again whenever `lang` changes.
let pristineCfg: unknown = null
let pristineRes: unknown = null

function applyLocalizedData(): void {
  if (pristineCfg == null || pristineRes == null) return
  const cfg = localizeData<SiteConfig>(pristineCfg, lang.value)
  const res = localizeData<ResumeData>(pristineRes, lang.value)
  // Live-résumé URL (globe icon / mobile menu / print / .md) can be retargeted at
  // build time via VITE_RESUME_URL (e.g. http://resume.local for a dev/staging
  // build); unset → keep config.json's resumeUrl. Mirrors the VITE_MEDIA_BASE_URL switch.
  const envResumeUrl = import.meta.env.VITE_RESUME_URL
  if (envResumeUrl) cfg.resumeUrl = envResumeUrl
  // Step-1 migration: the filterable metadata now lives in resume.json; rebuild
  // the same-shaped lookup maps onto the config so all consumers stay unchanged.
  setSiteConfig(buildDerivedConfig(cfg, res))
  applySeo(cfg)
  applyI18nMeta(res)
  store.data = res
}

Promise.all([
  loadJSON<SiteConfig>('__inline_config', 'assets/config.json'),
  loadJSON<ResumeData>('__inline_resume', 'assets/resume.json'),
])
  .then(([cfg, res]) => {
    pristineCfg = cfg.j
    pristineRes = res.j
    if (res.lm) store.updated = res.lm
    applyLocalizedData()
    store.ready = true
  })
  .catch((e) => {
    store.err = String(e)
  })

// re-resolve data + refresh reveal animations when the language changes
watch(lang, () => {
  applyLocalizedData()
  revealNew()
})
</script>
