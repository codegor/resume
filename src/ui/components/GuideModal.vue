<template>
  <div class="guide-back" @click="close">
    <div class="guide-modal" @click.stop>
      <button class="vmodal-close guide-close" @click="close"><icon name="x" /></button>
      <div class="guide-head">
        <div class="guide-eyebrow"><t>A field guide</t></div>
        <h2 class="guide-title"><t>How to read this résumé</t></h2>
        <p class="guide-intro">
          <t
            >This page is interactive. Each story below is a goal a reader might have, the path to
            get there, and what you'll see. Pick whichever matches what you're looking for.</t
          >
        </p>
      </div>
      <ol class="guide-stories">
        <li v-for="(s, i) in stories" :key="i" class="guide-story">
          <div class="story-num">{{ String(i + 1).padStart(2, '0') }}</div>
          <div class="story-body">
            <div class="story-goal">{{ s.goal }}</div>
            <div class="story-path">
              <template v-for="(step, j) in s.steps" :key="j">
                <span v-if="j" class="path-arrow"><icon name="arrow" /></span>
                <span class="path-step">{{ step }}</span>
              </template>
            </div>
            <div class="story-see">{{ s.see }}</div>
          </div>
        </li>
      </ol>
      <div class="guide-foot">
        <!-- explicit space: Vue strips newline whitespace between </kbd> and <t> -->
        <t>Built as a living résumé — it updates as I do. Press</t> <kbd>Esc</kbd>{{ ' '
        }}<t>to close.</t>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useStore } from '@/composables/useStore'
import { t as $t } from '@/composables/i18n'

const store = useStore()

// Inside the offline single-file build the data is injected as #__inline_config —
// there's no sibling file to download, so this story doesn't apply there.
const isOffline = computed(() => {
  const el = document.getElementById('__inline_config')
  return !!(el && el.textContent && el.textContent.trim())
})

const stories = computed(() => {
  const list = [
    {
      id: 'ai-export',
      goal: $t('Feed the résumé to an AI'),
      steps: [$t('Click'), $t('the download button (⤓)'), $t('Markdown (.md)')],
      see: $t(
        "A Markdown (.md) copy of the entire résumé downloads — every skill, project, course and conference fully expanded. It's the same plain-text format ATS parsers like: paste or attach it to ChatGPT, Claude, or an applicant-tracking system.",
      ),
    },
    {
      id: 'recent-5y',
      goal: $t('See only the last 5 years'),
      steps: [$t('Toggle'), $t('Recent · 5y')],
      see: $t(
        'The timeline keeps only roles whose work ended in the last 5 years, and the Skills section narrows to the skills actually used in them — older eras and stale skills drop away.',
      ),
    },
    {
      id: 'headlines',
      goal: $t('Get the 30-second version'),
      steps: [$t('Toggle'), $t('Headlines')],
      see: $t(
        'The page collapses to the essentials — a short 30-sec intro video, the headline skills and languages. Everything else hides. (Headlines also turns on Recent · 5y.)',
      ),
    },
    {
      id: 'role-lens',
      goal: $t("Read me through one role's lens"),
      steps: [$t('Focus bar'), $t('pick a role')],
      see: $t(
        'Skills, timeline projects and courses all filter to that role (AI · Architect · Team Lead · Back-end · Front-end · QA · DevOps). Each project shows only the technologies relevant to that role; the rest collapse behind “+N more”.',
      ),
    },
    {
      id: 'find-skill',
      goal: $t('Find where I used a specific skill'),
      steps: [$t('Click a chip with the ↗ icon')],
      see: $t(
        'That skill lights up everywhere it appears — across the Skills groups and every project that used it — and the page jumps to Skills. Click it again to clear.',
      ),
    },
    {
      id: 'whats-new',
      goal: $t('Spot what’s new and in demand'),
      steps: [$t('Look for highlighted chips'), $t('and NEW badges')],
      see: $t(
        'Skills that are in demand right now are subtly highlighted (a soft tint + bolder text) — so the most market-relevant ones stand out at a glance. A bold orange NEW badge flags the freshest, most in-demand skills I’ve just started using (the top few in each area, on the timeline and certificates too); other first-time skills get a small dot or a lightly highlighted chip. In short: highlighted = hot right now, NEW = newly added.',
      ),
    },
    {
      id: 'exact-tool',
      goal: $t('Check one exact tool from a vacancy'),
      steps: [$t('Focus bar'), $t('type in the search box')],
      see: $t(
        'Type any term from the job description (RabbitMQ, Symfony, RAG…) and the Skills section narrows to matching skills only — including ones normally tucked behind “+N more”. Click a result to see the projects that used it.',
      ),
    },
    {
      id: 'filter-tool',
      goal: $t('Filter the whole résumé by a tool'),
      steps: [$t('Click a chip with the ⏷ funnel icon')],
      see: $t(
        "Project-specific items that aren't standalone skills (e.g. “Sentry Catch lib”) filter the entire résumé by that term instead of linking to a skill.",
      ),
    },
    {
      id: 'expand-all',
      goal: $t('Open everything at once'),
      steps: [$t('Toggle'), $t('Expand all')],
      see: $t(
        'Every role and conference/course card expands together — handy for a full read-through or to Ctrl-F across all the detail.',
      ),
    },
    {
      id: 'role-dates',
      goal: $t('Check exact dates of a role'),
      steps: [$t('Hover the (i) by a role title')],
      see: $t(
        'A tooltip shows the precise start–end dates for that specific project (in print, the dates appear inline).',
      ),
    },
    {
      id: 'watch-intro',
      goal: $t('Watch a quick intro'),
      steps: [$t('Click the round video by the photo')],
      see: $t(
        'A short talking-head intro plays — the 30-second cut in Headlines mode, the full version otherwise.',
      ),
    },
    {
      id: 'print-pdf',
      goal: $t('Read it on paper or save a PDF'),
      steps: [$t('Click'), $t('the download button (⤓)'), $t('Print / Save as PDF')],
      see: $t(
        'A clean, print-optimised résumé opens — light theme, all sections expanded, clickable contact links — ready to Save as PDF.',
      ),
    },
    {
      id: 'switch-theme',
      goal: $t('Switch the mood'),
      steps: [$t('Click'), $t('the moon / sun icon')],
      see: $t('The whole site flips between the warm-cream light theme and a dark theme.'),
    },
    {
      id: 'get-in-touch',
      goal: $t('Get in touch'),
      steps: [$t('Top bar'), $t('Telegram · LinkedIn · GitHub · Email')],
      see: $t(
        'Each opens with a short pre-filled intro — or leave a note in the feedback box at the very bottom.',
      ),
    },
  ]
  if (!isOffline.value) {
    const offlineStory = {
      id: 'offline-copy',
      goal: $t('Keep a copy that works offline'),
      steps: [$t('Click'), $t('the download button (⤓)'), $t('Download offline version')],
      see: $t(
        'One self-contained .html file downloads — the entire résumé, styles and content inlined. Open it any time with no internet; handy to email or archive.',
      ),
    }
    const i = list.findIndex((s) => s.id === 'print-pdf')
    list.splice(i + 1, 0, offlineStory)
  }
  return list
})

