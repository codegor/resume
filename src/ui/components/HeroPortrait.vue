<template>
  <div class="hero-photo-col">
    <div class="hero-photo-wrap">
      <a class="plain-link hero-photo-frame" :href="homeUrl" @click="goHome">
        <div class="hero-photo-fallback" aria-hidden="true">
          <span class="hpf-mono">EB</span><span class="hpf-label"><t>foto</t></span>
        </div>
        <smart-img
          img-class="hero-photo"
          :src="photoSrc"
          :avif="photoAvif"
          alt="Egor Berezovsky"
          :img-style="{ opacity: imgFailed ? 0 : 1 }"
          @error="imgFailed = true"
        />
      </a>
      <div class="hero-photo-vid">
        <video-note :key="introKey" :video-key="introKey" size="m" :badge="$t('Intro')" />
      </div>
    </div>
    <div v-if="caption" class="hero-photo-cap">{{ h?.photoCaption }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStore } from '@/composables/useStore'
import { siteConfig } from '@/config'
import { siteHomeUrl, goHome } from '@/utils/dom'

withDefaults(defineProps<{ caption?: boolean }>(), { caption: true })

const store = useStore()
const imgFailed = ref(false)

const h = computed(() => siteConfig().hero)
const homeUrl = computed(() => siteHomeUrl())
const photoSrc = computed(() => String(siteConfig().hero?.photo ?? ''))
// In the offline build the AVIF is inlined as a data URI here (webp/jpg stream from
// photoSrc); empty in the multifile build → SmartImg derives the .avif sibling URL.
const photoAvif = computed(() => String(siteConfig().hero?.photoAvif || ''))
const introKey = computed(() => (store.compact ? 'intro_short' : 'intro'))
</script>
