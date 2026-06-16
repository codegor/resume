<template>
  <section-block v-if="hw" id="how-i-work" :compact="true">
    <section-head
      :eyebrow="$t('04 — How I work')"
      :title="hw.title"
      :rule="true"
      :count="hw.label"
    />
    <!-- eslint-disable-next-line vue/no-v-html — own-content emphasis, HTML-escaped first -->
    <p v-if="hw.lead" class="hiw-lead reveal-up" v-html="emphasize(hw.lead)"></p>
    <div v-if="points.length" class="hiw-grid">
      <div v-for="(p, i) in points" :key="p.title" class="hiw-card reveal-up">
        <div class="hiw-num">{{ String(i + 1).padStart(2, '0') }}</div>
        <h3 class="hiw-title">{{ p.title }}</h3>
        <p v-if="p.desc" class="hiw-desc">{{ p.desc }}</p>
      </div>
    </div>
  </section-block>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '@/composables/useStore'
import { emphasize } from '@/utils/format'

const store = useStore()

const hw = computed(() => store.data?.how_i_work || null)
const points = computed(() => hw.value?.points || [])
</script>

<style scoped lang="scss">
.hiw-lead {
  font-family: var(--serif);
  font-size: clamp(19px, 2.4vw, 24px);
  line-height: 1.5;
  letter-spacing: -0.005em;
  color: var(--ink-soft);
  margin: 0 0 34px;
  max-width: 640px;
  text-wrap: pretty;

  :deep(em) {
    font-style: italic;
  }

  :deep(strong) {
    font-weight: 600;
    color: var(--ink);
  }
}

.hiw-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px 22px;
}

.hiw-card {
  background: var(--surface);
  border: 1px solid var(--line-soft);
  border-left: 3px solid var(--accent);
  border-radius: 10px;
  padding: 18px 22px 16px;
}

.hiw-num {
  font-family: var(--sans);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: var(--accent);
}

.hiw-title {
  font-family: var(--serif);
  font-weight: 500;
  font-size: 22px;
  letter-spacing: -0.01em;
  line-height: 1.15;
  margin: 6px 0;
}

.hiw-desc {
  font-family: var(--sans);
  font-size: 13px;
  line-height: 1.5;
  color: var(--muted);
  margin: 0;
}

@media screen and (max-width: 980px) {
  .hiw-lead {
    margin-bottom: 22px;
  }

  .hiw-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

@media print {
  .hiw-grid {
    grid-template-columns: 1fr 1fr;
    gap: 10px 14px;
  }

  .hiw-card {
    border-left-color: var(--accent); /* keep the accent bar on paper, like language bars */
    print-color-adjust: exact;
    padding: 10px 14px;
    break-inside: avoid; /* keep number + title + desc on one page */
  }
}
</style>
