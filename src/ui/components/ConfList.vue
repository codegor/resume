<template>
  <div v-if="matching.length > 0" class="epoch-confs">
    <div class="epoch-confs-h" :style="{ '--ec': 'var(' + cv + ')' }">
      <t>Conferences & courses</t>
    </div>
    <conf-item v-for="(m, i) in shown" :key="i" :m="m" />
    <more-pill
      v-if="matching.length > 1"
      :open="open"
      :more="more"
      extra-class="conf-more"
      :more-text="$tc('+{n} more conference & courses', '+{n} more conferences & courses', more)"
      @toggle="open = !open"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useStore } from '@/composables/useStore'
import { tc as $tc } from '@/composables/i18n'
import { siteConfig } from '@/config'
import { skillInList, looseMatch, learnMatchesQuery, queryHit } from '@/utils/site-filters'
import type { Marker, TaggedEntry } from '@/types/config'

const props = defineProps<{ markers?: Marker[]; cv?: string }>()

const store = useStore()

const open = ref(false)

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
const matching = computed(() => {
  const af = activeFilter.value,
    as = store.activeSkill,
    q = (store.skillQuery || '').trim().toLowerCase()
  const entryOf = (m: Marker): TaggedEntry => {
    const title = m.title || ''
    return (
      (siteConfig().conferences || {})[title] ||
      (siteConfig().certificates || {})[title] ||
      ({} as TaggedEntry)
    )
  }
  return (props.markers || []).filter((m) => {
    const e = entryOf(m)
    const okF = af === 'all' || (e.filters || m.filters || []).indexOf(af) !== -1
    const okS =
      !as || skillInList(as, e.skills) || skillInList(as, m.skills) || looseMatch(as, m.title || '')
    const okQ =
      !q ||
      learnMatchesQuery(
        m.kind === 'certificate' ? 'certificate' : 'conference',
        m.title || '',
        q,
      ) ||
      (m.skills || []).some((s) => queryHit(s, q))
    return okF && okS && okQ
  })
})
const shown = computed(() =>
  open.value || store.printing ? matching.value : matching.value.slice(0, 1),
)
const more = computed(() => matching.value.length - 1)
</script>
