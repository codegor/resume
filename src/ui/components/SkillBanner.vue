<template>
  <div v-if="skill" class="wrap">
    <div class="skill-banner">
      <icon name="spark" style="width: 16px; height: 16px; color: var(--accent)" />
      <span>
        <tc
          one="Showing {n} project that used {skill}."
          other="Showing {n} projects that used {skill}."
          :n="count"
          :params="{ skill }"
        />
      </span>
      <button class="filter-clear" @click="store.setSkill(null)">
        <t>Clear highlight ✕</t>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '@/composables/useStore'
import { projectUsesSkill } from '@/utils/site-filters'

const store = useStore()

const skill = computed(() => store.activeSkill)
const count = computed(() => {
  const s = store.activeSkill
  const data = store.data
  if (!s || !data) return 0
  let n = 0
  ;(data.work_experience || []).forEach((exp) =>
    (exp.projects || []).forEach((p) => {
      if (projectUsesSkill(p.technologies, s)) n++
    }),
  )
  return n
})
</script>

<style scoped lang="scss">
.skill-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  background: var(--surface);
  border: 1px solid var(--accent);
  border-radius: 12px;
  padding: 12px 16px;
  margin: 20px 0 0;
  font-family: var(--sans);
  font-size: 13.5px;
}

.skill-banner b {
  color: var(--accent);
}

.skill-banner button {
  margin-left: auto;
}
</style>
