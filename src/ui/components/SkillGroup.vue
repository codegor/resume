<template>
  <div
    v-show="!searchHidden"
    :class="['skillgroup', 'reveal-up', { dim: dim }]"
    :style="{ '--gc': gc }"
  >
    <div class="sg-head">
      <h3>{{ title }}</h3>
      <span v-if="q && searchChips" class="sg-hits"
        >{{ searchChips.length }} <tc one="match" other="matches" :n="searchChips.length"
      /></span>
      <span v-if="exp" class="sg-yrs">{{ exp }}</span>
    </div>
    <div class="sg-collapsed">{{ collapsedNames || title }} …</div>
    <div class="skill-items">
      <template v-for="(s, i) in shownChips" :key="i">
        <div v-if="isLong(s.name)" class="skill skill-long">
          {{ s.name }}<span v-if="s.exp" class="y"> · {{ s.exp }}</span>
        </div>
        <button
          v-else
          :class="['skill', { active: isActive(s.name), 'skill-top': !q && topNames.has(s.name) }]"
          :title="$t('Show projects using {skill}', { skill: s.name })"
          @click="store.onSkillClick(s.name)"
        >
          <span
            v-if="!q && s.isNew && !newPillNames.has(s.name)"
            class="skill-newdot"
            :title="$t('New this project')"
          ></span
          >{{ s.name
          }}<span v-if="!q && s.isNew && newPillNames.has(s.name)" class="skill-new"
            ><t>NEW</t></span
          ><span v-if="s.exp" class="y">{{ s.exp }}</span>
        </button>
      </template>
      <button
        v-if="collapse && (!skillsOpen || store.printing) && restCount > 0"
        class="skill skill-more"
        @click="skillsOpen = true"
      >
        +{{ restCount }} <t>more</t>
      </button>
      <button
        v-if="collapse && skillsOpen && !store.printing"
        class="skill skill-more"
        @click="skillsOpen = false"
      >
        <t>show fewer</t>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useStore } from '@/composables/useStore'
import { siteConfig } from '@/config'
import { t as $t } from '@/composables/i18n'
import { skillMatchesTech, looseMatch } from '@/utils/site-filters'
import {
  skillChipsFor,
  skillExpMonths,
  skillSearchMatch,
  skWordContains,
  decorateChips,
  gridNewChecker,
  skillScore,
  SKILL_GROUP_TITLES,
  SKILL_GROUP_COLOR,
  type Chip,
} from '@/utils/skills'
import type { SkillGroup, SkillEntry, LearnItem } from '@/types/resume'

const props = defineProps<{
  gkey: string
  // skills[k] from the store — a group object, an entry list, or (the `note` key) a string.
  gdata?: SkillGroup | SkillEntry[] | string
  filterFor: Record<string, string>
}>()

// Narrow to the group-object case; arrays/strings have no title/experience.
const group = computed<SkillGroup | undefined>(() =>
  props.gdata && !Array.isArray(props.gdata) && typeof props.gdata === 'object'
    ? props.gdata
    : undefined,
)
const groupData = computed<SkillGroup | SkillEntry[] | undefined>(() =>
  Array.isArray(props.gdata) ? props.gdata : group.value,
)

const store = useStore()

const skillsOpen = ref(false)

watch(
  () => store.recentOnly,
  () => {
    skillsOpen.value = false
  },
)

const q = computed(() => (store.skillQuery || '').trim().toLowerCase())
const dim = computed(
  () =>
    !q.value &&
    store.activeFilter !== 'all' &&
    (props.filterFor[props.gkey] || null) !== store.activeFilter,
)
const title = computed(() => $t(group.value?.title || SKILL_GROUP_TITLES[props.gkey] || props.gkey))
const exp = computed(() => group.value?.experience)
const gc = computed(() => SKILL_GROUP_COLOR[props.gkey] || 'var(--accent)')
const trend = computed(() => siteConfig().trendSkills)
const gridIsNew = computed(() => gridNewChecker(store.data?.work_experience))
const chips = computed<Chip[]>(() =>
  decorateChips(skillChipsFor(props.gkey, groupData.value), {
    isNew: gridIsNew.value,
    trend: trend.value,
  }),
)
/* top ~5 chips get a subtle emphasis: trend weight leads, experience breaks ties
   (skip sub-items). A group with no trend matches falls back to pure experience. */
