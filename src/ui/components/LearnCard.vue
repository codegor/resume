<template>
  <div v-if="showImage" class="cert reveal-up">
    <smart-img
      v-if="certImg && !imgFailed"
      :src="certImg"
      :avif="certImgAvif"
      :alt="item.title"
      img-class="cert-img"
      @error="imgFailed = true"
    />
    <a
      v-else-if="certImg"
      class="cert-img cert-offline"
      :href="certProdUrl"
      target="_blank"
      rel="noopener"
      :title="item.title"
    >
      <img class="cert-ph-img" :src="placeholderSrc" alt="" loading="lazy" decoding="async" />
      <span class="cert-offline-cap"
        ><icon name="globe" class="vo-ic" /><t>You can view it when you're online</t></span
      >
    </a>
    <div v-else class="cert-default">
      <smart-img
        v-if="provLogo"
        :src="provLogo"
        :avif="provLogoAvif"
        :alt="prov"
        img-class="cert-default-logo"
      />
      <icon v-else :name="iconName" class="cert-default-ic" />
    </div>
    <div class="cert-cap">
      <div class="ct">{{ item.title }}</div>
      <div class="cs">
        <span v-if="badge" :class="['cbadge', badge.done ? 'done' : 'enrolled']">{{
          badge.label
        }}</span>
        <span v-if="dateText"> · {{ dateText }}</span>
        <span v-if="prov" class="prov">
          ·
          <smart-img
            v-if="provLogo && certImg"
            img-class="prov-logo"
            :src="provLogo"
            :avif="provLogoAvif"
            :alt="prov"
          />{{ prov }}</span
        >
      </div>
      <a v-if="certUrl" class="cert-link" :href="certUrl" target="_blank" rel="noopener"
        ><icon name="jump" class="ttag-ic" /><t>View certificate</t></a
      >
      <div v-if="roles.length" class="item-roles">
        <role-chip v-for="r in roles" :key="r" :label="r" />
      </div>
      <div v-if="skills.length" class="item-skills">
        <skill-chip
          v-for="s in shownSkills"
          :key="s"
          :label="s"
          :is-new="mk(s)?.isNew"
          :pill="mk(s)?.pill"
          :trend="(mk(s)?.weight || 0) > 0"
        />
        <button
          v-if="collapseSkills && (!skillsOpen || store.printing) && restSkills.length > 0"
          class="ttag tech-more"
          @click.stop="skillsOpen = true"
        >
          <t :params="{ n: restSkills.length }">+{n} more</t>
        </button>
        <button
          v-if="collapseSkills && skillsOpen && !store.printing"
          class="ttag tech-more"
          @click.stop="skillsOpen = false"
        >
          <t>show fewer</t>
        </button>
      </div>
    </div>
  </div>
  <div v-else class="conf reveal-up">
    <div class="conf-ic"><icon :name="iconName" /></div>
    <div class="conf-main">
      <div class="conf-t">{{ item.title }}</div>
      <div class="conf-s">
        <span
          v-if="badge"
          :class="['cbadge', badge.done ? 'done' : 'enrolled']"
          style="margin-right: 6px"
          >{{ badge.label }}</span
        >
        <span>{{ dateText }}</span>
        <span v-if="prov" class="prov">
          ·
          <smart-img
            v-if="provLogo"
            img-class="prov-logo"
            :src="provLogo"
            :avif="provLogoAvif"
            :alt="prov"
          />{{ prov }}</span
        >
      </div>
      <div v-if="roles.length" class="item-roles">
        <role-chip v-for="r in roles" :key="r" :label="r" />
      </div>
      <div v-if="skills.length" class="item-skills">
        <skill-chip
          v-for="s in shownSkills"
          :key="s"
          :label="s"
          :is-new="mk(s)?.isNew"
          :pill="mk(s)?.pill"
          :trend="(mk(s)?.weight || 0) > 0"
        />
        <button
          v-if="collapseSkills && (!skillsOpen || store.printing) && restSkills.length > 0"
          class="ttag tech-more"
          @click.stop="skillsOpen = true"
        >
          <t :params="{ n: restSkills.length }">+{n} more</t>
        </button>
        <button
          v-if="collapseSkills && skillsOpen && !store.printing"
          class="ttag tech-more"
          @click.stop="skillsOpen = false"
        >
          <t>show fewer</t>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { siteConfig } from '@/config'
