<template>
  <section-block id="timeline" :compact="true">
    <section-head
      :eyebrow="$t('03 — Experience')"
      :title="$t('A timeline of my work')"
      :rule="true"
      :count="headCount"
    />
    <div ref="container" class="timeline">
      <timeline-spine :recompute-key="recomputeKey" />
      <div class="epochs">
        <epoch
          v-for="(exp, i) in shownWork"
          :key="i"
          :exp="exp"
          :ecfg="ecfgFor(exp, i)"
          :markers="markersByEpoch[exp.period || ''] || []"
          :tech-tokens="techTokens"
        />
        <div v-if="hiddenEpochCount > 0" class="epoch-more-row">
          <more-pill
            :open="false"
            :more="hiddenEpochCount"
            :more-text="
              store.printing
                ? $tc('+{n} earlier era', '+{n} earlier eras', hiddenEpochCount)
                : $tc(
                    '+{n} earlier era — show all',
                    '+{n} earlier eras — show all',
                    hiddenEpochCount,
                  )
            "
            @toggle="store.clearAll()"
          />
        </div>
      </div>
    </div>
  </section-block>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useStore } from '@/composables/useStore'
import { siteConfig } from '@/config'
import { t as $t, tc as $tc } from '@/composables/i18n'
import {
  tokensForFilter,
  projectInFilter,
  projectUsesSkill,
  projectMatchesQuery,
} from '@/utils/site-filters'
import type { WorkExperience } from '@/types/resume'
import type { Marker, EpochConfig } from '@/types/config'

const store = useStore()

// An epoch is highlighted as "centered" only if its middle is within this fraction of
// the viewport height from the centre line — keeps the highlight from latching onto an
// epoch that's barely on screen.
const CENTERED_MAX_DIST_VH = 0.65

const container = ref<HTMLElement | null>(null)

let _onScroll: (() => void) | undefined

const work = computed(() => store.data!.work_experience || [])
const shownWork = computed(() => {
  if (!store.recentOnly) return work.value
  return (work.value || []).filter((exp) => store.isRecentPeriod(exp.period || ''))
})
const hiddenEpochCount = computed(() => {
  if (!store.recentOnly) return 0
  return (work.value || []).length - shownWork.value.length
})
const conferences = computed(() => store.data!.conferences)
const techTokens = computed(() => tokensForFilter(store.data!.skills, store.activeFilter))
const recomputeKey = computed(
  () =>
    store.activeFilter + '|' + store.activeSkill + '|' + store.recentOnly + '|' + store.skillQuery,
)
const q = computed(() => (store.skillQuery || '').trim().toLowerCase())
/* projects matching the free-text query (under all current view conditions) */
const qCount = computed(() => {
  if (!q.value) return 0
  let n = 0
  ;(shownWork.value || []).forEach((exp) => {
    const recentOk = !store.recentOnly || store.isRecentPeriod(exp.period || '')
    if (!recentOk) return
    ;(exp.projects || []).forEach((p) => {
      const inF = projectInFilter(
        exp.company + '::' + p.project,
        p.technologies,
        store.data!.skills || {},
        store.activeFilter,
      )
      const okS = store.activeSkill ? projectUsesSkill(p.technologies, store.activeSkill) : true
      if (inF && okS && projectMatchesQuery(p, q.value)) n++
    })
  })
  return n
})
const headCount = computed(() => {
  if (q.value)
    return $tc('{n} project match “{q}”', '{n} projects match “{q}”', qCount.value, {
      q: store.skillQuery.trim(),
    })
  return $t('Tap a card to expand · tap a tech to jump to the skill')
})
const cfg = computed(() => siteConfig())
const markersByEpoch = computed(() => {
  const map: Record<string, Marker[]> = {}
  ;(cfg.value.markers || []).forEach((m) => {
    const ep = m.epoch || ''
    ;(map[ep] = map[ep] || []).push(m)
  })
  const recentEpoch = (work.value && work.value[0] && work.value[0].period) || null
  if (recentEpoch && conferences.value && conferences.value.items) {
    conferences.value.items.forEach((c) => {
      ;(map[recentEpoch] = map[recentEpoch] || []).push({
        kind: 'conference',
        title: c.title,
        sub: conferences.value?.provider || c.location || '',
        year: c.date,
      })
    })
  }
  const courses = store.data!.professional_courses
  if (recentEpoch && courses && courses.items) {
    courses.items.forEach((c) => {
      ;(map[recentEpoch] = map[recentEpoch] || []).push({
        kind: 'certificate',
        title: c.title,
        sub: courses.provider || '',
        year: c.date || c.year,
      })
    })
  }
  const MONTHS: Record<string, number> = {
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12,
  }
  const markerTime = (m: Marker) => {
    const s = String(m.year || '').toLowerCase()
    const y = Number((s.match(/\d{4}/) || ['0'])[0])
    let mo = 0
    for (const k in MONTHS) {
      if (s.includes(k)) {
        mo = MONTHS[k]
        break
      }
    }
    return y * 100 + mo
  }
  Object.keys(map).forEach((k) => map[k].sort((a, b) => markerTime(b) - markerTime(a)))
  return map
})

function ecfgFor(exp: WorkExperience, i: number): EpochConfig {
  return (
    (cfg.value.epochs || {})[exp.period || ''] || {
      side: i % 2 ? 'right' : 'left',
      colorVar: '--accent',
      ghostYear: (exp.period || '').slice(-4),
      era: '',
    }
  )
}
function onScroll() {
  const cont = container.value
  if (!cont) return
  const mid = window.innerHeight / 2
  let best: Element | null = null,
    bd = 1e9
  cont.querySelectorAll('.epoch:not(.marker)').forEach((ep) => {
    const r = ep.getBoundingClientRect(),
      c = r.top + r.height / 2,
      dist = Math.abs(c - mid)
    if (dist < bd) {
      bd = dist
      best = ep
    }
    ep.classList.remove('centered')
  })
  if (best && bd < window.innerHeight * CENTERED_MAX_DIST_VH)
    (best as Element).classList.add('centered')
}

onMounted(() => {
  _onScroll = () => onScroll()
  window.addEventListener('scroll', _onScroll, { passive: true })
  onScroll()
})
onBeforeUnmount(() => {
  if (_onScroll) window.removeEventListener('scroll', _onScroll)
})

watch(recomputeKey, () => nextTick(() => onScroll()))
</script>
