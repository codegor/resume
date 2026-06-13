<!-- <tc> — the default for plurals in templates. Takes the two English forms as props
     (slots can't carry two variants); {n} is injected automatically. Renders a bare
     text node, reactive on the active language.
       <tc one="{n} project match “{q}”" other="{n} projects match “{q}”" :n="qCount" :params="{ q }" /> -->
<script setup lang="ts">
import { computed } from 'vue'
import { tc } from '@/composables/i18n'

const props = defineProps<{
  one: string
  other: string
  n: number
  params?: Record<string, string | number>
}>()

const out = computed(() => tc(props.one, props.other, props.n, props.params))
</script>

<template>{{ out }}</template>
