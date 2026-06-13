// Contact helpers (ported from v-core.js). Clicking a contact link copies a short
// pre-filled intro to the clipboard so it can be pasted into the chat.
import { siteConfig } from '@/config'
import { toast } from '@/utils/dom'
import { t } from '@/composables/i18n'

export function copyIntro(): void {
  const msg = siteConfig().contacts?.introMessage || ''
  try {
    navigator.clipboard.writeText(msg)
    toast(t('Intro message copied — paste it in the chat ✦'))
  } catch {
    toast(t('Open the chat and say hello ✦'))
  }
}

export function openContactWithMessage(_url?: string): void {
  copyIntro()
}
