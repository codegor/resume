<template>
  <div class="hero-name-block">
    <div class="kicker"><t>Lead / Staff Agentic AI Engineer and Architect</t></div>
    <h1 class="hero-name">
      <a class="plain-link" :href="homeUrl" @click="goHome">Egor<br /><em>Berezovsky</em></a>
    </h1>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { siteHomeUrl, goHome } from '@/utils/dom'

const homeUrl = computed(() => siteHomeUrl())
</script>
