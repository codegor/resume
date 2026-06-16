<template>
  <div ref="rootEl" :class="['project', { open: open, dim: hidden, match: matchSkill }]">
    <div class="project-collapsed">
      <span class="dots">···</span> {{ p.role }} —
      {{ p.client ? p.client + ' · ' + p.project : p.project }}
    </div>
    <div :class="['project-head', { 'has-video': hasVideoSlot }]" @click="open = !open">
      <div v-if="hasVideoSlot" class="pv-note">
        <video-note :video-key="vkey" size="s" :badge="$t('Video')" />
      </div>
      <div class="ph-main">
        <div class="project-role">
          {{ roleHead
          }}<span class="role-last"
            >{{ roleLast
            }}<span v-if="p.period" class="period-info" @click.stop
              ><icon name="info" /><span class="period-tip">{{ p.period }}</span></span
            ></span
          >
        </div>
        <div class="project-where">
          <b v-if="p.client">{{ p.client }}</b
          >{{ p.client ? ' · ' : '' }}{{ p.project }}
        </div>
        <div class="project-tags-mini">
          <role-chip
            v-for="t in roleTags"
            :key="t.id"
            :label="t.label"
            :active="t.id === activeFilter"
          />
        </div>
      </div>
      <button class="project-expand" :aria-label="$t('expand')"><icon name="chevron" /></button>
    </div>
    <div class="project-body">
      <div>
        <div class="project-body-inner">
          <p class="project-desc">{{ p.description }}</p>
          <div v-if="outcomes.length" class="outcomes">
            <div v-for="(o, i) in outcomes" :key="i" class="outcome">
              <div class="oc-delta">{{ o.delta }}</div>
              <div class="oc-metric">{{ o.metric }}</div>
            </div>
          </div>
          <template v-if="p.key_achievements">
            <div class="ach-title"><t>Key achievements</t></div>
            <ul class="ach-list" :style="{ '--ec': 'var(' + ecolorVar + ')' }">
              <li v-for="(a, i) in p.key_achievements" :key="i">
                <b v-if="achParts(a).head">{{ achParts(a).head }}: </b>{{ achParts(a).rest }}
              </li>
            </ul>
          </template>
          <div class="tech-title"><t>Technologies</t></div>
          <div class="tech-tags">
            <skill-chip
              v-for="(t, i) in shownTech"
              :key="i"
              :label="t"
              :is-new="mk(t)?.isNew"
              :pill="mk(t)?.pill"
              :trend="(mk(t)?.weight || 0) > 0"
            />
            <button
              v-if="collapseTech && !techOpen && !store.printing && rest.length > 0"
              class="ttag tech-more"
              @click.stop="techOpen = true"
            >
              <tc one="+{n} more" other="+{n} more" :n="rest.length" />
            </button>
            <a
              v-if="collapseTech && store.printing && rest.length > 0"
              class="ttag tech-online more-online"
              :href="onlineResumeUrl()"
              >+{{ rest.length }} <t>more on interactive online</t></a
            >
            <button
              v-if="collapseTech && techOpen && !store.printing"
              class="ttag tech-more"
              @click.stop="collapseTechs"
            >
              <t>show fewer</t>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="project-foot">
      <span v-if="p.team" class="pf"
        ><b><t>Team:</t></b> {{ p.team }}</span
      >
      <span v-if="p.responsibility" class="pf"
        ><b><t>My role:</t></b> {{ p.responsibility }}</span
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useStore } from '@/composables/useStore'
import { siteConfig } from '@/config'
import { onlineResumeUrl, scrollElToCenter } from '@/utils/dom'
import {
  projectInFilter,
  projectUsesSkill,
  projectMatchesQuery,
  queryHit,
  skillMatchesTech,
  techRelevantToFilter,
} from '@/utils/site-filters'
import {
  markChips,
  makeFirstAppearance,
  projectOccurrences,
  parsePeriodStartTs,
  trendWeightFor,
} from '@/utils/skills'
import type { Project } from '@/types/resume'

const PROJECT_MAIN_PER_ROLE = 2 // Recent·5y: top techs shown per role the project covers
const PROJECT_MAIN_LIMIT = 10 // fallback cap when a project matches no role

const props = defineProps<{
  company: string
  p: Project
  tags?: string[]
  ecolorVar?: string
  techTokens?: string[] | null
  // the most-recent project — opened by default in the browse view as an "expandable" hint
  first?: boolean
}>()

const store = useStore()

const rootEl = ref<HTMLElement | null>(null)
const open = ref(false)
const techOpen = ref(false)
function collapseTechs(): void {
  techOpen.value = false
  // recentre on the "+N more" tech toggle that reappears (shared more/less rule)
  nextTick(() =>
    requestAnimationFrame(() => {
      const more = rootEl.value?.querySelector('.tech-more') as HTMLElement | null
      if (more) scrollElToCenter(more)
    }),
  )
}

// Open the most-recent project by default (when the timeline is shown and the reader isn't
// filtering/searching) so it's obvious projects expand — many readers don't realise they're tappable.
if (
  store.expandAll ||
  (props.first &&
    !store.compact &&
    store.activeFilter === 'all' &&
    !store.activeSkill &&
    !(store.skillQuery || '').trim())
)
  open.value = true

