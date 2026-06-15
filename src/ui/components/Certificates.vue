<template>
  <section-block id="certificates" :compact="true">
    <section-head
      :eyebrow="$t('06 — Courses, Certificates & Conferences')"
      :title="$t('Always learning')"
      :rule="true"
      :count="countText"
    />

    <div class="sub-h"><t>Courses & certificates</t></div>
    <div class="cert-grid">
      <learn-card
        v-for="c in shownCourses"
        :key="c.title"
        :item="c"
        type="certificate"
        :provider="cProvider"
        :image-always="true"
      />
    </div>
    <div v-if="q && !shownCourses.length" class="learn-empty">
      <t :params="{ q: store.skillQuery.trim() }">No courses or certificates match “{q}”</t>
    </div>
    <more-pill
      v-if="courseParts.secondary.length > 0"
      :open="courseOpen"
      :more="courseParts.secondary.length"
      :style="{ marginTop: '12px' }"
      :more-text="
        $tc(
          '+{n} more course & certificate',
          '+{n} more courses & certificates',
          courseParts.secondary.length,
        )
      "
      @toggle="courseOpen = !courseOpen"
    />
    <more-pill
      v-if="coursePrintMore > 0"
      :online="true"
      :more="coursePrintMore"
      :style="{ marginTop: '12px' }"
      :more-text="
        $tc('+{n} more course & certificate', '+{n} more courses & certificates', coursePrintMore)
      "
    />

    <template v-if="confs.length > 0">
      <div class="sub-h" style="margin-top: 42px"><t>Conferences attended</t></div>
      <div class="conf-grid">
        <learn-card
          v-for="c in shownConfs"
          :key="c.title"
          :item="c"
          type="conference"
          :provider="confProvider"
          :image-always="true"
        />
      </div>
      <div v-if="q && !shownConfs.length" class="learn-empty">
        <t :params="{ q: store.skillQuery.trim() }">No conferences match “{q}”</t>
      </div>
      <more-pill
        v-if="confParts.secondary.length > 0"
        :open="confOpen"
        :more="confParts.secondary.length"
        :more-text="
          $tc('+{n} more conference', '+{n} more conferences', confParts.secondary.length)
        "
        :style="{ marginTop: '12px' }"
        @toggle="confOpen = !confOpen"
      />
      <more-pill
        v-if="confPrintMore > 0"
        :online="true"
        :more="confPrintMore"
        :style="{ marginTop: '12px' }"
        :more-text="$tc('+{n} more conference', '+{n} more conferences', confPrintMore)"
      />
    </template>
  </section-block>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useStore } from '@/composables/useStore'
import { t as $t, tc as $tc } from '@/composables/i18n'
import { siteConfig } from '@/config'
import {
  inFilter,
  learnMatchesQuery,
  skillInList,
  looseMatch,
  type ContentType,
} from '@/utils/site-filters'
import type { LearnItem } from '@/types/resume'

const store = useStore()

const courseOpen = ref(false)
const confOpen = ref(false)
const vw = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)

let onR: () => void
let raf = 0

onMounted(() => {
  onR = () => {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => {
      vw.value = window.innerWidth
    })
  }
  window.addEventListener('resize', onR)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onR)
})

watch(
  () => store.activeFilter,
  () => {
    courseOpen.value = store.expandAll
    confOpen.value = store.expandAll
    unhide()
  },
)
watch(
  () => store.activeSkill,
  () => {
    courseOpen.value = store.expandAll
    confOpen.value = store.expandAll
    unhide()
  },
)
watch(
  () => store.skillQuery,
  () => {
    courseOpen.value = store.expandAll
    confOpen.value = store.expandAll
    unhide()
  },
)
watch(
  () => store.expandTick,
  () => {
    courseOpen.value = store.expandAll
    confOpen.value = store.expandAll
    unhide()
  },
)
watch(courseOpen, (v) => {
  unhide()
  if (!v) store.noteCollapsed()
})
watch(confOpen, (v) => {
  unhide()
  if (!v) store.noteCollapsed()
})

const activeFilter = computed(() => store.activeFilter)
const q = computed(() => (store.skillQuery || '').trim().toLowerCase())
const data = computed(() => store.data!)
const cProvider = computed(
  () => (data.value.professional_courses && data.value.professional_courses.provider) || '',
)
const confProvider = computed(
  () => (data.value.conferences && data.value.conferences.provider) || '',
)
/* under "Recent · 5y" the Always-learning section keeps only items dated within the
   window (no visible change while every item is recent — future-proofs older entries). */
const recentOk = (c: LearnItem): boolean =>
  !store.recentOnly || store.isRecentPeriod(c.date || c.year || '')
