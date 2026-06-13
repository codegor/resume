<template>
  <div v-if="msg" class="toast-pop">{{ msg }}</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const msg = ref<string | null>(null)
let timer: number | undefined

onMounted(() => {
  window.__toast = (m: string) => {
    msg.value = m
    clearTimeout(timer)
    timer = setTimeout(() => {
      msg.value = null
    }, 2600)
  }
})
</script>

<style scoped lang="scss">
.toast-pop {
  position: fixed;
  left: 50%;
  bottom: 28px;
  transform: translateX(-50%);
  z-index: 300;
  background: var(--ink);
  color: var(--bg);
  font-family: var(--sans);
  font-size: 13.5px;
  font-weight: 500;
  padding: 12px 20px;
  border-radius: 30px;
  box-shadow: var(--shadow-l);
  animation: fadein 0.25s ease;
}
</style>
