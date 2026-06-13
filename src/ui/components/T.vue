<!-- <t>…</t> — the default for static visible text. The slot text (whitespace-collapsed
     + trimmed) IS the translation key. Renders a bare text node (no wrapper element), so
     it drops into existing markup transparently. Reactive on the active language.
     Pure static text only (no nested elements). Interpolate with :params.
       <t>Show fewer</t>
       <t :params="{ year: folioYear }">The Résumé · No. {year}</t> -->
<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { t } from '@/composables/i18n'

const props = defineProps<{ params?: Record<string, string | number> }>()
const slots = useSlots()

const key = computed(() =>
  (slots.default?.() ?? [])
    .map((n) => (typeof n.children === 'string' ? n.children : ''))
    .join('')
    // collapse ASCII whitespace only (NOT &nbsp;/U+00A0) so non-breaking spaces in the
    // source text are preserved in the key — and thus in the rendered output
    .replace(/[ \t\r\n]+/g, ' ')
    .replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, ''),
)
const out = computed(() => t(key.value, props.params))
</script>

<template>{{ out }}</template>
