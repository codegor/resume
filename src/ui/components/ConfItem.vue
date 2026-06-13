<template>
  <div :class="['conf-item', { open: effOpen, dim: dim }]">
    <div class="marker-row" @click="hasMore && (open = !open)">
      <div class="marker-main">
        <div class="marker-kicker">
          <icon :name="m.kind === 'certificate' ? 'award' : 'mic'" />
          <span><t v-if="m.kind === 'certificate'">Course</t><t v-else>Conference</t></span>
        </div>
        <div class="mc-t">{{ m.title }}</div>
        <div class="mc-s">{{ m.sub }}{{ m.year ? ' · ' + m.year : '' }}</div>
        <div v-if="skills.length > 0" class="marker-skills">
          <skill-chip
            v-for="(s, i) in shownSkills"
            :key="i"
            :label="s"
            :is-new="mk(s)?.isNew"
            :pill="mk(s)?.pill"
            :trend="(mk(s)?.weight || 0) > 0"
          />
          <button
            v-if="(!skillsOpen || store.printing) && hiddenCount > 0"
            class="ttag tech-more"
            @click.stop="skillsOpen = true"
          >
            <t :params="{ n: hiddenCount }">+{n} more</t>
          </button>
          <button
            v-if="skillsOpen && !store.printing && expandRevealed"
            class="ttag tech-more"
            @click.stop="skillsOpen = false"
          >
            <t>show fewer</t>
          </button>
        </div>
      </div>
      <button v-if="hasMore" class="marker-exp" :aria-label="$t('expand')">
        <icon name="chevron" />
      </button>
    </div>
    <div v-if="effOpen" class="marker-body">
      <p v-if="meta.desc" class="marker-desc">{{ meta.desc }}</p>
      <a class="marker-link" :href="url" target="_blank" rel="noopener"
        ><t v-if="isFwdays">View programme on fwdays ↗</t><t v-else>View programme ↗</t></a
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useStore } from '@/composables/useStore'
import { siteConfig } from '@/config'
import {
  queryHit,
  looseMatch,
  skillMatchesTech,
  tokensForFilter,
  techMatches,
} from '@/utils/site-filters'
import { markChips, makeFirstAppearance, learnScopeOccurrences, parseDateTs } from '@/utils/skills'
import type { Marker } from '@/types/config'

function confMeta(title: string) {
  const t = (title || '').toLowerCase()
  if (t.includes('highload'))
    return {
      skills: ['High load', 'Performance', 'Caching', 'Scaling'],
      desc: 'High-load systems — performance, caching, scaling and reliability at scale.',
    }
  if (t.includes('ai summit') || t.includes('devrain') || /\bai\b/.test(t))
    return {
      skills: ['AI / LLM', 'LLM integration', 'Embeddings', 'Agents'],
      desc: 'Applied AI & LLMs — building reliable AI products and agentic workflows.',
    }
  if (t.includes('devops'))
    return {
      skills: ['DevOps', 'Kubernetes', 'CI/CD', 'Observability'],
      desc: 'DevOps & SRE — Kubernetes, CI/CD pipelines, observability and delivery.',
    }
  if (t.includes('cto'))
    return {
      skills: ['Team Lead', 'Architecture', 'Strategy'],
      desc: 'Tech leadership — team management, technical strategy and decision-making.',
    }
  if (t.includes('php'))
    return {
      skills: ['PHP', 'Symfony', 'Laravel'],
      desc: 'Modern PHP — Symfony / Laravel ecosystem, performance and best practices.',
    }
  if (t.includes('architecture'))
    return {
      skills: ['Software Architect', 'Microservices', 'DDD'],
      desc: 'Software architecture — microservices, DDD and designing for scale.',
    }
  if (t.includes('javascript'))
    return {
      skills: ['JavaScript', 'Vue.js', 'Front-end'],
      desc: 'Modern JavaScript & front-end — Vue ecosystem, tooling and patterns.',
    }
  return { skills: [], desc: '' }
}

const props = defineProps<{ m: Marker }>()

const store = useStore()

const open = ref(false)
const skillsOpen = ref(false)

const activeFilter = computed(() => store.activeFilter)
const activeSkill = computed(() => store.activeSkill)
const q = computed(() => (store.skillQuery || '').trim().toLowerCase())
const cm = computed(
  () =>
    (siteConfig().conferences || {})[props.m.title || ''] ||
    (siteConfig().certificates || {})[props.m.title || ''],
)
const itemFilters = computed(() => (cm.value && cm.value.filters) || props.m.filters || [])
const dim = computed(
  () =>
    !!activeFilter.value &&
    activeFilter.value !== 'all' &&
    !itemFilters.value.includes(activeFilter.value),
)
const meta = computed(() =>
  cm.value
    ? cm.value
    : props.m.skills || props.m.desc
      ? { skills: props.m.skills || [], desc: props.m.desc || '' }
      : props.m.kind === 'conference'
        ? confMeta(props.m.title || '')
        : { skills: [], desc: '' },
)
const url = computed(() => (cm.value && cm.value.url) || props.m.url || 'https://fwdays.com')
const isFwdays = computed(() => /fwdays\.com/i.test(url.value))
const skills = computed(() => meta.value.skills || [])
const hasMore = computed(() => !!meta.value.desc)
const effOpen = computed(() => hasMore.value && open.value)
/* when a skill/filter is active, show only the matching skill chips + '+N more' */
const relevant = computed(() => {
  if (q.value) return skills.value.filter((s: string) => queryHit(s, q.value))
  const as = activeSkill.value
  if (as) return skills.value.filter((s: string) => looseMatch(as, s) || skillMatchesTech(s, as))
  const af = activeFilter.value
  if (af && af !== 'all') {
    const tokens = tokensForFilter(store.data!.skills, af)
    if (tokens) return skills.value.filter((s: string) => techMatches(s, tokens))
  }
  return null
})
/* collapsed cards show at most CAP pills; '+N more' expands inline */
const CAP = 5
/* primary = filter-relevant subset when a filter/skill/query is active, else all */
const primary = computed(() => relevant.value ?? skills.value)
const restSkills = computed(() =>
  relevant.value ? skills.value.filter((s: string) => !relevant.value!.includes(s)) : [],
)
const fullList = computed(() =>
  relevant.value ? [...relevant.value, ...restSkills.value] : skills.value,
)
const shownSkills = computed(() => {
  if (skillsOpen.value && !store.printing) return fullList.value
  /* print keeps the old behavior: relevant subset under a filter, everything otherwise */
  return store.printing ? primary.value : primary.value.slice(0, CAP)
})
const hiddenCount = computed(() => fullList.value.length - shownSkills.value.length)
const expandRevealed = computed(() => fullList.value.length > Math.min(CAP, primary.value.length))
/* "NEW" (first appearance across the pooled cert+conference set) + trend accent */
const marks = computed(() => {
  const firstApp = makeFirstAppearance(learnScopeOccurrences(store.data))
  return markChips(skills.value, firstApp, parseDateTs(props.m.year), siteConfig().trendSkills)
})
function mk(s: string) {
  return marks.value.get(s)
}

if (store.expandAll && hasMore.value) open.value = true

watch(
  () => store.activeFilter,
  () => {
    skillsOpen.value = false
  },
)
watch(
  () => store.activeSkill,
  () => {
    skillsOpen.value = false
  },
)
watch(
  () => store.skillQuery,
  () => {
    skillsOpen.value = false
  },
)
watch(
  () => store.expandTick,
  () => {
    open.value = store.expandAll
  },
)
watch(open, (v) => {
  if (!v) store.noteCollapsed()
})
</script>
