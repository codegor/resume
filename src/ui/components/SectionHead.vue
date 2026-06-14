<template>
  <div class="section-head" :class="{ 'sh-small': small, 'sh-gap': gap }">
    <div class="eyebrow">{{ eyebrow }}</div>
    <h2>{{ title }}</h2>
    <div v-if="rule" class="rule"></div>
    <div v-if="count" class="count">{{ count }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title?: string
  count?: string
  rule?: boolean
  small?: boolean
  gap?: boolean
}>()
</script>

<style scoped lang="scss">
.eyebrow {
  font-family: var(--sans);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--muted);
}

.section-head {
  display: flex;
  align-items: baseline;
  gap: 18px;
  margin-bottom: 38px;
  flex-wrap: wrap;
}

.section-head h2 {
  font-family: var(--serif);
  font-weight: 500;
  font-size: clamp(30px, 4.4vw, 50px);
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1;
  flex: none;
}

.section-head .rule {
  flex: 1;
  height: 1px;
  background: var(--line);
  align-self: center;
}

.section-head .count {
  font-family: var(--sans);
  font-size: 12px;
  letter-spacing: 0.1em;
  color: var(--muted);
}

/* same component & margin for every section (02–07) */
.sh-small h2 {
  font-size: 34px;
}

@media screen and (max-width: 980px) {
  .section-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    margin-bottom: 14px;
  }

  .section-head .rule {
    display: none;
  }

  .sh-small h2 {
    font-size: 30px;
  }
}
</style>
