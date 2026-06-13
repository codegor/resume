/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_MEDIA_BASE_URL?: string
  readonly VITE_RESUME_URL?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  __appReady?: boolean
  __openVideo?: (key: string) => void
  __toast?: (msg: string) => void
  __resources?: Record<string, string>
  __bootError?: () => void
}
