<template>
  <div id="filterbar" class="filterbar">
    <div class="wrap filterbar-inner">
      <span class="filter-label"><t>Focus</t></span>
      <div class="chips">
        <button
          v-for="f in filters"
          :key="f.id"
          :class="['chip', { on: store.activeFilter === f.id }]"
          @click="store.setFilter(f.id)"
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
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
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

watch(
  () => store.skillQuery,
  () => {
    foundOpen.value = false
  },
)

let onDocFb: () => void
onMounted(() => {
  onDocFb = () => {
    foundOpen.value = false
  }
  document.addEventListener('click', onDocFb)
})
onBeforeUnmount(() => document.removeEventListener('click', onDocFb))

function onSearch(e: Event) {
  const was = (store.skillQuery || '').trim()
  store.skillQuery = (e.target as HTMLInputElement).value
  if (!was && store.skillQuery.trim()) scrollToId('skills')
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
   "Clear" to a "✕" so it stays on the same line. On phones (≤820px) the chips
   wrap over more lines with room to spare, so the full word "Clear" is kept;
   desktop (≥1181px) always shows the word too. */
.filter-clear .fc-x {
  display: none;
  font-size: 13px;
}

@media (min-width: 821px) and (max-width: 1180px) {
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

/* .filterbar-inner page-frame padding pulled from _hero (mobile) + _edu-lang (tablet) */
@media (max-width: 820px) {
  .filterbar-inner {
    padding: 13px 22px;
  }
}

@media (min-width: 821px) and (max-width: 1180px) {
  .filterbar-inner {
    padding-left: 40px;
    padding-right: 40px;
  }
}
</style>
