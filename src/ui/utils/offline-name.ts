// Filename for the single-file offline build (and its top-bar download link).
// Dependency-free on purpose: imported by the app (TopBar/dom), by the Playwright
// single-file test, and re-implemented verbatim in scripts/finalize-single.mjs
// (a plain .mjs can't import this .ts) — all three MUST stay in sync so the link
// the page generates resolves to the file the build actually wrote.
//
// e.g. offlineFileName('Egor Berezovsky', '2026-06-10') → 'egor_berezovsky_resume_offline_06.2026.html'

export function offlineFileName(name?: string | null, updated?: string | null): string {
  const slug =
    String(name || 'resume')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'resume'
  const m = String(updated || '').match(/(\d{4})-(\d{2})/) // YYYY-MM
  const date = m ? `${m[2]}.${m[1]}` : '' // → MM.YYYY
  return date ? `${slug}_resume_offline_${date}.html` : `${slug}_resume_offline.html`
}
