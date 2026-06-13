<template>
  <form class="feedback" @submit.prevent="send">
    <div class="feedback-q">
      {{ $t(q || 'What do you think — how could this résumé be better?') }}
    </div>
    <div class="feedback-sub">
      {{
        $t(
          sub ||
            "A recruiter's eye is gold. Tell me what's missing or unclear and it lands straight in my inbox.",
        )
      }}
    </div>
    <div class="feedback-row">
      <textarea
        v-model="msg"
        :rows="2"
        :placeholder="$t(placeholder || 'e.g. I\'d love to see more detail on team leadership…')"
      ></textarea>
      <button type="submit" class="bigbtn primary">
        <icon name="mail" /> {{ $t(btn || 'Send feedback') }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { siteConfig } from '@/config'
import { toast } from '@/utils/dom'
import { t as $t } from '@/composables/i18n'

const props = defineProps<{
  q?: string
  sub?: string
  subject?: string
  placeholder?: string
  btn?: string
}>()

const msg = ref('')

const c = computed(() => siteConfig().contacts!)

function send() {
  if (!msg.value.trim()) {
    toast($t('Write a line or two first ✦'))
    return
  }
  const subj = encodeURIComponent($t(props.subject || "Feedback on Egor's résumé"))
  const body = encodeURIComponent(msg.value + '\n\n— sent from the résumé site')
  window.location.href = 'mailto:' + c.value.email + '?subject=' + subj + '&body=' + body
  toast($t('Opening your mail app — thank you! ✦'))
}
</script>

<style scoped lang="scss">
.feedback {
  margin: 4px 0 38px;
  padding: 30px 0 0;
  border-top: 1px solid color-mix(in srgb, var(--bg) 24%, transparent);
}

[data-theme='dark'] .feedback {
  border-top-color: var(--line);
}

.feedback-q {
  font-family: var(--serif);
  font-style: italic;
  font-size: clamp(20px, 2.6vw, 28px);
  line-height: 1.3;
}

.feedback-sub {
  font-family: var(--sans);
  font-size: 13px;
  opacity: 0.72;
  margin: 8px 0 16px;
  max-width: 62ch;
}

.feedback-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.feedback textarea {
  flex: 1;
  min-width: 280px;
  background: color-mix(in srgb, var(--bg) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--bg) 28%, transparent);
  border-radius: 12px;
  padding: 13px 15px;
  color: inherit;
  font-family: var(--body);
  font-size: 15px;
  line-height: 1.5;
  resize: vertical;
}

[data-theme='dark'] .feedback textarea {
  background: var(--bg);
  border-color: var(--line);
}

.feedback textarea:focus {
  outline: none;
  border-color: var(--accent);
}

.feedback textarea::placeholder {
  color: color-mix(in srgb, var(--bg) 48%, transparent);
}

[data-theme='dark'] .feedback textarea::placeholder {
  color: var(--faint);
}

.feedback .bigbtn {
  white-space: nowrap;
}

@media (max-width: 600px) {
  .feedback .bigbtn {
    width: 100%;
  }
}
</style>
