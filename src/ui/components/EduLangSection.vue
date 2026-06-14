<template>
  <div>
    <section-block id="education" :compact="true" :narrow="true">
      <section-head :eyebrow="$t('07 — Education')" :title="$t('Education')" :small="true" />
      <div v-for="(e, i) in education" :key="i" class="edu reveal-up">
        <h3>{{ e.institution }}</h3>
        <div class="e-meta">
          {{ e.period }}{{ e.degree ? ' · ' + e.degree : ''
          }}{{ e.specialty ? ' · ' + e.specialty : '' }}
          <span v-if="e.honors" class="hon"> · {{ e.honors }}</span>
        </div>
        <ul v-if="e.additional">
          <li v-for="(a, j) in e.additional" :key="j">{{ a }}</li>
        </ul>
      </div>
    </section-block>

    <section-block id="languages" :narrow="true">
      <section-head :eyebrow="$t('08 — Languages')" :title="$t('Languages')" :small="true" />
      <div class="lang reveal-up">
        <div v-for="(l, i) in languages" :key="i" class="lang-row">
          <div class="l-top">
            <span class="l-name">{{ l.language }}</span
            ><span class="l-lvl">{{ l.level }}</span>
          </div>
          <div class="lang-bar"><i :style="{ width: langLevelPct(l.level) + '%' }"></i></div>
        </div>
      </div>
    </section-block>

    <section-block id="beyond" :compact="true" :narrow="true">
      <section-head :eyebrow="$t('09 — Beyond code')" :title="$t('Other skills')" :small="true" />
      <ul class="other-list reveal-up">
        <li v-for="(o, i) in otherList" :key="i">{{ o }}</li>
      </ul>
    </section-block>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '@/composables/useStore'
import { langLevelPct } from '@/utils/format'

const store = useStore()

const education = computed(() => store.data!.education || [])
const languages = computed(() => store.data!.languages || [])
const otherList = computed(() => (store.data!.other_skills || []).filter((o) => o && o.length > 3))
</script>

<style scoped lang="scss">
.edu {
  border-left: 3px solid var(--accent);
  padding: 4px 0 4px 22px;
  margin-bottom: 26px;
}

.edu h3 {
  font-family: var(--serif);
  font-weight: 500;
  font-size: 22px;
  margin: 0 0 3px;
  letter-spacing: -0.01em;
}

.edu .e-meta {
  font-family: var(--sans);
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 10px;
}

.edu .e-meta .hon {
  color: var(--accent);
}

.edu ul {
  margin: 8px 0 0;
  padding-left: 18px;
  font-size: 14.5px;
  color: var(--ink-soft);
  line-height: 1.5;
}

.edu ul li {
  margin-bottom: 4px;
}

.lang {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.lang-row .l-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 7px;
}

.lang-row .l-name {
  font-family: var(--serif);
  font-weight: 500;
  font-size: 18px;
}

.lang-row .l-lvl {
  font-family: var(--sans);
  font-size: 12px;
  color: var(--muted);
}

.lang-bar {
  height: 6px;
  border-radius: 4px;
  background: var(--line-soft);
  overflow: hidden;
}

.lang-bar i {
  display: block;
  height: 100%;
  background: var(--accent);
  border-radius: 4px;
}

.other-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px 26px;
}

.other-list li {
  list-style: none;
  position: relative;
  padding-left: 20px;
  font-size: 14.5px;
  line-height: 1.5;
  color: var(--ink-soft);
}

.other-list li::before {
  content: '→';
  position: absolute;
  left: 0;
  color: var(--accent);
}

@media (max-width: 980px) {
  /* single column; the <ul> also carries default margin + 40px padding-left to zero */
  .other-list {
    grid-template-columns: 1fr;
    margin-top: 0;
    padding-left: 0;
  }
}
</style>
