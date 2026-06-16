// Small shared DOM helpers (ported from the window.* helpers in v-app.js / v-core.js).
import { siteConfig } from '@/config'

// Height reserved at the top of the viewport for the sticky top bar, so an anchored
// scroll target isn't hidden underneath it.
const STICKY_TOPBAR_OFFSET = 110

// Only one self-correcting scroll runs at a time; a newer one cancels the previous synchronously.
let activeScrollCancel: (() => void) | null = null

/** Abort any in-flight scroll self-correction (a newer jump or a user-chosen scroll supersedes it). */
export function cancelScrollCorrection(): void {
  activeScrollCancel?.()
}

/** Center an element in the viewport. The shared "show fewer / less" behaviour: collapsing a long
 *  list jumps the page, so every more/less toggle (MorePill + the inline skill/tech "+N more"
 *  buttons) re-centres on the toggle afterwards, returning the reader to where they were. */
export function scrollElToCenter(el: Element): void {
  const r = el.getBoundingClientRect()
  const y = r.top + window.scrollY - window.innerHeight / 2 + r.height / 2
  window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
}

// Re-assert after the scroll settles: the mobile Focus bar collapses as the page crosses its home,
// shifting everything below it ~200px mid-scroll, so a one-shot scrollTo lands off. Converges in
// 1–2 hops, no-op when nothing shifts. (Removing the re-assert breaks the section-nav jumps.)
// The loop self-cancels on a newer scrollToEl or any real user scroll/keypress, so its ~10s window
// can't yank the page back to a stale target after the user has moved on. Programmatic scrolls
// (window.scrollBy/scrollTo) don't fire wheel/touch/keydown, so the correction still runs normally.
function scrollToEl(el: HTMLElement): void {
  cancelScrollCorrection()
  let alive = true
  const go = (): void => {
    const delta = Math.round(el.getBoundingClientRect().top) - STICKY_TOPBAR_OFFSET
    window.scrollTo({ top: window.scrollY + delta, behavior: 'smooth' })
  }
  const cancel = (): void => {
    if (!alive) return
    alive = false
    window.removeEventListener('wheel', cancel)
    window.removeEventListener('touchmove', cancel)
    window.removeEventListener('keydown', cancel)
    if (activeScrollCancel === cancel) activeScrollCancel = null
  }
  activeScrollCancel = cancel
  window.addEventListener('wheel', cancel, { passive: true })
  window.addEventListener('touchmove', cancel, { passive: true })
  window.addEventListener('keydown', cancel)

  go()
  let tries = 0
  let lastY = NaN
  let stable = 0
  let frames = 0
  const watch = (): void => {
    if (!alive) return
    if (frames++ > 600) return cancel() // hard stop (~10s) so a continuously-scrolling user can't pin this
    const y = Math.round(window.scrollY)
    if (y === lastY) {
      stable += 1
    } else {
      stable = 0
      lastY = y
    }
    if (stable >= 4) {
      const delta = Math.round(el.getBoundingClientRect().top) - STICKY_TOPBAR_OFFSET
      if (Math.abs(delta) > 3 && tries < 5) {
        tries += 1
        stable = 0
        lastY = NaN
        go()
      } else {
        return cancel() // landed within tolerance (or gave up after a few corrections)
      }
    }
    requestAnimationFrame(watch)
  }
  requestAnimationFrame(watch)
}

/** Smooth-scroll to an element id, leaving room for the sticky top bar. */
export function scrollToId(id: string): void {
  const el = document.getElementById(id)
  if (el) scrollToEl(el)
}

/**
 * Scroll to the skill group (Backend, DevOps, …) containing the active
 * (highlighted) skill chip — the first one in DOM order, i.e. where the skill
 * appears first. Falls back to the Skills section header when no highlighted
 * chip is rendered/visible (group hidden by search/filter, or the chip is
 * collapsed behind "+N more" in the Recent·5y view).
 */
export function scrollToActiveSkillGroup(): void {
  const chip = document.querySelector<HTMLElement>('#skills .skill.active')
  const target = chip?.closest<HTMLElement>('.skillgroup') ?? null
  if (target && target.offsetParent !== null) scrollToEl(target)
  else scrollToId('skills')
}

/**
 * True inside the offline single-file build, detected by the inlined `#__inline_config`
 * script that build injects (same tag the data loader keys off).
 */
function isOfflineBuild(): boolean {
  const el = typeof document !== 'undefined' ? document.getElementById('__inline_config') : null
  return !!(el && el.textContent && el.textContent.trim())
}

/**
 * Where the top-bar brand / hero name / portrait link. On the hosted site you're already
 * "home" → scroll to the top of the page (#top). The offline single-file copy (email/PDF)
 * has no web page to be on, so it bridges to the live résumé instead — `resumeUrl`
 * (env-overridable at build time via VITE_RESUME_URL).
 */
export function siteHomeUrl(): string {
  return isOfflineBuild() ? siteConfig().resumeUrl || '#top' : '#top'
}

/**
 * Absolute URL of the live, interactive résumé. Unlike `siteHomeUrl()` (which scrolls to
 * `#top` on the hosted build), this ALWAYS returns the canonical online address — used by the
 * print-only "… on interactive online" links and the footer promo so a PDF/offline copy points
 * the reader back to the live site.
 */
export function onlineResumeUrl(): string {
  return siteConfig().resumeUrl || '#top'
}

/**
 * Click handler for the brand / hero name / portrait "home" links.
 * Offline build → do nothing, let the anchor navigate to the live résumé (resumeUrl).
 * Online → smooth-scroll to the top WITHOUT pushing a `#top` hash onto the URL,
 * and strip an existing hash so the address bar goes clean.
 */
export function goHome(e: MouseEvent): void {
  // respect new-tab / modified clicks — let the browser handle them
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
  if (isOfflineBuild()) return
  e.preventDefault()
  cancelScrollCorrection() // a lingering section re-assert must not yank us back off the top
  window.scrollTo({ top: 0, behavior: 'smooth' })
  if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search)
  }
}

/** Show a toast if the Toast component has registered its setter. */
export function toast(msg: string): void {
  if (window.__toast) window.__toast(msg)
}

/**
 * Force every not-yet-loaded <img> — lazy ones below the fold, and ones just
 * revealed by the print expansion (`store.printing`) — to load + decode, so the
 * print/PDF paints them instead of blank boxes. (SmartImg marks card images
 * `loading="lazy"` for browsing perf; a print fired right after expanding the
 * cards would otherwise capture them unloaded.) Resolves once all settle or
 * `timeoutMs` elapses, whichever comes first, so printing is never blocked.
 */
export async function loadAllImages(timeoutMs = 4000): Promise<void> {
  const imgs = Array.from(document.images).filter((im) => !im.complete)
  if (!imgs.length) return
  imgs.forEach((im) => {
    try {
      im.loading = 'eager'
    } catch {
      /* `loading` is read-only on very old engines — ignore */
    }
  })
  await Promise.race([
    Promise.all(imgs.map((im) => im.decode().catch(() => undefined))),
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ])
}

/**
 * Absolute URL for a runtime asset path (e.g. "assets/eras/2023.png"), resolved
 * against the document — so it works at the domain root AND the /resume/ sub-path.
 * Needed when the path is consumed via a CSS custom property (url() in a CSS var
 * resolves relative to the STYLESHEET, which now lives under /assets/css/).
 */
export function assetUrl(path: string): string {
  try {
    return new URL(path, document.baseURI).href
  } catch {
    return path
  }
}
