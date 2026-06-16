<template>
  <a
    v-if="visible && store.printing && online"
    :href="onlineResumeUrl()"
    :class="['more-pill', 'more-online', extraClass]"
    ><span>{{ label }}</span> <t>on interactive online</t></a
  >
  <button v-else-if="visible" ref="root" :class="['more-pill', extraClass]" @click.stop="onClick">
    <span>{{ open ? $t('Show fewer') : label }}</span
    ><span class="mp-arrow">{{ open ? ' ▴' : ' ▾' }}</span>
  </button>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { t as $t, tc as $tc } from '@/composables/i18n'
import { useStore } from '@/composables/useStore'
import { onlineResumeUrl, scrollElToCenter } from '@/utils/dom'

const props = withDefaults(
  defineProps<{
    open?: boolean
    more?: number | null
    noun?: string
    moreText?: string
    extraClass?: string
    online?: boolean
  }>(),
  { more: null, noun: '', moreText: '', extraClass: '', online: false },
)

const store = useStore()

const emit = defineEmits<{ (e: 'toggle'): void }>()

const root = ref<HTMLElement | null>(null)

const visible = computed(() => props.open || (props.more != null && props.more > 0))
const label = computed(
  () =>
    props.moreText ||
    $tc('+{n} more {noun}', '+{n} more {noun}s', props.more!, { noun: props.noun ?? '' }),
)

function onClick() {
  const wasOpen = props.open
  const el = root.value
  emit('toggle')
  // closing collapses a long list and jumps the page — recentre on the toggle (shared rule)
  if (wasOpen && el) nextTick(() => requestAnimationFrame(() => scrollElToCenter(el)))
}
</script>
