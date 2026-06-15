<template>
  <div id="filterbar" class="filterbar" :class="{ 'is-collapsed': collapsed }">
    <div v-if="collapsed" class="wrap fb-rail">
      <button class="fb-more" :aria-label="$t('Open filters')" @click="store.setFocusOpen(true)">
        <icon name="funnel-more" />
        <span v-if="activeCount" class="fb-badge">{{ activeCount }}</span>
      </button>
      <div ref="railScroll" class="fb-rail-scroll">
        <button class="chip on" @click="store.setFocusOpen(true)">
          {{ activeFilterLabel || $t('All') }}
        </button>
        <span v-if="store.activeSkill" class="sum-pill skill">
          <icon name="spark" /><span class="tx">{{ store.activeSkill }}</span>
        </span>
        <span v-if="store.skillQuery.trim()" class="sum-pill search">
          <icon name="search" /><span class="tx">“{{ store.skillQuery.trim() }}”</span>
        </span>
        <button
          v-if="hasAny"
          class="clear-x"
          :aria-label="$t('Clear filters and search')"
          @click="store.clearFilters()"
        >
          <icon name="x" />
        </button>
        <span v-if="otherFilters.length" class="rail-div" aria-hidden="true"></span>
        <button v-for="f in otherFilters" :key="f.id" class="chip" @click="onFilterClick(f.id)">
          {{ f.label
          }}<span v-if="f.id !== 'all' && counts[f.id] != null" class="ct">{{ counts[f.id] }}</span>
        </button>
      </div>
      <span class="rail-fade" aria-hidden="true"></span>
    </div>

    <div v-else class="wrap filterbar-inner">
      <div class="fb-row" @click="collapse">
        <span class="filter-label"><t>Focus</t></span>
        <button v-if="store.isMobile" class="f-collapse" :aria-label="$t('Collapse filters')">
          <icon name="chevron" />
        </button>
      </div>
      <div class="chips">
        <button
          v-for="f in filters"
          :key="f.id"
          :class="['chip', { on: store.activeFilter === f.id }]"
          @click="onFilterClick(f.id)"
        >
          {{ f.label
          }}<span v-if="f.id !== 'all' && counts[f.id] != null" class="ct">{{ counts[f.id] }}</span>
        </button>
        <button
          v-if="store.activeSkill"
          class="chip on skill-on"
          :title="$t('Stop highlighting {skill}', { skill: store.activeSkill })"
          @click="store.setSkill(null)"
        >
          <span class="lbl">{{ store.activeSkill }}</span
          ><span class="x">✕</span>
        </button>
        <button
          v-if="store.activeFilter !== 'all'"
          :class="['filter-clear', { compact: store.activeSkill }]"
          :aria-label="$t('Clear focus filter')"
          :title="$t('Clear focus filter')"
          @click="store.setFilter('all')"
        >
          <span class="fc-word"><t>Clear</t></span
          ><span class="fc-x">✕</span>
        </button>
      </div>
      <div class="fb-search" @click.stop>
        <icon name="search" class="ss-ic" />
        <input
          type="search"
          :value="store.skillQuery"
          :placeholder="$t('Search a skill — e.g. RabbitMQ, RAG…')"
          :aria-label="$t('Search skills')"
          @input="onSearch"
          @keydown.enter="onSearchEnter"
        />
        <button
          v-if="qFound"
          :class="['ss-count', { on: foundOpen }]"
          :aria-expanded="foundOpen"
          @click="foundOpen = !foundOpen"
        >
          {{ qFound.total }} <t>found</t> <span class="ssc-caret">▾</span>
        </button>
        <button
          v-if="store.skillQuery"
          class="ss-clear"
          :aria-label="$t('Clear search')"
          @click="store.skillQuery = ''"
        >
          <icon name="x" />
        </button>
        <div v-if="foundOpen && qFound" class="found-panel">
          <div v-if="qFound.total > 0" class="fp-head">
            <t :params="{ q: store.skillQuery.trim() }">Matches for “{q}”</t>
          </div>
          <template v-if="qFound.total > 0">
            <button class="fp-row" @click="jump('skills')">
              <span class="fp-n">{{ qFound.skills }}</span
              ><span class="fp-l"><tc one="skill" other="skills" :n="qFound.skills" /></span
              ><icon name="arrow" class="fp-go" />
            </button>
            <button class="fp-row" @click="jump('timeline')">
              <span class="fp-n">{{ qFound.projects }}</span
              ><span class="fp-l"><tc one="project" other="projects" :n="qFound.projects" /></span
              ><icon name="arrow" class="fp-go" />
            </button>
            <button class="fp-row" @click="jump('certificates')">
              <span class="fp-n">{{ qFound.learn }}</span
              ><span class="fp-l"
                ><tc
                  one="course &amp; conference"
                  other="courses &amp; conferences"
                  :n="qFound.learn" /></span
              ><icon name="arrow" class="fp-go" />
            </button>
          </template>
          <div v-else class="fp-empty">
            <t :params="{ q: store.skillQuery.trim() }"
              >Nothing matches “{q}” — try a shorter spelling (e.g. “postgres”).</t
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useStore } from '@/composables/useStore'
import { siteConfig } from '@/config'
import { scrollToId } from '@/utils/dom'
import { projectInFilter } from '@/utils/site-filters'
import { searchFoundCounts } from '@/utils/skills'

