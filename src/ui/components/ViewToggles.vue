<template>
  <div :class="['tb-toggles', { 'is-compact': compact }]">
    <button
      :class="['essw', { on: store.compact }]"
      :title="$t('Headlines — only the key skills & languages (recent ones first)')"
      :aria-pressed="store.compact"
      @click="store.toggleCompact()"
    >
      <span class="essw-knob"></span><span class="essw-lbl"><t>Headlines</t></span>
    </button>
    <button
      :class="['essw', { on: store.recentOnly }]"
      :title="$t('Recent view — only the last 5 years of roles & the skills used in them')"
      :aria-pressed="store.recentOnly"
      @click="store.toggleRecentOnly()"
    >
      <span class="essw-knob"></span><span class="essw-lbl"><t>Recent · 5y</t></span>
    </button>
    <button
      :class="['essw', { on: store.expandAll }]"
      :title="$t('Expand every role & conference card at once')"
      :aria-pressed="store.expandAll"
      @click="store.toggleExpandAll()"
    >
      <span class="essw-knob"></span><span class="essw-lbl"><t>Expand all</t></span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useStore } from '@/composables/useStore'

// `compact` → a tighter one-line variant used when the switches are mirrored inside the ⓘ
// dropdown menu on mobile (smaller gap/padding/font so all three fit on a single row).
defineProps<{ compact?: boolean }>()

const store = useStore()
</script>