import { useStore } from '@/composables/useStore'
import { t as $t } from '@/composables/i18n'
import { roleLabelsFor } from '@/utils/format'
import {
  queryHit,
  looseMatch,
  skillMatchesTech,
  tokensForFilter,
  techMatches,
} from '@/utils/site-filters'
import { markChips, makeFirstAppearance, learnScopeOccurrences, parseDateTs } from '@/utils/skills'
import type { LearnItem } from '@/types/resume'
import type { TaggedEntry } from '@/types/config'

const props = defineProps<{
  item: LearnItem
  type: string
  provider?: string
  imageAlways?: boolean
}>()

const store = useStore()

// In the offline single-file build, cert images stream from the prod root and fail
// when the recipient is offline → show the placeholder (which links to the prod image).
const imgFailed = ref(false)

const entry = computed<TaggedEntry>(() => {
  const m =
    (props.type === 'certificate' ? siteConfig().certificates : siteConfig().conferences) || {}
  return m[props.item.title] || ({} as TaggedEntry)
})
const hasCert = computed(() => entry.value.cert === true)
const showImage = computed(() => props.imageAlways || hasCert.value)
const certUrl = computed(() => entry.value.certUrl || props.item.certUrl || '')
const certImg = computed(() => entry.value.certImg || props.item.certImg || '')
// In the offline single-file build the AVIF variant is inlined as a base64 data URI on a
// sibling `certImgAvif` field (webp/jpg still stream from `certImg`'s prod URL). Empty in
// the multifile build → SmartImg derives the AVIF sibling URL as usual.
const certImgAvif = computed(() => entry.value.certImgAvif || props.item.certImgAvif || '')
watch(certImg, () => {
  imgFailed.value = false
})
const placeholderSrc = computed(() => siteConfig().certPlaceholder || '')
// Absolute prod URL of the cert image. Already absolute in the offline build (the
// build rewrites assets/certs/* to <root>/assets/certs/*); built from resumeUrl otherwise.
const certProdUrl = computed(() => {
  const c = certImg.value
  if (!c) return ''
  if (/^https?:\/\//.test(c)) return c
  const root = (siteConfig().resumeUrl || '').replace(/\/$/, '')
  return root ? `${root}/${c.replace(/^\.?\//, '')}` : c
})
const isCourse = computed(() => props.type === 'certificate')
const prov = computed(() => entry.value.provider || props.provider || '')
const provLogo = computed(() => {
  const p = (siteConfig().providers || {})[prov.value]
  return p && p.logo
})
// Offline build inlines the provider-logo AVIF as a data URI here (webp/png stream);
// empty in the multifile build → SmartImg derives the .avif sibling URL.
const provLogoAvif = computed(() => {
  const p = (siteConfig().providers || {})[prov.value]
  return (p && p.logoAvif) || ''
})
const roles = computed(() => roleLabelsFor(entry.value.filters))
const skills = computed(() => entry.value.skills || [])
/* when a skill/filter/search is active, show only the matching chips + '+N more'
   (same behavior as Project.vue / ConfItem.vue) */
const skillsOpen = ref(false)
const relevant = computed(() => {
  const q = (store.skillQuery || '').trim().toLowerCase()
  if (q) return skills.value.filter((s) => queryHit(s, q))
  const as = store.activeSkill
  if (as) return skills.value.filter((s) => looseMatch(as, s) || skillMatchesTech(s, as))
  const af = store.activeFilter
  if (af && af !== 'all') {
    const tokens = tokensForFilter(store.data!.skills, af)
    if (tokens) return skills.value.filter((s) => techMatches(s, tokens))
  }
  return null
})
const collapseSkills = computed(
  () => relevant.value != null && relevant.value.length < skills.value.length,
)
const restSkills = computed(() =>
  collapseSkills.value ? skills.value.filter((s) => !relevant.value!.includes(s)) : [],
)
const shownSkills = computed(() =>
  collapseSkills.value
    ? skillsOpen.value && !store.printing
      ? [...relevant.value!, ...restSkills.value]
      : relevant.value!
    : skills.value,
)
watch(
  () => [store.activeFilter, store.activeSkill, store.skillQuery],
  () => {
    skillsOpen.value = false
  },
)
/* "NEW" (first appearance across the pooled cert+conference set) + trend accent */
const marks = computed(() => {
  const firstApp = makeFirstAppearance(learnScopeOccurrences(store.data))
  const itemTs = parseDateTs(props.item.date || props.item.year)
  return markChips(skills.value, firstApp, itemTs, siteConfig().trendSkills)
})
function mk(s: string) {
  return marks.value.get(s)
}
const badge = computed(() => {
  if (isCourse.value) {
    const c = props.item
    return {
      label: c.certificate
        ? $t('Certificate')
        : c.status === 'completed'
          ? $t('Completed')
          : $t('Enrolled'),
      done: !!(c.certificate || c.status === 'completed'),
    }
  }
  return hasCert.value ? { label: $t('Certificate'), done: true } : null
})
const dateText = computed(() => {
  if (isCourse.value) return props.item.date || props.item.year || ''
  return (props.item.date || '') + (props.item.location ? ' · ' + props.item.location : '')
})
const iconName = computed(() => (isCourse.value ? 'cap' : 'mic'))
</script>

<style scoped lang="scss">
.cert {
  border: 1px solid var(--line);
  border-radius: 14px;
  overflow: hidden;
  background: var(--surface);
  transition:
    opacity 0.3s ease,
    transform 0.2s ease;
}

.cert:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-m);
}

