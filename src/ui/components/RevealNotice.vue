<template>
  <transition name="rn-fade">
    <div v-if="store.revealNotice" class="rn-back" @click="close">
      <div
        ref="cardEl"
        class="rn-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rn-title"
        tabindex="-1"
        @click.stop
      >
        <button class="vmodal-close rn-close" :aria-label="$t('Close')" @click="close">
          <icon name="x" />
        </button>
        <div class="rn-eyebrow"><t>The full story</t></div>
        <h2 id="rn-title" class="rn-title">{{ title }}</h2>
        <p v-for="(para, i) in paragraphs" :key="i" class="rn-body">{{ para }}</p>
        <button class="rn-ok" @click="close"><t>Got it</t></button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useStore } from '@/composables/useStore'
import { t as $t } from '@/composables/i18n'

const store = useStore()
const cardEl = ref<HTMLElement | null>(null)

const title = computed(() =>
  store.revealNotice === 'recent' ? $t('Now showing everything') : $t('Here’s more about me'),
)
// One <p> per phrase — easier to read than a single dense block.
const paragraphs = computed<string[]>(() =>
  store.revealNotice === 'recent'
    ? [
        $t(
          'Recent · 5y is off — every skill on each project and all of my projects across the full timeline are now shown.',
        ),
        $t(
          'Tip: click any skill to light up every project where it appears, or use the skill search to find one.',
        ),
      ]
    : [
        $t(
          'Headlines is off — now showing more: the extra sections, every skill, and my last 5 years of projects on the timeline.',
        ),
        $t('Turn off Recent · 5y to see my full history.'),
        $t('Tip: use the Focus filter to narrow everything to a single role.'),
      ],
)

function close(): void {
  store.closeRevealNotice()
}

// No auto-dismiss — the reader needs time to read it; closes via "Got it" / ✕ / Esc / Enter
// (Enter mirrors the primary "Got it" action).
let onKey: (e: KeyboardEvent) => void
onMounted(() => {
  onKey = (e: KeyboardEvent) => {
    if (store.revealNotice && (e.key === 'Escape' || e.key === 'Enter')) store.closeRevealNotice()
  }
  window.addEventListener('keydown', onKey)
})
// On open, move keyboard focus into the dialog so Esc/Enter and a screen reader land on it.
watch(
  () => store.revealNotice,
  async (v) => {
    if (!v) return
    await nextTick()
    cardEl.value?.focus()
  },
)
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
})
</script>

<style scoped lang="scss">
.rn-back {
  position: fixed;
  inset: 0;
  z-index: 210;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 11, 6, 0.6);
  backdrop-filter: blur(4px);
  padding: 24px;
}

.rn-card {
  position: relative;
  width: min(440px, 100%);
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 16px;
  box-shadow: var(--shadow-l);
  padding: 30px 32px 26px;
  text-align: left;
}

.rn-close {
  top: 14px;
  right: 14px;
}

.rn-eyebrow {
  font-family: var(--sans);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 8px;
}

.rn-title {
  font-family: var(--serif);
  font-weight: 500;
  font-size: 26px;
  letter-spacing: -0.01em;
  margin: 0 0 10px;
}

.rn-body {
  font-family: var(--sans);
  font-size: 14px;
  line-height: 1.6;
  color: var(--ink-soft);
  margin: 0 0 11px;
  max-width: 40ch;
}

/* extra breathing room below the last phrase, before the "Got it" button */
.rn-body:last-of-type {
  margin-bottom: 22px;
}

.rn-ok {
  font-family: var(--sans);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--accent-ink);
  background: var(--accent);
  border: 0;
  border-radius: 10px;
  padding: 10px 22px;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.rn-ok:hover {
  opacity: 0.88;
}

.rn-fade-enter-active,
.rn-fade-leave-active {
  transition: opacity 0.2s ease;
}

.rn-fade-enter-from,
.rn-fade-leave-to {
  opacity: 0;
}
</style>
