<template>
  <footer class="footer">
    <div class="wrap">
      <cta :in-footer="true" />
      <feedback-form />
      <feedback-form
        q="Want a résumé site like this one?"
        sub="I can build you a living, filterable résumé just like this — tell me a bit about you and I'll get back to you."
        subject="I'd like a résumé site like yours"
        placeholder="e.g. I'm a backend engineer with 6 years — can you make me one?"
        btn="Request mine"
      />
      <p class="footer-help">
        <t
          >New here? If you'd like help getting around — and a tour of everything this résumé can do
          — open the</t
        ><!-- explicit space: Vue strips newline whitespace between elements -->{{ ' '
        }}<button type="button" class="footer-help-link" @click="store.openGuide()">
          <t>How&nbsp;to&nbsp;use guide</t></button
        >.
      </p>
      <div class="footer-grid">
        <div>
          <div class="footer-name"><t>Let's build something.</t></div>
          <div class="footer-fine">{{ c.telegramHandle }} · {{ c.email }}</div>
          <div v-if="langs.length > 1" class="footer-lang" :aria-label="$t('Language')">
            <button
              v-for="l in langs"
              :key="l"
              type="button"
              class="footer-lang-btn"
              :class="{ active: l === lang }"
              :aria-pressed="l === lang"
              @click="setLang(l)"
            >
              {{ l.toUpperCase() }}
            </button>
          </div>
        </div>
        <div class="footer-contacts">
          <a v-if="resumeUrl" class="cbtn" :href="resumeUrl" target="_blank" rel="noopener"
            ><icon name="globe" /><span class="lbl"><t>Live résumé</t></span></a
          >
          <a class="cbtn" :href="c.telegram" target="_blank" rel="noopener" @click="openContact()"
            ><icon name="telegram" /><span class="lbl"><t>Telegram</t></span></a
          >
          <a class="cbtn" :href="c.linkedin" target="_blank" rel="noopener" @click="openContact()"
            ><icon name="linkedin" /><span class="lbl"><t>LinkedIn</t></span></a
          >
          <a class="cbtn" :href="c.github" target="_blank" rel="noopener"
            ><icon name="github" /><span class="lbl"><t>GitHub</t></span></a
          >
          <a class="cbtn" :href="'mailto:' + c.email"
            ><icon name="mail" /><span class="lbl"><t>Email</t></span></a
          >
        </div>
      </div>
      <div class="footer-fine">
        <t :params="{ year }"
          >© {year} Egor Berezovsky · Built as a living, filterable résumé · Print for a tailored
          PDF</t
        >
        <span v-if="updatedLabel" class="footer-updated"
          ><!-- " · " separator kept outside <t> (which trims leading space) -->{{ ' · '
          }}<t :params="{ date: updatedLabel }">Résumé updated {date}</t></span
        >
      </div>
      <div class="print-footer">
        <t>Printed from</t> <a :href="pageUrl">{{ pageUrl }}</a>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '@/composables/useStore'
import { siteConfig } from '@/config'
import { openContactWithMessage } from '@/utils/contact'
import { lang, setLang, availableLangs } from '@/composables/i18n'

const store = useStore()
const langs = availableLangs()

const c = computed(() => siteConfig().contacts!)
const resumeUrl = computed(() => siteConfig().resumeUrl)
const updatedLabel = computed(() => {
  const updated = (store.data && store.data.updated) || store.updated
  if (!updated) return null
  const d = new Date(updated)
  if (isNaN(d.getTime())) return null
  let label = d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
  const hasTime = /T|\d{2}:\d{2}/.test(updated) || String(updated).length > 10
  if (hasTime)
    label += ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return label
})
const year = computed(() => new Date().getFullYear())
const pageUrl = computed(() => window.location.href)

const openContact = openContactWithMessage
</script>

<style scoped lang="scss">
.footer {
  background: var(--ink);
  color: var(--bg);
  padding: 64px 0 40px;
  margin-top: 40px;
}

[data-theme='dark'] .footer {
  background: var(--surface);
  border-top: 1px solid var(--line);
  color: var(--ink);
}

.footer-grid {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.footer-name {
  font-family: var(--serif);
  font-weight: 500;
  font-size: 34px;
  letter-spacing: -0.02em;
}

.footer-contacts {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.footer .cbtn {
  background: transparent;
  border-color: color-mix(in srgb, var(--bg) 30%, transparent);
  color: var(--bg);
}

[data-theme='dark'] .footer .cbtn {
  color: var(--ink);
  border-color: var(--line);
}

.footer .cbtn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.footer-fine {
  font-family: var(--sans);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: color-mix(in srgb, var(--bg) 55%, transparent);
  margin-top: 30px;
  text-transform: uppercase;
}

.footer-help {
  font-family: var(--sans);
  font-size: 14px;
  line-height: 1.6;
  color: color-mix(in srgb, var(--bg) 72%, transparent);
  margin: 0 0 36px;
  max-width: 60ch;
}

[data-theme='dark'] .footer-help {
  color: var(--muted);
}

.footer-help-link {
  font: inherit;
  color: var(--accent);
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
}

.footer-help-link:hover {
  text-decoration-thickness: 2px;
}

[data-theme='dark'] .footer-fine {
  color: var(--muted);
}

.footer-updated {
  color: var(--accent);
}

/* language switcher — matches .footer-fine (sans, 11px, uppercase, muted); hidden in
   print and when only one language is registered (v-if in template) */
.footer-lang {
  display: flex;
  gap: 14px;
  margin-top: 14px;
}

.footer-lang-btn {
  font-family: var(--sans);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  color: color-mix(in srgb, var(--bg) 55%, transparent);
}

[data-theme='dark'] .footer-lang-btn {
  color: var(--muted);
}

.footer-lang-btn:hover,
.footer-lang-btn.active {
  color: var(--accent);
}

.footer-lang-btn.active {
  font-weight: 700;
}

@media print {
  .footer-lang {
    display: none;
  }
}
</style>