const topNames = computed(() => {
  const eligible = chips.value.filter((c) => !c.sub)
  const hasTrend = eligible.some((c) => (c.trendWeight || 0) > 0)
  const ranked = eligible
    .filter((c) => (hasTrend ? skillScore(c) > 0 : skillExpMonths(c.exp) > 0))
    .slice()
    .sort((a, b) => skillScore(b) - skillScore(a))
    .slice(0, 5)
  return new Set(ranked.map((c) => c.name))
})
/* among the group's "new" chips, the top 3 by trend weight get the bold pill; rest a dot */
const newPillNames = computed(() => {
  const news = chips.value.filter((c) => !c.sub && c.isNew)
  return new Set(
    news
      .slice()
      .sort(
        (a, b) =>
          (b.trendWeight || 0) - (a.trendWeight || 0) ||
          skillExpMonths(b.exp) - skillExpMonths(a.exp),
      )
      .slice(0, 3)
      .map((c) => c.name),
  )
})
/* optional: physically float trend-weighted chips to the top (sub-items stay under parent) */
const reorder = computed(() => !!siteConfig().trendReorder)
function floatTrend(list: Chip[]): Chip[] {
  if (!reorder.value) return list
  const blocks: { weight: number; items: Chip[]; i: number }[] = []
  list.forEach((c) => {
    if (c.sub && blocks.length) blocks[blocks.length - 1].items.push(c)
    else blocks.push({ weight: c.trendWeight || 0, items: [c], i: blocks.length })
  })
  return blocks.sort((a, b) => b.weight - a.weight || a.i - b.i).flatMap((b) => b.items)
}
const searchChips = computed(() =>
  q.value ? chips.value.filter((c) => skillSearchMatch(c.name, q.value)) : null,
)
// Search ALONE (no focus filter) hides a zero-match group — unchanged. In a search × focus
// collision the (focus-scoped) group stays visible and collapses to "+N more" instead.
const searchHidden = computed(
  () => q.value !== '' && store.activeFilter === 'all' && searchChips.value!.length === 0,
)
const collapsedNames = computed(() =>
  chips.value
    .filter((c) => (c.name || '').length <= 24)
    .slice(0, 6)
    .map((c) => c.name)
    .join(' · '),
)
/* every tech/skill seen in the last 5 years — recent projects + recent courses +
   recent conferences (so a skill learned via a recent course/conference counts as
   "recent" even when no project lists it verbatim). */
const recentTechs = computed<string[] | null>(() => {
  if (!store.recentOnly) return null
  if (props.gkey === 'want_to_learn') return null
  const techs: string[] = []
  ;(store.data!.work_experience || []).forEach((exp) => {
    if (!store.isRecentPeriod(exp.period || '')) return
    ;(exp.projects || []).forEach((p) => (p.technologies || []).forEach((t) => techs.push(t)))
  })
  const pushLearn = (items?: LearnItem[]): void =>
    (items || []).forEach((it) => {
      if (!store.isRecentPeriod(it.date || it.year || '')) return
      ;(it.skills || []).forEach((s) => techs.push(s))
    })
  pushLearn(store.data!.professional_courses?.items)
  pushLearn(store.data!.conferences?.items)
  return techs
})
const modernChips = computed(() => {
  const rt = recentTechs.value
  if (!rt) return chips.value
  return chips.value.filter((c) =>
    rt.some((t) => skillMatchesTech(t, c.name) || looseMatch(c.name, t)),
  )
})
const collapseModern = computed(
  () => !q.value && recentTechs.value != null && modernChips.value.length < chips.value.length,
)
const restModern = computed(() =>
  collapseModern.value ? chips.value.length - modernChips.value.length : 0,
)
/* search × focus collision → keep this (focus) group, show its matches and tuck the rest
   behind a reveal-in-place "+N more" (so 0 match ⇒ "0 present, all on +N more"). collapseModern
   needs !q and collapseSearch needs q, so the two never overlap. */
const collapseSearch = computed(
  () =>
    q.value !== '' &&
    store.activeFilter !== 'all' &&
    (searchChips.value?.length ?? 0) < chips.value.length,
)
const restSearch = computed(() =>
  collapseSearch.value ? chips.value.length - (searchChips.value?.length ?? 0) : 0,
)
const collapse = computed(() => collapseModern.value || collapseSearch.value)
const restCount = computed(() => (collapseModern.value ? restModern.value : restSearch.value))
const shownChips = computed(() => {
  if (q.value && !collapseSearch.value) return searchChips.value // search-alone — unchanged
  const relevant = q.value ? searchChips.value! : modernChips.value
  const base = collapse.value
    ? skillsOpen.value && !store.printing
      ? chips.value
      : relevant
    : chips.value
  return floatTrend(base)
})

function isLong(name: string): boolean {
  return (name || '').length > 38
}
function isActive(name: string): boolean {
  const a = (store.activeSkill || '').toLowerCase().trim(),
    n = (name || '').toLowerCase().trim()
  if (!a || !n) return false
  return a === n || skWordContains(n, a) || skWordContains(a, n)
}
</script>