/* cert image is rendered by <smart-img> (inner <img>), and the offline <a> reuses
   the class — :deep() reaches both inside this component's subtree */
:deep(.cert-img) {
  display: block;
  width: 100%;
  height: 150px;
  object-fit: contain;
  background: color-mix(in srgb, var(--ink) 4%, var(--surface));
  border-bottom: 1px solid var(--line);
}

/* offline fallback for a cert image that can't load (single-file build) */
.cert-offline {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.cert-offline .cert-ph-img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  opacity: 0.9;
}

.cert-offline .cert-offline-cap {
  position: absolute;
  left: 50%;
  bottom: 10px;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: calc(100% - 20px);
  padding: 5px 11px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--ink) 82%, transparent);
  color: var(--surface);
  font-family: var(--sans);
  font-size: 11px;
  line-height: 1.2;
  white-space: nowrap;
}

.cert-offline .cert-offline-cap .vo-ic {
  width: 14px;
  height: 14px;
  color: var(--accent);
  flex: none;
}

.cert-cap {
  padding: 13px 15px;
}

.cert-cap .ct {
  font-family: var(--serif);
  font-weight: 500;
  font-size: 16px;
  line-height: 1.2;
}

.cert-cap .cs {
  font-family: var(--sans);
  font-size: 11.5px;
  color: var(--muted);
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 3px;
}

.cbadge {
  font-family: var(--sans);
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 20px;
}

.cbadge.done {
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  color: var(--accent);
}

.cbadge.enrolled {
  background: color-mix(in srgb, var(--ink) 8%, transparent);
  color: var(--muted);
}

/* provider logo shown in a learning card's meta line */
.prov {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

:deep(.prov-logo) {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  object-fit: cover;
  vertical-align: middle;
}

/* default "picture" for course cards without a certificate image (keeps a row aligned) */
.cert-default {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 150px;
  background: color-mix(in srgb, var(--accent) 7%, var(--surface));
  border-bottom: 1px solid var(--line);
}

:deep(.cert-default-logo) {
  width: 46px;
  height: 46px;
  border-radius: 11px;
  object-fit: cover;
  opacity: 0.95;
}

.cert-default-ic {
  width: 40px;
  height: 40px;
  color: var(--accent);
  opacity: 0.45;
}

/* certificate view link */
.cert-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 9px;
  font-family: var(--sans);
  font-size: 11.5px;
  font-weight: 600;
  color: var(--accent);
  text-decoration: none;
}

.cert-link:hover {
  text-decoration: underline;
}

.cert-link .ttag-ic {
  width: 11px;
  height: 11px;
}

.conf {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  padding: 13px 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
}

.conf-ic {
  width: 34px;
  height: 34px;
  flex: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--accent);
  margin-top: 2px;
}

.conf-ic svg {
  width: 17px;
  height: 17px;
}

.conf-t {
  font-family: var(--serif);
  font-weight: 500;
  font-size: 16px;
  line-height: 1.2;
}

.conf-s {
  font-family: var(--sans);
  font-size: 11.5px;
  color: var(--muted);
  margin-top: 3px;
}

.conf-main {
  min-width: 0;
}

/* role + skill chips on certificate & conference cards */
.item-roles {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 10px;
}

.item-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 8px;
}

.item-skills .ttag {
  font-size: 10.5px;
  padding: 3px 8px;
}
</style>
