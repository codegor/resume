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
  </template>
</template>

<script setup lang="ts">
import { watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useStore } from '@/composables/useStore'
import { setSiteConfig } from '@/config'
import { buildDerivedConfig } from '@/utils/site-data'
import { loadAllImages } from '@/utils/dom'
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
window.addEventListener('beforeprint', () => {
  store.printing = true
  // Card/photo images load lazily while browsing; force the just-expanded + below-fold
  // ones to load so the print/PDF paints them instead of blank boxes. (The app's own
  // "Print / Save as PDF" button awaits this first via store.print(); on a raw Ctrl+P
  // this is best-effort alongside the browser's own print-time lazy-load.)
  loadAllImages()
  prevTheme = document.documentElement.getAttribute('data-theme')
  document.documentElement.setAttribute('data-theme', 'light')
})
window.addEventListener('afterprint', () => {
  store.printing = false
  if (prevTheme) document.documentElement.setAttribute('data-theme', prevTheme)
})

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

// Mobile only: mirror the view switches into the ⓘ menu while they're scrolled out of view.
// The visual handoff (the Focus bar covering the sticky .switches-bar) is pure CSS; this just
// flips store.switchesInMenu when the Focus bar has reached the top slot. rAF-throttled like
// SectionNav. The flag is forced off on desktop so the menu never mirrors there.
const TOPBAR_H = 60
let switchesRaf = 0
function syncSwitchesMenu(): void {
  switchesRaf = 0
  if (window.innerWidth > 820) {
    store.switchesInMenu = false
    return
  }
  const fb = document.getElementById('filterbar')
  store.switchesInMenu = !!(fb && fb.getBoundingClientRect().top <= TOPBAR_H + 1)
}
function onSwitchesScroll(): void {
  if (!switchesRaf) switchesRaf = requestAnimationFrame(syncSwitchesMenu)
}
onMounted(() => {
  window.addEventListener('scroll', onSwitchesScroll, { passive: true })
  window.addEventListener('resize', onSwitchesScroll)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onSwitchesScroll)
  window.removeEventListener('resize', onSwitchesScroll)
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
  },
)
watch(
  () => store.recentOnly,
  (v) => {
    localStorage.setItem('resume-recent', v ? 'on' : 'off')
    revealNew()
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
