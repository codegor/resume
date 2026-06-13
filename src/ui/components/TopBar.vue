<template>
  <header class="topbar">
    <div class="wrap topbar-inner">
      <a class="brand plain-link" :href="homeUrl" @click="goHome"
        >Egor Berezovsky<span class="dot">.</span></a
      >
      <view-toggles />
      <button
        class="guidebtn"
        :title="$t('How to use this résumé — guided tours')"
        @click="store.openGuide()"
      >
        <icon name="info" /><span class="guidebtn-lbl"><t>How to use</t></span>
      </button>
      <div class="topbar-spacer"></div>
      <div class="contact-row">
        <a class="cbtn" :href="c.telegram" target="_blank" rel="noopener" @click="openContact()"
          ><icon name="telegram" /><span class="lbl"><t>Telegram</t></span></a
        >
        <a class="cbtn" :href="c.linkedin" target="_blank" rel="noopener" @click="openContact()"
          ><icon name="linkedin" /><span class="lbl"><t>LinkedIn</t></span></a
        >
        <a class="cbtn" :href="c.github" target="_blank" rel="noopener"
          ><icon name="github" /><span class="lbl"><t>GitHub</t></span></a
        >
        <a class="cbtn" :href="emailHref()"
          ><icon name="mail" /><span class="lbl"><t>Email</t></span></a
        >
      </div>
      <div class="tb-right">
        <a
          v-if="resumeUrl"
          class="iconbtn has-tip prodbtn"
          :data-tip="$t('View the live résumé')"
          :href="resumeUrl"
          target="_blank"
          rel="noopener"
        >
          <icon name="globe" />
        </a>
        <div class="dl-wrap" @click.stop>
          <button
            :class="['iconbtn', 'has-tip', { on: dlOpen }]"
            :data-tip="$t('Download CV — PDF / ATS / AI')"
            :aria-expanded="dlOpen"
            aria-haspopup="true"
            @click="store.toggleMenu('download')"
          >
            <icon name="download" />
          </button>
          <div v-if="dlOpen" class="dl-menu">
            <button class="dl-item" @click="doPrint()">
              <icon name="print" /><span class="dli-txt"
                ><b><t>Print / Save as PDF</t></b
                ><i><t>Clean print layout, everything expanded</t></i></span
              >
            </button>
            <button class="dl-item" @click="doMd()">
              <icon name="md" /><span class="dli-txt"
                ><b><t>Markdown (.md) — for ATS &amp; AI</t></b
                ><i><t>Plain-text full résumé for parsers &amp; assistants</t></i></span
              >
            </button>
            <a
              v-if="!isOffline"
              class="dl-item"
              :href="offlineUrl"
              :download="offlineName"
              @click="store.closeMenus()"
            >
              <icon name="download" /><span class="dli-txt"
                ><b><t>Download offline version</t></b
                ><i><t>One self-contained .html — opens without internet</t></i></span
              >
            </a>
          </div>
        </div>
        <button
          class="iconbtn has-tip"
          :data-tip="$t('Light / dark theme')"
          @click="store.toggleTheme()"
        >
          <icon :name="store.theme === 'dark' ? 'sun' : 'moon'" />
        </button>
        <contact-menu />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useStore } from '@/composables/useStore'
import { siteConfig } from '@/config'
import { siteHomeUrl, goHome } from '@/utils/dom'
import { offlineFileName } from '@/utils/offline-name'
import { openContactWithMessage } from '@/utils/contact'

const store = useStore()

const dlOpen = computed(() => store.openMenu === 'download')

const c = computed(() => siteConfig().contacts!)
const homeUrl = computed(() => siteHomeUrl())
const resumeUrl = computed(() => siteConfig().resumeUrl || '')

// Inside the offline single-file build the data is injected as #__inline_config —
// there's no sibling file to download, so hide the "Download offline version" item there.
const isOffline = computed(() => {
  const el = document.getElementById('__inline_config')
  return !!(el && el.textContent && el.textContent.trim())
})
// The build (scripts/finalize-single.mjs) names the offline file with this same helper,
// so the link resolves to the file sitting next to index.html in dist/.
const offlineName = computed(() => offlineFileName(store.data?.name, store.data?.updated))
const offlineUrl = computed(() => {
  try {
    return new URL(offlineName.value, document.baseURI).href
  } catch {
    return offlineName.value
  }
})

let onDoc: () => void
onMounted(() => {
  onDoc = () => {
    store.closeMenus()
  }
  document.addEventListener('click', onDoc)
})
onBeforeUnmount(() => document.removeEventListener('click', onDoc))

const openContact = openContactWithMessage

function emailHref() {
  return (
    'mailto:' +
    c.value.email +
    '?subject=Let%27s%20work%20together&body=' +
    encodeURIComponent(c.value.introMessage)
  )
}
function doPrint() {
  store.closeMenus()
  store.print()
}
function doMd() {
  store.closeMenus()
  store.exportMd()
}
</script>
