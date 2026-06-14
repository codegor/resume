<template>
  <div class="vmodal-back" @click="close">
    <div class="vmodal" @click.stop>
      <button class="vmodal-close" @click="close"><icon name="x" /></button>
      <div class="vmodal-round">
        <video
          v-if="src && !failed"
          ref="vid"
          :src="src"
          class="vmodal-vid"
          loop
          playsinline
          autoplay
          :title="$t('Click to play / pause')"
          @click="playPause"
          @error="failed = true"
        ></video>
        <template v-else-if="poster">
          <smart-img
            img-class="vmodal-poster"
            :src="poster"
            :avif="posterAvif"
            alt="Egor Berezovsky"
          />
          <div class="vmodal-offline">
            <icon name="globe" class="vo-ic" /><t>Plays here when you're online</t>
          </div>
        </template>
        <div v-else-if="src" class="vmodal-empty">
          <icon name="play" class="ve-ic" />
          <div class="ve-offline">
            <icon name="globe" class="vo-ic" /><t>Plays here when you're online</t>
          </div>
        </div>
        <div v-else class="vmodal-empty">
          <icon name="cam" class="ve-ic" />
          <div class="ve-t"><t>This video note is coming soon.</t></div>
          <div style="font-size: 11px; opacity: 0.6; font-family: var(--sans)">
            {{ $t('Add the file path in config.json → videos["{key}"]', { key: videoKey }) }}
          </div>
        </div>
      </div>
      <div v-if="cfg.caption" class="vmodal-cap">"{{ cfg.caption }}"</div>
      <div class="vmodal-controls">
        <button class="vmc" :disabled="!src || failed" @click="toggleMute">
          <icon :name="muted ? 'muted' : 'sound'" /> {{ muted ? $t('Unmute') : $t('Mute') }}
        </button>
        <button class="vmc" :disabled="!src || failed" @click="playPause">
          <icon name="play" /> <t>Play / Pause</t>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useStore } from '@/composables/useStore'
import { siteConfig } from '@/config'

const props = defineProps<{ videoKey: string }>()

const store = useStore()

const muted = ref(false)
const failed = ref(false)

const vid = ref<HTMLVideoElement | null>(null)

const cfg = computed(() => (siteConfig().videos || {})[props.videoKey] || {})
const src = computed(() => cfg.value.src)
const poster = computed(() => cfg.value.poster)
// Offline build inlines the poster AVIF as a data URI here (webp/jpg stream); empty in
// the multifile build → SmartImg derives the .avif sibling URL.
const posterAvif = computed(() => (cfg.value.posterAvif as string | undefined) || '')

let onKey: (e: KeyboardEvent) => void
onMounted(() => {
  onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') store.closeVideo()
  }
  window.addEventListener('keydown', onKey)
  const v = vid.value
  if (v) {
    v.muted = false
    v.play().catch(() => {
      v.muted = true
      v.play().catch(() => {})
    })
  }
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

function close() {
  store.closeVideo()
}
function toggleMute() {
  const v = vid.value
  if (v) {
    v.muted = !v.muted
    muted.value = v.muted
  }
}
function playPause() {
  const v = vid.value
  if (v) {
    v.paused ? v.play() : v.pause()
  }
}
</script>

<style scoped lang="scss">
.vmodal-vid {
  cursor: pointer;
}

.vmodal-back {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 11, 6, 0.78);
  backdrop-filter: blur(6px);
  padding: 24px;
  animation: fadein 0.25s ease;
}

.vmodal {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.vmodal-round {
  width: min(70vmin, 540px);
  height: min(70vmin, 540px);
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid var(--ec, var(--accent));
  box-shadow: var(--shadow-l);
  background: #000;
  position: relative;
  isolation: isolate;
}

.vmodal-round video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  clip-path: circle(50%);
  /* stylelint-disable-next-line property-no-vendor-prefix */
  -webkit-mask-image: radial-gradient(circle closest-side, #000 99.5%, transparent 100%);
  mask-image: radial-gradient(circle closest-side, #000 99.5%, transparent 100%);
}

:deep(.vmodal-poster) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  clip-path: circle(50%);
}

.vmodal-offline {
  position: absolute;
  left: 50%;
  bottom: 12%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: 30px;
  background: rgba(12, 8, 4, 0.74);
  backdrop-filter: blur(4px);
  color: #f2e9da;
  font-family: var(--sans);
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
}

.vmodal-offline .vo-ic {
  width: 15px;
  height: 15px;
  color: var(--accent);
  flex: none;
}

.vmodal-empty .ve-offline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--sans);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.vmodal-empty .ve-offline .vo-ic {
  width: 15px;
  height: 15px;
  color: var(--accent);
  flex: none;
}

.vmodal-cap {
  font-family: var(--serif);
  font-style: italic;
  font-size: 19px;
  color: #f2e9da;
  text-align: center;
  max-width: 36ch;
}

.vmodal-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #cbb;
  text-align: center;
  padding: 30px;
}

.vmodal-empty .ve-ic {
  width: 46px;
  height: 46px;
  opacity: 0.8;
}

.vmodal-empty .ve-t {
  font-family: var(--sans);
  font-size: 13px;
  letter-spacing: 0.04em;
}

.vmodal-controls {
  display: flex;
  gap: 10px;
}

.vmc {
  font-family: var(--sans);
  font-size: 13px;
  font-weight: 500;
  color: #f2e9da;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 9px 16px;
  border-radius: 30px;
  display: inline-flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.vmc svg {
  width: 16px;
  height: 16px;
  flex: none;
}

.vmc:hover {
  background: rgba(255, 255, 255, 0.18);
}

.vmc:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.vmc:disabled:hover {
  background: rgba(255, 255, 255, 0.1);
}

@media (max-width: 980px) {
  .vmodal-cap {
    font-size: 15px;
    max-width: 70vmin;
    white-space: normal;
  }
}
</style>
