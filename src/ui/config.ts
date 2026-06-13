// Reactive holder for the loaded config.json. Replaces the old window.SITE_CONFIG
// global: utils and components import siteConfig() and read it reactively (the
// whole object is swapped in once, after load, via setSiteConfig()).
import { reactive } from 'vue'
import type { SiteConfig } from '@/types/config'

const holder = reactive<{ cfg: SiteConfig }>({ cfg: {} })

export function setSiteConfig(cfg: SiteConfig): void {
  holder.cfg = cfg
}

export function siteConfig(): SiteConfig {
  return holder.cfg
}
