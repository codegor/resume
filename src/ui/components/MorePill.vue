<template>
  <button v-if="visible" ref="root" :class="['more-pill', extraClass]" @click.stop="onClick">
    <span>{{ open ? $t('Show fewer') : label }}</span
    ><span class="mp-arrow">{{ open ? ' ▴' : ' ▾' }}</span>
  </button>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { t as $t, tc as $tc } from '@/composables/i18n'

const props = withDefaults(
  defineProps<{
    open?: boolean
    more?: number | null
    noun?: string
    moreText?: string
    extraClass?: string
  }>(),
  { more: null, noun: '', moreText: '', extraClass: '' },
)

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
  // when collapsing, bring the pill back to where it was before expanding
  if (wasOpen && el) {
    nextTick(() =>
      requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const y = r.top + window.scrollY - window.innerHeight / 2 + r.height / 2
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
      }),
    )
  }
}
</script>