watch(
  () => store.activeFilter,
  () => {
    techOpen.value = false
  },
)
watch(
  () => store.activeSkill,
  () => {
    techOpen.value = false
  },
)
watch(
  () => store.skillQuery,
  () => {
    techOpen.value = false
  },
)
watch(
  () => store.recentOnly,
  () => {
    techOpen.value = false
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

const activeFilter = computed(() => store.activeFilter)
const activeSkill = computed(() => store.activeSkill)
const q = computed(() => (store.skillQuery || '').trim().toLowerCase())
const vkey = computed(() => props.company + '::' + props.p.project)
const hasVideoSlot = computed(() => !!(siteConfig().videos || {})[vkey.value])
const techList = computed(() => props.p.technologies || [])
const inFilter = computed(() =>
  projectInFilter(
    vkey.value,
    techList.value,
    (store.data && store.data.skills) || {},
    activeFilter.value,
  ),
)
const matchSkill = computed(() =>
  activeSkill.value ? projectUsesSkill(techList.value, activeSkill.value) : false,
)
const matchQuery = computed(() => !q.value || projectMatchesQuery(props.p, q.value))
const hidden = computed(
  () =>
    !inFilter.value || (activeSkill.value && !matchSkill.value) || (q.value && !matchQuery.value),
)
const roleTags = computed(() => {
  const labels = siteConfig().roleTagLabels || {}
  const order = (siteConfig().filters || []).map((f) => f.id)
  const idx = (id: string) => {
    const i = order.indexOf(id)
    return i === -1 ? 999 : i
  }
  return (props.tags || [])
    .filter((t) => labels[t])
    .slice()
    .sort((a, b) => idx(a) - idx(b))
    .map((t) => ({ id: t, label: labels[t] }))
})
const relevant = computed(() => {
  if (q.value) {
    return techList.value.filter((t: string) => queryHit(t, q.value))
  }
  if (activeSkill.value) {
    return techList.value.filter((t: string) => skillMatchesTech(t, activeSkill.value!))
  }
  if (activeFilter.value && activeFilter.value !== 'all') {
    return techList.value.filter((t: string) =>
      techRelevantToFilter(t, store.data!.skills, activeFilter.value),
    )
  }
  return null
})
/* Recent·5y view: show only the project's "main" techs (its authored `main` list, else 2 top
   per role the project covers — balanced across AI/Architect/Backend/Frontend/QA/DevOps), the
   rest behind "+N more". Suppressed while a filter / skill / search is active (those drive the
   `relevant` collapse below) so role filtering is untouched. */
const norm = (s: string): string => (s || '').toLowerCase().trim()
const mainTech = computed<string[]>(() => {
  const list = techList.value
  const curated = props.p.main
  if (curated && curated.length) {
    const picked: string[] = []
    curated.forEach((n) => {
      const hit = list.find((t) => norm(t) === norm(n))
      if (hit && !picked.includes(hit)) picked.push(hit)
    })
    return picked
  }
  const skills = (store.data && store.data.skills) || {}
  const trend = siteConfig().trendSkills
  // 2 most in-demand techs from each role the project belongs to (filter order), deduped
  const picked: string[] = []
  const seen = new Set<string>()
  ;(siteConfig().filters || [])
    .filter((f) => f.id !== 'all')
    .forEach((f) => {
      if (!projectInFilter(vkey.value, list, skills, f.id)) return
      list
        .filter((t) => !seen.has(t) && techRelevantToFilter(t, skills, f.id))
        .sort((a, b) => trendWeightFor(b, trend) - trendWeightFor(a, trend))
        .slice(0, PROJECT_MAIN_PER_ROLE)
        .forEach((t) => {
          picked.push(t)
          seen.add(t)
        })
    })
  // fallback (project matched no role): top-N by trend value
  if (!picked.length) {
    return list
      .map((t, i) => ({ t, i, w: trendWeightFor(t, trend) }))
      .sort((a, b) => b.w - a.w || a.i - b.i)
      .slice(0, PROJECT_MAIN_LIMIT)
      .map((x) => x.t)
  }
  return picked
})
const capValuable = computed(
  () =>
    store.recentOnly &&
    !q.value &&
    !activeSkill.value &&
    activeFilter.value === 'all' &&
    mainTech.value.length < techList.value.length,
)
/* the limited tech set: filter/skill/search relevance first (unchanged), else the Recent·5y cap */
const limited = computed<string[] | null>(() => {
  if (relevant.value != null) return relevant.value
  if (capValuable.value) return mainTech.value
  return null
})
const collapseTech = computed(
  () => limited.value != null && limited.value.length < techList.value.length,
)
const roleHead = computed(() => {
  const r = props.p.role || ''
  const i = r.lastIndexOf(' ')
  return i === -1 ? '' : r.slice(0, i + 1)
})
const roleLast = computed(() => {
  const r = props.p.role || ''
  const i = r.lastIndexOf(' ')
  return i === -1 ? r : r.slice(i + 1)
})
const outcomes = computed(() => ((siteConfig().projects || {})[vkey.value] || {}).outcomes || [])
const rest = computed(() =>
  collapseTech.value ? techList.value.filter((t: string) => !limited.value!.includes(t)) : [],
)
const shownTech = computed(() =>
  collapseTech.value
    ? techOpen.value && !store.printing
      ? [...limited.value!, ...rest.value]
      : limited.value
    : techList.value,
)

/* "NEW" (first appearance across all projects) + current-trend accent for each tech */
const marks = computed(() => {
  const firstApp = makeFirstAppearance(projectOccurrences(store.data?.work_experience))
  const itemTs = parsePeriodStartTs(props.p.period)
  return markChips(techList.value, firstApp, itemTs, siteConfig().trendSkills)
})
function mk(t: string) {
  return marks.value.get(t)
}

function achParts(a: string) {
  const idx = a.indexOf(': ')
  const head = idx > 0 && idx < 46 ? a.slice(0, idx) : null
  return { head, rest: head ? a.slice(idx + 2) : a }
}
</script>
