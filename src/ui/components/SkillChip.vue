<template>
  <button
    :class="[
      'ttag',
      isSkill ? 'skill-linked' : 'filter-linked',
      { 'ttag-trend': showTrend, 'ttag-new-soft': showSoft },
    ]"
    :title="
      isSkill ? 'Show ' + label + ' across skills & projects' : 'Filter everything by ' + label
    "
    @click.stop="store.onTechClick(label!)"
  >
    <icon :name="isSkill ? 'jump' : 'filter'" class="ttag-ic" /><span class="ttag-label">{{
      label
    }}</span
    ><span v-if="showPill" class="ttag-new">NEW</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '@/composables/useStore'
import { techIsSkill } from '@/utils/site-filters'

const props = defineProps<{
  label?: string
  isNew?: boolean // first chronological appearance of this skill in its scope
  pill?: boolean // among this item's new skills, top-3 by trend weight → bold pill
  trend?: boolean // current-trend "must-have" → subtle accent
}>()
const store = useStore()

const isSkill = computed(() => techIsSkill(props.label!, store.data && store.data.skills))
// markers only on real skills, and hidden while searching (mirrors the grid accent)
const showMarkers = computed(() => isSkill.value && !(store.skillQuery || '').trim())
const showPill = computed(() => showMarkers.value && !!props.isNew && !!props.pill)
// secondary "new" (not top-3): highlight the chip instead of adding a dot glyph
const showSoft = computed(() => showMarkers.value && !!props.isNew && !props.pill)
const showTrend = computed(() => showMarkers.value && !!props.trend)
</script>
