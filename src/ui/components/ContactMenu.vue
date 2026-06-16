<template>
  <div class="tb-menu-wrap" @click.stop>
    <button
      :class="['iconbtn', { on: open }]"
      aria-haspopup="true"
      :aria-expanded="open"
      :aria-label="$t('Contacts & help')"
      @click="store.toggleMenu('contact')"
    >
      <icon name="info" />
    </button>
    <div v-if="open" class="tb-menu">
      <div class="tb-menu-h"><t>Get in touch</t></div>
      <a class="tb-menu-row" :href="c.telegram" target="_blank" rel="noopener" @click="pick()"
        ><icon name="telegram" /><t>Telegram</t><span class="sub">{{ c.telegramHandle }}</span></a
      >
      <a class="tb-menu-row" :href="c.linkedin" target="_blank" rel="noopener" @click="pick()"
        ><icon name="linkedin" /><t>LinkedIn</t></a
      >
      <a
        class="tb-menu-row"
        :href="c.github"
        target="_blank"
        rel="noopener"
        @click="store.closeMenus()"
        ><icon name="github" /><t>GitHub</t></a
      >
      <a class="tb-menu-row" :href="emailHref()" @click="store.closeMenus()"
        ><icon name="mail" /><t>Email</t><span class="sub">{{ c.email }}</span></a
      >
      <a
        v-if="resumeUrl"
        class="tb-menu-row"
        :href="resumeUrl"
        target="_blank"
        rel="noopener"
        @click="store.closeMenus()"
        ><icon name="globe" /><t>Resume</t></a
      >
      <div class="tb-menu-sep"></div>
      <button class="tb-menu-row hot" @click="guide()">
        <icon name="info" /><t>How to use this résumé</t>
      </button>
      <!-- Mobile only: while the on-page view switches are scrolled out of view, mirror them
           here (zipped to one line) so they stay reachable. App.vue sets the flag. -->
      <template v-if="store.switchesInMenu">
        <div class="tb-menu-sep"></div>
        <!-- toggling a switch also dismisses the menu (it reflows the page under it) -->
        <div class="tb-menu-switches" @click="store.closeMenus()"><view-toggles compact /></div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useStore } from '@/composables/useStore'
import { siteConfig } from '@/config'
import { openContactWithMessage } from '@/utils/contact'

const store = useStore()
const open = computed(() => store.openMenu === 'contact')

const c = computed(() => siteConfig().contacts!)
const resumeUrl = computed(() => siteConfig().resumeUrl || '')

function pick() {
  openContactWithMessage()
  store.closeMenus()
}

function emailHref() {
  return (
    'mailto:' +
    c.value.email +
    '?subject=Let%27s%20work%20together&body=' +
    encodeURIComponent(c.value.introMessage)
  )
}

function guide() {
  store.closeMenus()
  store.openGuide()
}

let onDoc: (() => void) | null = null
onMounted(() => {
  onDoc = () => {
    store.closeMenus()
  }
  document.addEventListener('click', onDoc)
})
onBeforeUnmount(() => {
  if (onDoc) document.removeEventListener('click', onDoc)
})
</script>
