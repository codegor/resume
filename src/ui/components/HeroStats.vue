<template>
  <div class="hero-stats">
    <div v-for="(s, i) in h?.stats" :key="i" class="stat">
      <div class="n">
        {{ s.key === 'projects' ? projectCount : s.n }}<em>{{ s.plus }}</em>
      </div>
      <div class="l">{{ s.l }}</div>
      <div class="l-short">{{ short(s.l) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '@/composables/useStore'
import { siteConfig } from '@/config'

const store = useStore()

const h = computed(() => siteConfig().hero)
const projectCount = computed(() =>
  (store.data?.work_experience || []).reduce((a, e) => a + (e.projects ? e.projects.length : 0), 0),
)

function short(l?: string) {
  return String(l).split(' ')[0]
}
</script>
