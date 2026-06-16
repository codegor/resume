<template>
  <section id="top" class="hero wrap">
    <div class="hero-folio">
      <span><t :params="{ year: folioYear }">The Résumé · No. {year}</t></span>
      <span v-if="showPrintStatus" class="folio-status"
        >{{ printFilters.join(' · ') }}{{ ' ' }}<t>only —</t>{{ ' '
        }}<a class="folio-status-link" :href="onlineResumeUrl()"
          ><t>more on interactive online</t></a
        ></span
      >
      <span><t :params="{ year: 2009 }">Est. {year}</t></span>
    </div>
    <div v-if="facts.length" class="hero-facts">
      <span v-for="(f, i) in facts" :key="i" class="hf"
        ><icon :name="f.icon || 'spark'" class="hf-ic" />{{ f.t }}</span
      >
    </div>
    <div class="hero-grid">
      <hero-portrait class="hg-photo" />
      <hero-name class="hg-name" />
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
import { emphasize, shortUrl } from '@/utils/format'
import { onlineResumeUrl } from '@/utils/dom'
import { t as $t } from '@/composables/i18n'

const store = useStore()

/* Print-only folio notice listing the active view + filters (Headlines subsumes Recent) — so a
   printed/PDF copy says what it's showing and points to the live site. */
const printFilters = computed<string[]>(() => {
  const parts: string[] = []
  if (store.compact) parts.push($t('Headlines'))
  else if (store.recentOnly) parts.push($t('Recent 5 years'))
  if (store.activeFilter && store.activeFilter !== 'all') {
    const f = (siteConfig().filters || []).find((d) => d.id === store.activeFilter)
    const label = (f && (f.label || f.id)) || store.activeFilter
    parts.push($t('{role} role', { role: label }))
  }
  if (store.activeSkill) parts.push($t('skill: {skill}', { skill: store.activeSkill }))
  const q = (store.skillQuery || '').trim()
  if (q) parts.push($t('search: “{q}”', { q }))
  return parts
})
const showPrintStatus = computed(() => store.printing && printFilters.value.length > 0)

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
</script>