const store = useStore()

const foundOpen = ref(false)

const filters = computed(() => siteConfig().filters || [])
const counts = computed(() => {
  const c: Record<string, number> = {}
  const data = store.data
  if (!data) return c
  const skills = data.skills || {}
  const fids = (siteConfig().filters || []).map((f) => f.id).filter((id) => id !== 'all')
  ;(data.work_experience || []).forEach((exp) =>
    (exp.projects || []).forEach((p) => {
      const key = exp.company + '::' + p.project
      fids.forEach((id) => {
        if (projectInFilter(key, p.technologies, skills, id)) c[id] = (c[id] || 0) + 1
      })
    }),
  )
  return c
})
const qFound = computed(() => {
  const q = (store.skillQuery || '').trim().toLowerCase()
  return searchFoundCounts(store.data, q)
})

const collapsed = computed(() => store.isMobile && !store.focusOpen)
const activeFilterLabel = computed(() => {
  const f = filters.value.find((x) => x.id === store.activeFilter)
  return f && f.id !== 'all' ? f.label : null
})
const otherFilters = computed(() => filters.value.filter((f) => f.id !== store.activeFilter))
const hasAny = computed(
  () => store.activeFilter !== 'all' || !!store.activeSkill || !!store.skillQuery.trim(),
)
const activeCount = computed(
  () =>
    (store.activeFilter !== 'all' ? 1 : 0) +
    (store.activeSkill ? 1 : 0) +
    (store.skillQuery.trim() ? 1 : 0),
)

// reset the rail's horizontal scroll (filter change / collapse / page scroll) so a left-over swipe
// never hides the active filter + ✕
const railScroll = ref<HTMLElement | null>(null)
function resetRailScroll(): void {
  if (railScroll.value) railScroll.value.scrollLeft = 0
}
watch(
  () => [store.activeFilter, store.activeSkill, store.skillQuery, collapsed.value],
  () => nextTick(resetRailScroll),
)

watch(
  () => store.skillQuery,
  () => {
    foundOpen.value = false
  },
)

let onDocFb: () => void
let railRaf = 0
const onPageScroll = (): void => {
  if (!collapsed.value || railRaf) return
  railRaf = requestAnimationFrame(() => {
    railRaf = 0
    resetRailScroll()
  })
}
onMounted(() => {
  onDocFb = () => {
    foundOpen.value = false
  }
  document.addEventListener('click', onDocFb)
  window.addEventListener('scroll', onPageScroll, { passive: true })
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocFb)
  window.removeEventListener('scroll', onPageScroll)
  if (railRaf) cancelAnimationFrame(railRaf)
})

function collapse(): void {
  if (store.isMobile) store.setFocusOpen(false)
}
function onFilterClick(id: string): void {
  store.setFilter(id)
  if (store.isMobile && store.focusOpen) store.setFocusOpen(false)
  // Jump to the role's Skills group (Skills shows only the active role's group). Selecting a role
  // also drops Headlines (App.vue watcher) → the page height changes, so scroll on the NEXT tick,
  // after that relayout, or we land off-target.
  nextTick(() => scrollToId('skills'))
}
function onSearch(e: Event) {
  const was = (store.skillQuery || '').trim()
  store.skillQuery = (e.target as HTMLInputElement).value
  // first keystroke jumps to Skills; App.vue keeps the bar open while the input is focused so the
  // jump can't collapse the search out from under the user
  if (!was && store.skillQuery.trim()) scrollToId('skills')
}
function onSearchEnter(e: KeyboardEvent): void {
  // blur so a following finger-scroll can collapse the bar (focused input is kept open in App.vue)
  ;(e.target as HTMLInputElement).blur()
}
function jump(id: string) {
  foundOpen.value = false
  scrollToId(id)
}
</script>

<style scoped lang="scss">
.filterbar {
  position: sticky;
  top: 60px;
  z-index: 50;
  margin-top: 104px;
  background: color-mix(in srgb, var(--bg) 90%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
}

.filterbar-inner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 0;
  flex-wrap: wrap;
}

.filter-label {
  font-family: var(--sans);
  font-size: 10.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
  margin-right: 4px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.chip {
  font-family: var(--sans);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.02em;
  padding: 7px 14px;
  border-radius: 40px;
  border: 1px solid var(--ink);
  background: transparent;
  color: var(--ink);
  transition: all 0.16s ease;
  white-space: nowrap;
}

.chip:hover {
  background: var(--ink);
  color: var(--bg);
}

.chip.on {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-ink);
}

.chip .ct {
  opacity: 0.5;
  margin-left: 5px;
  font-size: 11px;
}

