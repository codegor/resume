<template>
  <section-block v-if="tst && tst.quote" id="reference" :narrow="true" :compact="true">
    <section-head :eyebrow="$t('05 — Reference')" :title="$t('From a colleague')" :small="true" />
    <figure class="tst reveal-up">
      <blockquote class="tst-quote">{{ tst.quote }}</blockquote>
      <figcaption class="tst-by">
        <span class="tst-name">{{ tst.name }}</span>
        <span v-if="tst.role" class="tst-role">· {{ tst.role }}</span>
        <a v-if="tst.link" class="tst-link" :href="tst.link" target="_blank" rel="noopener"
          ><icon name="linkedin" /><t>LinkedIn ↗</t></a
        >
      </figcaption>
    </figure>
  </section-block>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { siteConfig } from '@/config'

const tst = computed(() => siteConfig().testimonial || null)
</script>

<style scoped lang="scss">
.tst {
  margin: 0;
}

.tst-quote {
  font-family: var(--serif);
  font-style: italic;
  font-weight: 400;
  font-size: clamp(19px, 2.4vw, 25px);
  line-height: 1.52;
  letter-spacing: -0.005em;
  color: var(--ink);
  margin: 6px 0 0;
  text-wrap: pretty;
}

.tst-quote::before {
  content: '“';
  display: block;
  font-style: normal;
  font-size: 84px;
  line-height: 0.55;
  color: var(--accent);
  margin: 14px 0 2px;
}

.tst-by {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-top: 24px;
  font-family: var(--sans);
}

.tst-name {
  font-size: 14px;
  font-weight: 600;
}

.tst-role {
  font-size: 13px;
  color: var(--muted);
}

.tst-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
  text-decoration: none;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 5px 11px;
  transition: all 0.15s ease;
}

.tst-link:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
}

.tst-link svg {
  width: 13px;
  height: 13px;
}
</style>
