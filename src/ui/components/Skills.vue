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
      <more-pill
        v-if="hiddenCount > 0"
        :more="hiddenCount"
        :more-text="moreText"
        :online="true"
        @toggle="revealAllSkills"
      />
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
import { tc as $tc } from '@/composables/i18n'
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
  'backend',
  'frontend',
  'qa',
  'devops',
  'ide',
  'principles',
  'want_to_learn',
])
// Headlines: only the configured groups show; the rest fold into the "+N more skill areas" pill.
// Driven by the visible Headlines toggle alone (so print is WYSIWYG — Headlines off prints every
// group). Suppressed when a focus filter / skill highlight / search is active (those mean "show me
// the detail"), so role filtering is untouched.
const headlineGroups = computed<string[] | null>(() => store.data?.skillsHeadline?.groups ?? null)
const headlineActive = computed(
  () =>
    store.compact &&
    store.activeFilter === 'all' &&
    !store.activeSkill &&
    !q.value &&
    headlineGroups.value != null,
)
const visibleKeys = computed(() => {
  // Always focus-scoped: search alone (af === 'all') still shows every group, but when a
  // focus filter is active the search stays inside that filter's group(s) instead of
  // overriding it (the search × focus collision — see noSkillMatch / SkillGroup collapse).
  const af = store.activeFilter
  return order.value.filter((k) => {
    if (!skills.value[k]) return false
    if (af !== 'all' && (filterFor.value[k] || null) !== af) return false
    if (headlineActive.value && !headlineGroups.value!.includes(k)) return false
    return true
  })
})
const hiddenCount = computed(() => {
  if (q.value) return 0
  const visible = new Set(visibleKeys.value)
  return order.value.filter((k) => skills.value[k] && !visible.has(k)).length
})
const moreText = computed(() =>
  $tc('+{n} more skill area — show all', '+{n} more skill areas — show all', hiddenCount.value),
)
/* Reveal the folded groups: a focus filter hid them → clear it (today's behavior, which also
   drops Recent·5y); Headlines hid them → switch Headlines OFF but KEEP Recent·5y (showProjects
   never touches recentOnly). Never clearAll() in the Headlines case — it would reset Recent·5y. */
function revealAllSkills(): void {
  if (store.activeFilter !== 'all') store.clearAll()
  else store.showProjects()
}
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