.skill-on {
  display: inline-flex;
  align-items: center;
  max-width: 90px; /* ≈ the "DevOps 19" focus chip */
}

.skill-on .lbl {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skill-on .x {
  flex: none;
  opacity: 0.6;
  margin-left: 5px;
  font-size: 11px;
}

.filter-clear {
  font-family: var(--sans);
  font-size: 12px;
  color: var(--muted);
  background: none;
  border: 0;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.filter-clear:hover {
  color: var(--accent);
}

/* tablet only: when the active-skill pill crowds the ~2-line chip row, compact
   "Clear" to a "✕" so it stays on the same line. On phones (≤980px) the chips
   wrap over more lines with room to spare, so the full word "Clear" is kept;
   desktop (≥1181px) always shows the word too. */
.filter-clear .fc-x {
  display: none;
  font-size: 13px;
}

@media (min-width: 981px) and (max-width: 1180px) {
  .filter-clear.compact .fc-word {
    display: none;
  }

  .filter-clear.compact .fc-x {
    display: inline;
  }
}

/* search field in the Focus row — always reachable (the bar is sticky) */
.fb-search {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 200px;
  max-width: 330px;
  margin-left: auto;
  padding: 6px 12px;
  border: 1px solid var(--line);
  border-radius: 40px;
  background: var(--surface);
  transition: border-color 0.15s ease;
  position: relative;
}

.fb-search:focus-within {
  border-color: var(--accent);
}

.fb-search input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  font-family: var(--sans);
  font-size: 12.5px;
  color: var(--ink);
}

.fb-search input::placeholder {
  color: var(--faint);
}

/* dark theme: --faint/--line sink into the dark surface — lift them one step */
[data-theme='dark'] .fb-search {
  border-color: color-mix(in srgb, var(--ink) 24%, transparent);
}

[data-theme='dark'] .fb-search input::placeholder {
  color: var(--muted);
}

.fb-search input::-webkit-search-cancel-button {
  display: none;
}

@media (max-width: 1180px) {
  .fb-search {
    max-width: none;
    flex-basis: 100%;
    margin-left: 0;
  }
}

/* transparent on desktop so the label stays a direct flex child of .filterbar-inner */
.fb-row {
  display: contents;
}

/* .filterbar-inner page-frame padding pulled from _hero (mobile) + _edu-lang (tablet) */
@media (max-width: 980px) {
  .filterbar-inner {
    padding: 13px 22px;
  }

  .fb-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 9px;
    cursor: pointer;
  }

  .f-collapse {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    margin-right: -4px;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--muted);
    transition: all 0.15s ease;
  }

  .f-collapse:hover {
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);
  }

  .f-collapse svg {
    width: 18px;
    height: 18px;
  }

  .fb-rail {
    position: relative;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 9px 22px; /* match .filterbar-inner's page frame (overrides .wrap's own padding) */
  }

  .fb-more {
    position: relative;
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 32px;
    border-radius: 9px;
    border: 1px solid color-mix(in srgb, var(--accent) 38%, var(--line));
    background: color-mix(in srgb, var(--accent) 13%, var(--surface));
    color: var(--accent);
  }

  .fb-more svg {
    width: 17px;
    height: 17px;
  }

  .fb-badge {
    position: absolute;
    top: -6px;
    right: -6px;
    min-width: 17px;
    height: 17px;
    padding: 0 4px;
    border-radius: 9px;
    background: var(--accent);
    color: var(--accent-ink);
    font-family: var(--sans);
    font-size: 10.5px;
    font-weight: 700;
    line-height: 17px;
    text-align: center;
  }

  .fb-rail-scroll {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 7px;
    overflow-x: auto;
    padding: 2px 30px 2px 2px;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .fb-rail-scroll::-webkit-scrollbar {
    height: 0;
  }

  .fb-rail-scroll > * {
    flex: none;
  }

  .rail-div {
    flex: none;
    width: 1px;
    height: 22px;
    margin: 0 3px;
    background: var(--line);
  }

  .rail-fade {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 34px;
    pointer-events: none;
    background: linear-gradient(90deg, transparent, var(--bg) 78%);
  }

  .sum-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
    padding: 5px 11px;
    border-radius: 20px;
    font-family: var(--sans);
    font-size: 11.5px;
    font-weight: 600;
  }

  .sum-pill svg {
    flex: none;
    width: 12px;
    height: 12px;
  }

  .sum-pill .tx {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sum-pill.skill {
    max-width: 88px;
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 16%, var(--surface));
    border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
  }

  .sum-pill.search {
    max-width: 150px;
    color: var(--ink-soft);
    background: var(--surface);
    border: 1px solid var(--line);
  }

  .clear-x {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--muted);
  }

  .clear-x:hover {
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 14%, transparent);
  }

  .clear-x svg {
    width: 14px;
    height: 14px;
  }
}

@media (min-width: 981px) and (max-width: 1180px) {
  .filterbar-inner {
    padding-left: 40px;
    padding-right: 40px;
  }
}
</style>
