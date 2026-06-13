<template>
  <section id="top" class="hero wrap">
    <div class="hero-folio">
      <span><t :params="{ year: folioYear }">The Résumé · No. {year}</t></span>
      <span
        ><span class="folio-tg">{{ data.contacts && data.contacts.telegram }} · </span
        ><t :params="{ year: 2009 }">Est. {year}</t></span
      >
    </div>
    <div v-if="facts.length" class="hero-facts">
      <span v-for="(f, i) in facts" :key="i" class="hf"
        ><icon :name="f.icon || 'spark'" class="hf-ic" />{{ f.t }}</span
      >
    </div>
    <div class="hero-grid">
      <hero-name class="hg-name" />
      <hero-portrait class="hg-photo" />
      <hero-roles class="hg-roles" />
      <hero-lead class="hg-lead" />
      <div class="print-contacts hg-pc">
        <a :href="contacts.telegram"><icon name="telegram" /> {{ contacts.telegramHandle }}</a>
        <a :href="contacts.linkedin"><icon name="linkedin" /> {{ shortUrl(contacts.linkedin) }}</a>
        <a :href="contacts.github"><icon name="github" /> {{ shortUrl(contacts.github) }}</a>
        <a :href="'mailto:' + contacts.email"><icon name="mail" /> {{ contacts.email }}</a>
        <a v-if="resumeUrl" :href="resumeUrl"><icon name="globe" /> {{ shortUrl(resumeUrl) }}</a>
      </div>
    </div>
    <hero-stats />
    <div class="hero-coda">
      <p class="hero-quote">
        <!-- explicit space: Vue strips newline whitespace between <t> and the <span> -->
        <t>"If you look for a person with</t>{{ ' '
        }}<span><t>scrupulousness and attention to detail</t></span
        ><t>, we are exactly on the way."</t>
      </p>
      <div v-if="interview" class="hero-qa">
        <div class="qa-q">{{ interview.question }}</div>
        <!-- eslint-disable-next-line vue/no-v-html — own-content emphasis, HTML-escaped first -->
        <p class="qa-a" v-html="emphasize(interview.answer)"></p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '@/composables/useStore'
import { siteConfig } from '@/config'
import { emphasize } from '@/utils/format'

const store = useStore()

const data = computed(() => store.data!)
const folioYear = computed(() => {
  /* year of the LAST RESUME UPDATE: resume.json "updated" field, else the file's
     HTTP last-modified date; current year only as a last resort. */
  const src = (data.value && data.value.updated) || store.updated
  const d = src ? new Date(src) : null
  return d && !isNaN(d.getTime()) ? String(d.getFullYear()) : String(new Date().getFullYear())
})
const contacts = computed(() => siteConfig().contacts!)
const resumeUrl = computed(() => siteConfig().resumeUrl || '')
const facts = computed(() => siteConfig().hero?.facts || [])
const interview = computed(() => data.value.about_me?.short_interview)

function shortUrl(u: string) {
  return String(u || '')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
}
</script>
