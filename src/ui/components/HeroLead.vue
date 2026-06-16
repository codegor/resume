<template>
  <div>
    <p class="hero-lead">
      <t :params="{ summary }"
        >With {summary} I build robust systems end-to-end — from solo startups to high-load,
        real-time media at scale.</t
      >
    </p>
    <p v-if="learningSummary" class="hero-lead-next">{{ learningSummary }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '@/composables/useStore'

const store = useStore()

const summary = computed(() => store.data?.summary || '')
const learningSummary = computed(() => store.data?.learning_summary || '')
</script>
