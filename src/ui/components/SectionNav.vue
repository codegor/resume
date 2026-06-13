<template>
  <nav
    v-if="!store.printing"
    class="section-nav"
    :class="{ 'is-visible': visible }"
    :aria-label="$t('Section shortcuts')"
  >
    <button
      v-for="it in items"
      :key="it.id"
      type="button"
      class="snav-btn has-tip"
      :class="{ 'is-active': activeId === it.id }"
      :data-tip="$t(it.label)"
      :aria-label="$t('Jump to {label}', { label: $t(it.label) })"
      @click="go(it.id)"
    >
      <icon :name="it.icon" />
    </button>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useStore } from '@/composables/useStore'
import { scrollToId } from '@/utils/dom'

interface NavItem {
  id: string
  icon: string
  label: string
}

const TARGETS: NavItem[] = [
  { id: 'top', icon: 'arrow-up', label: 'Top' },
  { id: 'skills', icon: 'spark', label: 'Skills' },
  { id: 'timeline', icon: 'clock', label: 'Experience' },
  { id: 'how-i-work', icon: 'award', label: 'How I work' },
]

const store = useStore()
const visible = ref(false)
const present = ref<Record<string, boolean>>({})
const activeId = ref('')
let io: IntersectionObserver | null = null
let raf = 0

// 'top' always works; section buttons only render when their anchor exists
// (e.g. How I work is data-driven and may be absent).
const items = computed(() => TARGETS.filter((t) => t.id === 'top' || present.value[t.id]))

function go(id: string): void {
  if (id === 'top') window.scrollTo({ top: 0, behavior: 'smooth' })
  else scrollToId(id)
}

// scrollspy: the active region = the last target section whose top has passed
// the sticky-topbar offset (positions are measured live — the serpentine
// timeline re-lays-out on resize/filter, so cached offsets would go stale).
// 'top' is a jump only, never a tracked region — above #skills nothing is lit.
function trackActive(): void {
  raf = 0
  let cur = ''
  for (const t of TARGETS) {
    if (t.id === 'top') continue
    const el = document.getElementById(t.id)
    if (el && el.getBoundingClientRect().top <= 120) cur = t.id
  }
  activeId.value = cur
}
function onScroll(): void {
  if (!raf) raf = requestAnimationFrame(trackActive)
}

onMounted(() => {
  nextTick(() => {
    const map: Record<string, boolean> = {}
    TARGETS.forEach((t) => {
      map[t.id] = !!document.getElementById(t.id)
    })
    present.value = map

    const hero = document.getElementById('top')
    if (hero && window.IntersectionObserver) {
      io = new IntersectionObserver(
        (es) => es.forEach((e) => (visible.value = !e.isIntersecting)),
        { threshold: 0 },
      )
      io.observe(hero)
    } else {
      visible.value = true
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    trackActive()
  })
})
onUnmounted(() => {
  io?.disconnect()
  io = null
  window.removeEventListener('scroll', onScroll)
  if (raf) cancelAnimationFrame(raf)
})
</script>

<style scoped lang="scss">
.section-nav {
  position: fixed;
  right: 15px;

  /* raised ~one button height off the corner — keeps the footer links clickable */
  bottom: 84px;
  z-index: 70;
  display: flex;
  flex-direction: column;
  gap: 7px;
  opacity: 0;
  transform: translateY(8px);
  pointer-events: none;
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.section-nav.is-visible {
  opacity: 1;
  transform: none;
  pointer-events: auto;
}

@media (prefers-reduced-motion: reduce) {
  .section-nav {
    transition: none;
  }
}

.snav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  box-shadow: var(--shadow-s);
  cursor: pointer;
  transition: all 0.16s ease;
}

.snav-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  transform: translateY(-1px);
  box-shadow: var(--shadow-m);
}

.snav-btn :deep(svg) {
  width: 17px;
  height: 17px;
}

/* scrollspy: the section currently in view gets the accent fill (frame A2) */
.snav-btn.is-active,
.snav-btn.is-active:hover {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-ink);
}

/* tooltip opens to the LEFT here (the shared .has-tip primitive opens downward) */
.snav-btn.has-tip::after {
  top: 50%;
  right: calc(100% + 10px);
  transform: translateY(-50%) translateX(3px);
}

.snav-btn.has-tip:hover::after,
.snav-btn.has-tip:focus-visible::after {
  transform: translateY(-50%);
}

@media (max-width: 820px) {
  .section-nav {
    right: 10px;
    bottom: 76px;
    gap: 8px;
  }

  .snav-btn {
    width: 44px;
    height: 44px;
  }

  .snav-btn :deep(svg) {
    width: 20px;
    height: 20px;
  }
}
</style>
