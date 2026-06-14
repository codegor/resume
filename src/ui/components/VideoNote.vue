<template>
  <div
    ref="root"
    :class="['vnote', 'size-' + size]"
    :title="
      hasVideo && !failed
        ? $t('Tap to enlarge with sound')
        : poster
          ? $t('Tap — the intro plays when you are online')
          : $t('Video coming soon')
    "
    @click="open"
  >
    <video
      v-if="src && !failed"
      ref="vid"
      :src="src"
      :muted="muted"
      loop
      playsinline
      autoplay
      preload="metadata"
      @error="failed = true"
    ></video>
    <smart-img
      v-else-if="poster"
      img-class="vnote-poster"
      :src="poster"
      :avif="posterAvif"
      alt=""
    />
    <div v-else class="vnote-ph"></div>
    <div v-if="!src || failed || muted" class="vnote-play"><icon name="play" /></div>
    <div v-if="badge" class="vnote-badge">{{ badge }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useStore } from '@/composables/useStore'
import { siteConfig } from '@/config'

const props = withDefaults(
  defineProps<{
    videoKey: string
    size?: string
    badge?: string
  }>(),
  { size: 's', badge: '' },
)

const store = useStore()

const muted = ref(true)
const vis = ref(false)
const failed = ref(false)

const root = ref<HTMLElement | null>(null)
const vid = ref<HTMLVideoElement | null>(null)

const cfg = computed(() => (siteConfig().videos || {})[props.videoKey] || {})
// `hasVideo` = a clip is configured; `src` is gated on `loaded` so the file is only
// fetched once the note scrolls into view (lazy). Until then the poster shows.
// The preview circle plays the lightweight `previewSrc` when set (falls back to the
// full `src`); the full clip is only fetched when the enlarged modal opens.
const rawSrc = computed(() => cfg.value.previewSrc || cfg.value.src)
const hasVideo = computed(() => !!rawSrc.value)
const loaded = ref(false)
const src = computed(() => (loaded.value ? rawSrc.value : ''))
const poster = computed(() => cfg.value.poster)
// Offline build inlines the poster AVIF as a data URI here (webp/jpg stream); empty in
// the multifile build → SmartImg derives the .avif sibling URL.
const posterAvif = computed(() => (cfg.value.posterAvif as string | undefined) || '')

let io: IntersectionObserver | undefined
onMounted(() => {
  if (!rawSrc.value) return
  io = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        vis.value = e.isIntersecting
        if (e.isIntersecting) loaded.value = true
        const v = vid.value
        if (!v) return
        if (e.isIntersecting) v.play().catch(() => {})
        else v.pause()
      }),
    { threshold: 0.4, rootMargin: '200px' },
  )
  if (root.value) io.observe(root.value)
})
onBeforeUnmount(() => io && io.disconnect())

function open(e?: Event) {
  if (e) e.stopPropagation()
  store.openVideo(props.videoKey)
}
</script>

<style scoped lang="scss">
.vnote {
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  flex: none;
  background: var(--bg2);
  border: 2.5px solid var(--ec);
  cursor: pointer;
  box-shadow: var(--shadow-s);
  isolation: isolate;
}

.vnote.size-s {
  width: 54px;
  height: 54px;
}

.vnote.size-m {
  width: 92px;
  height: 92px;
}

.vnote-ph {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    45deg,
    color-mix(in srgb, var(--ec) 10%, var(--bg2)) 0 7px,
    var(--bg2) 7px 14px
  );
}

.vnote video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  clip-path: circle(50%);
  /* stylelint-disable-next-line property-no-vendor-prefix */
  -webkit-mask-image: radial-gradient(circle closest-side, #000 99.5%, transparent 100%);
  mask-image: radial-gradient(circle closest-side, #000 99.5%, transparent 100%);
}

:deep(.vnote-poster) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  clip-path: circle(50%);
}

.vnote-ring {
  position: absolute;
  inset: -2.5px;
  border-radius: 50%;
  pointer-events: none;
}

.vnote-play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ec);
  background: color-mix(in srgb, var(--bg) 30%, transparent);
}

.vnote-play svg {
  width: 40%;
  height: 40%;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.vnote-mute {
  position: absolute;
  right: 2px;
  bottom: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(20, 16, 10, 0.7);
  color: #fff;
  border: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.vnote-mute svg {
  width: 11px;
  height: 11px;
}

.vnote-badge {
  position: absolute;
  left: 50%;
  bottom: 4px;
  transform: translateX(-50%);
  font-family: var(--sans);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ec);
  background: color-mix(in srgb, var(--bg) 70%, transparent);
  padding: 1px 5px;
  border-radius: 10px;
  white-space: nowrap;
}

@media (max-width: 980px) {
  .vnote.size-m {
    width: 48px;
    height: 48px;
  }

  /* project-card chip on the meta row ("headline first" mobile header) */
  .vnote.size-s {
    width: 38px;
    height: 38px;
    border-width: 2px;
  }

  .vnote.size-s .vnote-badge {
    font-size: 6.5px;
    padding: 1px 4px;
    bottom: 2px;
  }
}
</style>
