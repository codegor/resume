<template>
  <section
    :id="id"
    class="section wrap reveal-section"
    :class="{ 'compact-hide': compact, 'section-narrow': narrow }"
  >
    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{ id?: string; compact?: boolean; narrow?: boolean }>()
</script>
