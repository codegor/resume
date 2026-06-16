<template>
  <!-- NOT :compact — the section must stay visible in Headlines so it can show the reveal
       button/print link (the [data-compact] .compact-hide rule would display:none the whole
       section). The compact collapse is handled by the v-if branches below. -->
  <section-block id="timeline">
    <section-head
      :eyebrow="$t('03 — Experience')"
      :title="$t('A timeline of my work')"
      :rule="true"
      :count="store.compact ? '' : headCount"
    />
    <!-- Headlines collapse: show a faded TEASER — a real glimpse of the timeline start that fades
         out into the page (like a news-site "preview → read more") — with a reveal control at the
         foot: interactive → a button (showProjects keeps Recent·5y); print → an "online" link.
         The teaser renders the actual most-recent epoch (responsive: desktop spine / mobile column),
         so it previews exactly what opens. -->
    <div v-if="store.compact" class="timeline timeline-teaser">
      <div class="timeline-teaser-clip" aria-hidden="true">
        <timeline-spine :recompute-key="recomputeKey" />
        <div class="epochs">
          <epoch
            v-if="shownWork[0]"
            :exp="shownWork[0]"
            :ecfg="ecfgFor(shownWork[0], 0)"
            :markers="markersByEpoch[shownWork[0].period || ''] || []"
            :tech-tokens="techTokens"
            :preview="true"
          />
        </div>
      </div>
      <a
        v-if="store.printing"
        class="more-pill more-online timeline-reveal"
        :href="onlineResumeUrl()"
        >{{
          $t(
            'See the projects, conferences & courses on the timeline — on the interactive, AI-ready online version',
          )
        }}</a
      >
      <div v-else class="timeline-reveal-row">
        <button class="more-pill timeline-reveal" @click="store.showProjects()">
          <span><t>Show recent projects, conferences & courses on the timeline</t></span
          ><span class="mp-arrow"> ▾</span>
        </button>
      </div>
    </div>
    <div v-else ref="container" class="timeline">
      <timeline-spine :recompute-key="recomputeKey" />
      <div class="epochs">
        <epoch
          v-for="(exp, i) in shownWork"
          :key="i"
          :exp="exp"
          :ecfg="ecfgFor(exp, i)"
          :markers="markersByEpoch[exp.period || ''] || []"
          :tech-tokens="techTokens"
          :first-epoch="i === 0"
        />
        <div v-if="hiddenEpochCount > 0" class="epoch-more-row">
          <more-pill
            :open="false"
            :more="hiddenEpochCount"
            :online="true"
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
import { onlineResumeUrl } from '@/utils/dom'
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

<style scoped lang="scss">
.timeline-reveal-row {
  display: flex;
  justify-content: center;
  margin: 8px 0;
}

.timeline-reveal {
  margin: 8px 0;
}

/* Headlines teaser: a real glimpse of the timeline that fades out via an alpha mask (so it blends
   to whatever page bg — cream on screen, white in print) with the reveal control pulled up over it. */
.timeline-teaser {
  position: relative;
}

.timeline-teaser-clip {
  position: relative;

  /* left bleed so the epoch dot (sits at left:-6px) isn't sliced by overflow:hidden — the negative
     margin + equal padding widens the clip leftward while keeping the content aligned. */
  margin-left: -16px;
  padding-left: 16px;
  max-height: 190px; /* just the era intro (era · company · period · summary) — fades before the cards */
  overflow: hidden;
  pointer-events: none; /* the preview is a promo, not interactive — only the reveal control acts */
  mask-image: linear-gradient(to bottom, #000 56%, transparent 98%);
}

.timeline-teaser > .timeline-reveal-row,
.timeline-teaser > a.timeline-reveal {
  position: relative;
  z-index: 2;
  margin-top: 18px; /* sit BELOW the faded preview with a little empty space, not over it */
}

/* opaque button so the faded preview behind it doesn't bleed through and hurt readability */
.timeline-teaser > .timeline-reveal-row .timeline-reveal {
  background: color-mix(in srgb, var(--ink) 5%, var(--bg));
}

.timeline-teaser > .timeline-reveal-row .timeline-reveal:hover {
  background: color-mix(in srgb, var(--accent) 10%, var(--bg));
}

@media (max-width: 980px) {
  .timeline-teaser-clip {
    max-height: 224px;
  }
}
</style>