const courses = computed(() =>
  sortItems(
    ((data.value.professional_courses && data.value.professional_courses.items) || []).filter(
      recentOk,
    ),
    (c) => (c.date ? ts(c.date) : ts(c.year)),
  ),
)
const confs = computed(() =>
  sortItems(
    ((data.value.conferences && data.value.conferences.items) || []).filter(recentOk),
    (c) => ts(c.date),
  ),
)
const certCount = computed(() => courses.value.filter((c) => c.certificate).length)
const countText = computed(() => {
  if (q.value) {
    const c = courseParts.value.primary.length,
      f = confParts.value.primary.length
    return $t('{courses} · {conferences} match “{q}”', {
      courses: $tc('{n} course', '{n} courses', c),
      conferences: $tc('{n} conference', '{n} conferences', f),
      q: store.skillQuery.trim(),
    })
  }
  const summary = $t('{certificates} certificates · {conferences} conferences', {
    certificates: certCount.value,
    conferences: confs.value.length,
  })
  return cProvider.value ? summary + ' · ' + cProvider.value : summary
})
/* default visible counts: desktop 4 courses / 3 confs, iPad 3, phone 1 (rest behind "+N more") */
const courseCap = computed(() => (vw.value <= 980 ? 1 : vw.value <= 1180 ? 3 : 4))
const confCap = computed(() => (vw.value <= 980 ? 1 : 3))
const courseParts = computed(() => partition(courses.value, 'certificate', courseCap.value))
const confParts = computed(() => partition(confs.value, 'conference', confCap.value))
/* print under Recent·5y keeps the document short: at most this many per sub-section, with a
   "+N more on interactive online" link standing in for the rest (incl. older items). */
const PRINT_RECENT_CAP = 2
const shownCourses = computed(() => {
  const all = [...courseParts.value.primary, ...courseParts.value.secondary]
  if (store.printing) return store.recentOnly ? all.slice(0, PRINT_RECENT_CAP) : all
  return courseOpen.value ? all : courseParts.value.primary
})
const shownConfs = computed(() => {
  const all = [...confParts.value.primary, ...confParts.value.secondary]
  if (store.printing) return store.recentOnly ? all.slice(0, PRINT_RECENT_CAP) : all
  return confOpen.value ? all : confParts.value.primary
})
/* full counts (incl. items the Recent·5y filter dropped) → how many are only online in print */
const allCoursesCount = computed(
  () => ((data.value.professional_courses && data.value.professional_courses.items) || []).length,
)
const allConfsCount = computed(
  () => ((data.value.conferences && data.value.conferences.items) || []).length,
)
const coursePrintMore = computed(() =>
  store.printing && store.recentOnly
    ? Math.max(0, allCoursesCount.value - shownCourses.value.length)
    : 0,
)
const confPrintMore = computed(() =>
  store.printing && store.recentOnly
    ? Math.max(0, allConfsCount.value - shownConfs.value.length)
    : 0,
)

function ts(s?: string): number {
  const t = Date.parse(String(s || ''))
  return isNaN(t) ? -Infinity : t
}
function sortItems(list: LearnItem[], dateOf: (x: LearnItem) => number): LearnItem[] {
  return [...list].sort((a, b) => {
    const pa = typeof a.pin === 'number' ? a.pin : null,
      pb = typeof b.pin === 'number' ? b.pin : null
    if (pa !== null || pb !== null) {
      if (pa === null) return 1
      if (pb === null) return -1
      if (pb !== pa) return pb - pa
    }
    return dateOf(b) - dateOf(a)
  })
}
function partition(
  list: LearnItem[],
  type: ContentType,
  cap: number,
): { primary: LearnItem[]; secondary: LearnItem[] } {
  const af = activeFilter.value,
    as = store.activeSkill,
    qv = q.value
  if (af === 'all' && !as && !qv) return { primary: list.slice(0, cap), secondary: list.slice(cap) }
  const match = list.filter((it) => {
    const okF = af === 'all' || inFilter(type, it.title, af)
    const okS = !as || matchesSkill(type, it.title, as)
    const okQ = !qv || learnMatchesQuery(type, it.title, qv)
    return okF && okS && okQ
  })
  if (!match.length) return qv ? { primary: [], secondary: list } : { primary: list, secondary: [] }
  return { primary: match, secondary: list.filter((it) => match.indexOf(it) === -1) }
}
function matchesSkill(type: string, title: string, skill: string): boolean {
  const map = (type === 'certificate' ? siteConfig().certificates : siteConfig().conferences) || {}
  const entry = map[title] || {}
  return skillInList(skill, entry.skills) || looseMatch(skill, title)
}
function unhide() {
  nextTick(() => {
    const sec = document.getElementById('certificates')
    if (sec)
      sec.querySelectorAll<HTMLElement>('.reveal-up').forEach((el) => {
        el.style.opacity = '1'
        el.style.transform = 'none'
      })
  })
}
</script>

<style scoped lang="scss">
.cert-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 18px;
}

.sub-h {
  font-family: var(--sans);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent);
  margin: 0 0 16px;
}

.conf-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.learn-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 96px;
  font-family: var(--sans);
  font-size: 13px;
  color: var(--muted);
  text-align: center;
}
</style>
