<template>
  <section-block id="skills">
    <section-head eyebrow="02 — Skills" title="What I do" :rule="true" :count="note" />
    <div class="skills-grid">
      <skill-group
        v-for="k in visibleKeys"
        :key="k"
        :gkey="k"
        :gdata="skills[k]"
        :filter-for="filterFor"
      />
      <button v-if="hiddenCount > 0" class="more-pill" @click="store.clearAll()">
        <tc
          one="+{n} more skill area — show all"
          other="+{n} more skill areas — show all"
          :n="hiddenCount"
        />
      </button>
      <p v-if="noSkillMatch" class="skills-empty">
        <t :params="{ q: store.skillQuery.trim() }">No skill matches “{q}”</t>
      </p>
    </div>
  </section-block>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '@/composables/useStore'
import { siteConfig } from '@/config'
import { skillChipsFor, skillSearchMatch } from '@/utils/skills'
import type { SkillGroup } from '@/types/resume'

const store = useStore()

const skills = computed(() => store.data!.skills)
const filterFor = computed(() => {
  const f: Record<string, string> = {}
  ;(siteConfig().filters || []).forEach((flt) =>
    (flt.skillGroups || []).forEach((g) => {
      f[g] = flt.id
    }),
  )
  return f
})
const note = computed(() => skills.value.note)
const q = computed(() => (store.skillQuery || '').trim().toLowerCase())
const order = computed(() => [
  'agent_development',
  'software_architect',
  'team_lead',
  'back_end',
  'front_end',
  'qa',
  'devops',
  'ide',
  'principles',
  'want_to_learn',
])
const visibleKeys = computed(() => {
  // Always focus-scoped: search alone (af === 'all') still shows every group, but when a
  // focus filter is active the search stays inside that filter's group(s) instead of
  // overriding it (the search × focus collision — see noSkillMatch / SkillGroup collapse).
  const af = store.activeFilter
  return order.value.filter(
    (k) => skills.value[k] && (af === 'all' || (filterFor.value[k] || null) === af),
  )
})
const hiddenCount = computed(() => {
  if (q.value) return 0
  const af = store.activeFilter
  return order.value
    .filter((k) => skills.value[k])
    .filter((k) => af !== 'all' && (filterFor.value[k] || null) !== af).length
})
const noSkillMatch = computed(() => {
  // search-alone only: in a search × focus collision the (focus) group collapses to "+N more"
  // instead of showing this message.
  if (!q.value || store.activeFilter !== 'all') return false
  return !visibleKeys.value.some((k) =>
    skillChipsFor(k, skills.value[k] as SkillGroup).some((c) => skillSearchMatch(c.name, q.value)),
  )
})
</script>

<style scoped lang="scss">
.skills-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 54px;
}

.skills-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  margin: 0 auto;
  max-width: 560px;
  padding: 24px 0;
  font-family: var(--sans);
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--muted);
  text-align: center;
}
</style>
