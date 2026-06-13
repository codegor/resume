<template>
  <div
    ref="root"
    :class="['epoch-group', 'side-' + side]"
    :style="{ '--ec': 'var(' + cv + ')', '--cloud': cloudCss }"
  >
    <div class="era-cloud-zone" aria-hidden="true"></div>
    <div :class="['epoch', 'side-' + side, { 'epoch-hidden': epochHidden }]">
      <span class="epoch-dot" :data-color="cv" :style="{ '--ec': 'var(' + cv + ')' }"></span>
      <div :class="['epoch-card', { 'is-min': epochHidden }]">
        <div class="epoch-inner">
          <div class="epoch-era" :style="{ '--ec': 'var(' + cv + ')' }">
            <span class="ddot"></span>{{ ecfg.era }}
          </div>
          <div class="epoch-title">{{ exp.company }}</div>
          <template v-if="!epochHidden">
            <div class="epoch-meta">
              <span class="epoch-period">{{ exp.period }}</span>
              <span v-if="exp.location" class="mtag">· {{ exp.location }}</span>
              <span v-if="exp.type" class="mtag">· {{ exp.type }}</span>
              <span v-if="exp.duration" class="mtag">· {{ exp.duration }}</span>
            </div>
            <p v-if="exp.summary" class="epoch-summary">{{ exp.summary }}</p>
            <div class="epoch-projects">
              <project
                v-for="(p, i) in shownProjects"
                :key="i"
                :company="exp.company"
                :p="p"
                :tags="tagsFor(p)"
                :ecolor-var="cv"
                :tech-tokens="techTokens"
              />
              <more-pill
                v-if="filterActive"
                :open="false"
                :more="hiddenByFilter"
                noun="project"
                @toggle="store.clearAll()"
              />
              <more-pill
                v-else-if="visibleProjects.length > 3"
                :open="projOpen"
                :more="moreRoles"
                noun="project"
                @toggle="projOpen = !projOpen"
              />
            </div>
            <conf-list :markers="markers" :cv="cv" />
          </template>
          <template v-else>
            <div class="proj-empty">{{ emptyText }}</div>
            <more-pill :open="false" :more="totalRoles" noun="project" @toggle="store.clearAll()" />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useStore } from '@/composables/useStore'
import { siteConfig } from '@/config'
import { t as $t } from '@/composables/i18n'
import { assetUrl } from '@/utils/dom'
import {
  projectInFilter,
  projectUsesSkill,
  projectMatchesQuery,
  tagsFor as tagsForFilter,
} from '@/utils/site-filters'
import type { WorkExperience, Project } from '@/types/resume'
import type { EpochConfig, Marker } from '@/types/config'

const props = defineProps<{
  exp: WorkExperience
  ecfg: EpochConfig
  markers?: Marker[]
  techTokens?: string[] | null
}>()

const store = useStore()

const projOpen = ref(false)

// Era-cloud background URL. The offline single-file build inlines a data URI onto
// `ecfg.cloud` (see vite.config inlineEraClouds) — prefer it so the cloud shows without
// a network fetch; otherwise load assets/eras/<year>.png (absolute, so it resolves at
// the domain root AND the /resume/ sub-path). Kept PNG-only: these tiny palette PNGs
// don't benefit from avif/webp (they re-encode larger).
const cloudUrl = computed(() => {
  const inlined = (props.ecfg && props.ecfg.cloud) || ''
  const u = inlined || assetUrl('assets/eras/' + props.ecfg.ghostYear + '.png')
  return `url("${u}")`
})

// Lazy-load the era-cloud image: keep the background `none` until the epoch scrolls
// near the viewport (or a print expands everything), so it's only fetched when reached.
// It's decorative → never blocks layout / the serpentine spine.
// Start loading this far ahead of the epoch entering the viewport.
const CLOUD_PRELOAD_MARGIN = '300px'
const root = ref<HTMLElement | null>(null)
const cloudVisible = ref(false)
const cloudCss = computed(() => (cloudVisible.value ? cloudUrl.value : 'none'))
let cloudIo: IntersectionObserver | undefined
onMounted(() => {
  if (!window.IntersectionObserver) {
    cloudVisible.value = true
    return
  }
  cloudIo = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (e.isIntersecting) {
          cloudVisible.value = true
          cloudIo && cloudIo.disconnect()
        }
      }),
    { rootMargin: CLOUD_PRELOAD_MARGIN },
  )
  if (root.value) cloudIo.observe(root.value)
})
onBeforeUnmount(() => cloudIo && cloudIo.disconnect())
watch(
  () => store.printing,
  (v) => {
    if (v) cloudVisible.value = true
  },
)

watch(
  () => store.expandTick,
  () => {
    projOpen.value = store.expandAll
  },
)
watch(projOpen, (v) => {
  if (!v) store.noteCollapsed()
})

const activeFilter = computed(() => store.activeFilter)
const activeSkill = computed(() => store.activeSkill)
const side = computed(() => props.ecfg.side || 'left')
const cv = computed(() => props.ecfg.colorVar || '--accent')
const q = computed(() => (store.skillQuery || '').trim().toLowerCase())
const epochRecent = computed(() => store.isRecentPeriod(props.exp.period || ''))
const visibleProjects = computed(() => {
  return (props.exp.projects || []).filter((p) => {
    const inF = projectInFilter(
      props.exp.company + '::' + p.project,
      p.technologies,
      (store.data && store.data.skills) || {},
      activeFilter.value,
    )
    const matchSkill = activeSkill.value
      ? projectUsesSkill(p.technologies, activeSkill.value)
      : true
    const recentOk = !store.recentOnly || epochRecent.value
    const queryOk = !q.value || projectMatchesQuery(p, q.value)
    return inF && (activeSkill.value ? matchSkill : true) && recentOk && queryOk
  })
})
const filterActive = computed(
  () => activeFilter.value !== 'all' || !!activeSkill.value || store.recentOnly || !!q.value,
)
const epochHidden = computed(() => visibleProjects.value.length === 0)
const matchingShown = computed(() => {
  if (filterActive.value) return visibleProjects.value
  return projOpen.value || store.printing
    ? visibleProjects.value
    : visibleProjects.value.slice(0, 3)
})
const shownProjects = computed(() => matchingShown.value)
const moreRoles = computed(() => visibleProjects.value.length - matchingShown.value.length)
const totalRoles = computed(() => (props.exp.projects || []).length)
const hiddenByFilter = computed(() => totalRoles.value - visibleProjects.value.length)
const emptyText = computed(() => {
  if (q.value) return $t('No projects match “{q}” in this era', { q: store.skillQuery.trim() })
  if (activeSkill.value)
    return $t('No projects with “{skill}” in this era', { skill: activeSkill.value })
  if (activeFilter.value !== 'all') {
    const f = (siteConfig().filters || []).find((d) => d.id === activeFilter.value)
    return $t('No {filter} projects in this era', {
      filter: (f && (f.label || f.id)) || activeFilter.value,
    })
  }
  if (store.recentOnly) return $t('No projects in the last 5 years in this era')
  return $t('No matching projects in this era')
})

function tagsFor(p: Project) {
  return tagsForFilter('project', props.exp.company + '::' + p.project)
}
</script>

<style scoped lang="scss">
.proj-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 56px;
  margin-bottom: 10px;
  font-family: var(--sans);
  font-size: 13px;
  color: var(--muted);
  text-align: center;
}
</style>
