<template>
  <div class="tb-toggles">
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

const store = useStore()
</script>
