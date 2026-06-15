// Filename for the single-file offline build (and its top-bar download link).
// Dependency-free on purpose: imported by the app (TopBar/dom), by the Playwright
// single-file test, and re-implemented verbatim in scripts/finalize-single.mjs
// (a plain .mjs can't import this .ts) — all three MUST stay in sync so the link
// the page generates resolves to the file the build actually wrote.
//
// e.g. offlineFileName('Egor Berezovsky', '2026-06-10') → 'egor_berezovsky_resume_offline_06.2026.html'

function slugParts(
  name?: string | null,
  updated?: string | null,
): { slug: string; mm: string; yyyy: string } {
  const slug =
    String(name || 'resume')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'resume'
  const m = String(updated || '').match(/(\d{4})-(\d{2})/)
  return { slug, mm: m ? m[2] : '', yyyy: m ? m[1] : '' }
}

export function offlineFileName(name?: string | null, updated?: string | null): string {
  const { slug, mm, yyyy } = slugParts(name, updated)
  const date = mm ? `${mm}.${yyyy}` : ''
  return date ? `${slug}_resume_offline_${date}.html` : `${slug}_resume_offline.html`
}

// PDF "Save as" filename — set as document.title before window.print() (browser appends ".pdf").
// HYPHEN date, not the offline dot, so a trailing ".YYYY" isn't read as an extension. Works on
// Android; Windows "Microsoft Print to PDF" blanks the field regardless (a platform limitation).
export function printFileName(name?: string | null, updated?: string | null): string {
  const { slug, mm, yyyy } = slugParts(name, updated)
  const date = mm ? `${mm}-${yyyy}` : ''
  return date ? `${slug}_resume_print_${date}` : `${slug}_resume_print`
}