let onKey: (e: KeyboardEvent) => void
onMounted(() => {
  onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') store.closeGuide()
  }
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

function close() {
  store.closeGuide()
}
</script>

<style scoped lang="scss">
.guide-back {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: rgba(15, 11, 6, 0.78);
  backdrop-filter: blur(6px);
  padding: 40px 24px;
  overflow-y: auto;
  animation: fadein 0.25s ease;
}

.guide-modal {
  position: relative;
  width: min(720px, 100%);
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 16px;
  box-shadow: var(--shadow-l);
  padding: 36px 38px 26px;
  margin: auto;
}

.guide-close {
  top: 16px;
  right: 16px;
}

.guide-head {
  max-width: 52ch;
  margin-bottom: 22px;
}

.guide-eyebrow {
  font-family: var(--sans);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 8px;
}

.guide-title {
  font-family: var(--serif);
  font-weight: 600;
  font-size: 30px;
  letter-spacing: -0.015em;
  color: var(--ink);
  margin: 0 0 10px;
}

.guide-intro {
  font-family: var(--sans);
  font-size: 14px;
  line-height: 1.6;
  color: var(--muted);
  margin: 0;
}

.guide-stories {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.guide-story {
  display: flex;
  gap: 16px;
  padding: 18px 0;
  border-top: 1px solid var(--line);
}

.story-num {
  font-family: var(--serif);
  font-size: 15px;
  font-weight: 600;
  color: var(--accent);
  flex: none;
  width: 26px;
  padding-top: 2px;
  font-variant-numeric: tabular-nums;
}

.story-body {
  min-width: 0;
}

.story-goal {
  font-family: var(--serif);
  font-size: 19px;
  font-weight: 600;
  color: var(--ink);
  letter-spacing: -0.01em;
  margin-bottom: 9px;
}

.story-path {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
  margin-bottom: 9px;
}

.path-step {
  display: inline-flex;
  align-items: center;
  font-family: var(--sans);
  font-size: 11.5px;
  font-weight: 600;
  color: var(--ink-soft);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 7px;
  padding: 4px 9px;
}

.path-arrow {
  display: inline-flex;
  color: var(--muted);
}

.path-arrow svg {
  width: 13px;
  height: 13px;
}

.story-see {
  font-family: var(--sans);
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--muted);
  text-wrap: pretty;
}

.guide-foot {
  font-family: var(--sans);
  font-size: 12px;
  color: var(--muted);
  border-top: 1px solid var(--line);
  padding-top: 16px;
  margin-top: 6px;
}

.guide-foot kbd {
  font-family: var(--sans);
  font-size: 11px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 1px 6px;
}

@media (max-width: 560px) {
  .guide-modal {
    padding: 28px 20px 20px;
  }

  .guide-title {
    font-size: 25px;
  }
}
</style>
