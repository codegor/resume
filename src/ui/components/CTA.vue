<template>
  <div :class="['cta', { 'in-footer': inFooter }]">
    <div v-if="!inFooter" class="cta-deco">?</div>
    <div class="cta-grid">
      <div class="cta-lead">
        <h3>
          {{ parts.a }}<b><t>five years</t></b
          >{{ parts.b }}
        </h3>
        <a v-if="!inFooter" class="cta-keep" href="#timeline" @click.prevent="goNext()">
          <b><t>No?</t></b> <span class="cta-keep-txt"><t>Read on — the work timeline</t></span
          ><icon name="chevron" class="cta-keep-ic" />
        </a>
      </div>
      <div class="cta-actions">
        <div class="cta-sub">{{ cfg.cta?.sub }}</div>
        <a
          class="bigbtn primary"
          :href="c.telegram"
          target="_blank"
          rel="noopener"
          @click="openContact()"
          ><icon name="telegram" /> <t>Message on Telegram</t></a
        >
        <a
          class="bigbtn ghost"
          :href="c.linkedin"
          target="_blank"
          rel="noopener"
          @click="openContact()"
          ><icon name="linkedin" /> <t>Connect on LinkedIn</t></a
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { siteConfig } from '@/config'
import { scrollToId } from '@/utils/dom'
import { openContactWithMessage } from '@/utils/contact'

defineProps<{ inFooter?: boolean }>()

const cfg = computed(() => siteConfig())
const c = computed(() => siteConfig().contacts!)
const parts = computed(() => {
  const l = String(siteConfig().cta?.line ?? '')
  return { a: l.split('five years')[0], b: l.split('five years')[1] }
})

const openContact = openContactWithMessage
function goNext() {
  scrollToId('timeline')
}
</script>

<style scoped lang="scss">
.cta {
  position: relative;
  overflow: hidden;
  background: var(--ink);
  color: var(--bg);
  border-radius: 18px;
  padding: 48px 52px;
  margin: 30px 0 0;
}

[data-theme='dark'] .cta {
  background: var(--surface);
  border: 1px solid var(--line);
  color: var(--ink);
}

.cta-grid {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 36px;
  align-items: center;
}

.cta h3 {
  font-family: var(--serif);
  font-weight: 400;
  font-style: italic;
  font-size: clamp(24px, 3.6vw, 40px);
  line-height: 1.22;
  letter-spacing: -0.015em;
  margin: 0;
  max-width: 22ch;
}

.cta h3 b {
  font-style: normal;
  font-weight: 500;
  color: var(--accent);
}

.cta-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 220px;
}

.cta-sub {
  font-family: var(--sans);
  font-size: 12.5px;
  letter-spacing: 0.04em;
  opacity: 0.7;
  margin-bottom: 2px;
}

/* "No?" counter-CTA — nudges undecided readers into the timeline instead of bouncing */
.cta-keep {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  font-family: var(--sans);
  font-size: 13px;
  font-weight: 600;
  color: color-mix(in srgb, var(--bg) 78%, transparent);
  text-decoration: none;
  transition: color 0.15s ease;
  white-space: nowrap;
}

.cta-keep b {
  color: var(--accent);
  font-weight: 700;
}

.cta-keep-txt {
  border-bottom: 1px solid color-mix(in srgb, var(--bg) 35%, transparent);
  padding-bottom: 2px;
  transition: border-color 0.15s ease;
}

.cta-keep-ic {
  width: 15px;
  height: 15px;
  flex: none;
}

.cta-keep:hover {
  color: var(--bg);
}

.cta-keep:hover .cta-keep-txt {
  border-color: var(--accent);
}

[data-theme='dark'] .cta-keep {
  color: color-mix(in srgb, var(--ink) 70%, transparent);
}

[data-theme='dark'] .cta-keep-txt {
  border-color: color-mix(in srgb, var(--ink) 30%, transparent);
}

[data-theme='dark'] .cta-keep:hover {
  color: var(--ink);
}

.cta-deco {
  position: absolute;
  right: -40px;
  top: -40px;
  font-family: var(--serif);
  font-size: 240px;
  line-height: 1;
  opacity: 0.06;
  pointer-events: none;
}

@media (max-width: 760px) {
  .cta-grid {
    grid-template-columns: 1fr;
  }

  .cta {
    padding: 34px 28px;
  }
}

/* in-footer variant (was global .footer .cta) */
.cta.in-footer {
  background: transparent;
  padding: 0;
  margin: 0 0 40px;
}
</style>
