<template>
  <span :class="['tag-role', { 'role-active': active }]">{{ label }}</span>
</template>

<script setup lang="ts">
defineProps<{ label?: string; active?: boolean }>()
</script>

<style scoped lang="scss">
.tag-role {
  font-family: var(--sans);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 20px;
  background: color-mix(in srgb, var(--ink) 8%, transparent);
  color: var(--ink-soft);
}

.tag-role.role-active {
  background: var(--accent);
  color: #fff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
</style>
