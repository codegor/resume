// Shared inline icon registry, rendered by components/Icon.vue (<icon name="…"/>).
// Each entry = { inner SVG markup, optional fill/stroke/stroke-width }. viewBox 0 0 24 24.
export interface IconDef {
  inner: string
  fill?: string
  stroke?: string
  sw?: number
}

export const ICONS: Record<string, IconDef> = {
  telegram: {
    fill: 'currentColor',
    inner:
      '<path d="M21.94 4.3 18.7 19.6c-.24 1.08-.88 1.35-1.79.84l-4.94-3.64-2.38 2.3c-.26.26-.49.49-1 .49l.36-5.06 9.2-8.31c.4-.36-.09-.56-.62-.2L6.16 13.1l-4.9-1.53c-1.06-.33-1.08-1.06.22-1.57L20.57 2.8c.89-.33 1.66.2 1.37 1.5Z"/>',
  },
  linkedin: {
    fill: 'currentColor',
    inner:
      '<path d="M6.94 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM3.2 8.5h3.5V21H3.2V8.5Zm5.46 0h3.36v1.7h.05c.47-.84 1.6-1.72 3.3-1.72 3.53 0 4.18 2.2 4.18 5.05V21h-3.5v-5.54c0-1.32-.03-3.02-1.85-3.02-1.85 0-2.13 1.43-2.13 2.92V21H8.66V8.5Z"/>',
  },
  github: {
    fill: 'currentColor',
    inner:
      '<path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48l-.01-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.46-1.11-1.46-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85l-.01 2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/>',
  },
  mail: {
    stroke: 'currentColor',
    sw: 1.8,
    inner: '<rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="m3 6 9 6.5L21 6"/>',
  },
  sun: {
    stroke: 'currentColor',
    sw: 1.8,
    inner:
      '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>',
  },
  moon: {
    fill: 'currentColor',
    inner: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>',
  },
  print: {
    stroke: 'currentColor',
    sw: 1.8,
    inner:
      '<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7" rx="1"/>',
  },
  md: {
    stroke: 'currentColor',
    sw: 1.8,
    inner:
      '<path d="M11 2.5 12.6 6.4 16.5 8l-3.9 1.6L11 13.5 9.4 9.6 5.5 8l3.9-1.6Z" fill="currentColor" stroke="none"/><path d="m17.5 10.5.75 1.75L20 13l-1.75.75-.75 1.75-.75-1.75L15 13l1.75-.75Z" fill="currentColor" stroke="none"/><path d="M3.5 16.5v2a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-2"/>',
  },
  chevron: { stroke: 'currentColor', sw: 2, inner: '<path d="m6 9 6 6 6-6"/>' },
  play: { fill: 'currentColor', inner: '<path d="M8 5.5v13l11-6.5z"/>' },
  pause: { fill: 'currentColor', inner: '<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/>' },
  muted: {
    stroke: 'currentColor',
    sw: 1.8,
    inner:
      '<path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" stroke="none"/><path d="m16 9 5 6m0-6-5 6"/>',
  },
  sound: {
    stroke: 'currentColor',
    sw: 1.8,
    inner:
      '<path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" stroke="none"/><path d="M16 8.5a4 4 0 0 1 0 7M18.5 6a7.5 7.5 0 0 1 0 12"/>',
  },
  x: { stroke: 'currentColor', sw: 2, inner: '<path d="M6 6l12 12M18 6 6 18"/>' },
  award: {
    stroke: 'currentColor',
    sw: 1.7,
    inner: '<circle cx="12" cy="9" r="6"/><path d="m8.5 13.5-1.5 7 5-3 5 3-1.5-7"/>',
  },
  mic: {
    stroke: 'currentColor',
    sw: 1.7,
    inner:
      '<rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  },
  cam: {
    stroke: 'currentColor',
    sw: 1.7,
    inner:
      '<rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="m15.5 10 6-3.5v11l-6-3.5z"/>',
  },
  cap: {
    stroke: 'currentColor',
    sw: 1.7,
    inner: '<path d="M12 4 2 9l10 5 8-4v6"/><path d="M6 11.5V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.5"/>',
  },
  arrow: { stroke: 'currentColor', sw: 2, inner: '<path d="M5 12h14M13 6l6 6-6 6"/>' },
  spark: {
    fill: 'currentColor',
    inner:
      '<path d="M12 2c.4 4.7 2.3 6.6 7 7-4.7.4-6.6 2.3-7 7-.4-4.7-2.3-6.6-7-7 4.7-.4 6.6-2.3 7-7Z"/>',
  },
  jump: { stroke: 'currentColor', sw: 2, inner: '<path d="M8 16 16 8M9 8h7v7"/>' },
  info: {
    stroke: 'currentColor',
    sw: 1.8,
    inner:
      '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="7.8" r="0.6" fill="currentColor" stroke="none"/>',
  },
  filter: {
    stroke: 'currentColor',
    sw: 2,
    inner: '<path d="M4 5h16l-6 7v6l-4-2v-4z" stroke-linejoin="round"/>',
  },
  'funnel-more': {
    stroke: 'currentColor',
    sw: 1.8,
    inner:
      '<path d="M4 4h16l-6 7v3.5l-4 2V11L4 4Z" stroke-linejoin="round" stroke-linecap="round"/><circle cx="7" cy="20.5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="20.5" r="1" fill="currentColor" stroke="none"/><circle cx="17" cy="20.5" r="1" fill="currentColor" stroke="none"/>',
  },
  pin: {
    stroke: 'currentColor',
    sw: 1.8,
    inner:
      '<path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
  },
  globe: {
    stroke: 'currentColor',
    sw: 1.7,
    inner:
      '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a13.5 13.5 0 0 1 0 18M12 3a13.5 13.5 0 0 0 0 18"/>',
  },
  clock: {
    stroke: 'currentColor',
    sw: 1.8,
    inner: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  },
  lang: {
    stroke: 'currentColor',
    sw: 1.8,
    inner:
      '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-2.9-.4-4.1-1L3 20l1-5.4A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8.5 11.5h.01M12.5 11.5h.01M16.5 11.5h.01" stroke-linecap="round" stroke-width="2.4"/>',
  },
  download: {
    stroke: 'currentColor',
    sw: 1.8,
    inner:
      '<path d="M12 3.5v11m0 0 4.5-4.5M12 14.5 7.5 10"/><path d="M4 17.5v1a2.5 2.5 0 0 0 2.5 2.5h11a2.5 2.5 0 0 0 2.5-2.5v-1"/>',
  },
  search: {
    stroke: 'currentColor',
    sw: 1.8,
    inner: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 5 5"/>',
  },
  'arrow-up': { stroke: 'currentColor', sw: 2, inner: '<path d="M12 19V5M6 11l6-6 6 6"/>' },
}
