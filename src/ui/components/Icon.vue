<template>
  <!-- eslint-disable vue/no-v-html -- ic.inner is a trusted, static SVG string from the local ICONS map; never user input -->
  <svg
    viewBox="0 0 24 24"
    :fill="ic.fill || 'none'"
    :stroke="ic.stroke || undefined"
    :stroke-width="ic.sw || undefined"
    v-html="ic.inner"
  ></svg>
  <!-- eslint-enable vue/no-v-html -->
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ICONS, type IconDef } from '@/utils/icons'

const props = defineProps<{ name: string }>()
const ic = computed<IconDef>(() => ICONS[props.name] || { inner: '' })
</script>
