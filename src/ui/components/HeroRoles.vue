<template>
  <div class="hero-roles">
    <span v-for="r in roles" :key="r">{{ r }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { heroRoleLabels } from '@/utils/format'

const roles = computed(() => heroRoleLabels())
</script>
