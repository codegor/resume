# How to test this résumé — a human walkthrough

> A story-driven manual QA pass. Each scene is **a goal a real visitor might have**,
> the **exact path** to do it, and **what you should see**. Walk top-to-bottom once and
> you'll have exercised every ability the page has.
>
> **Where to test:** open `http://resume.local` (the served dev build) or the built
> `dist/index.html`. The app is ready when the "Loading résumé…" line is gone and the
> hero is painted (internally `window.__appReady` is set). Most state persists in
> `localStorage` — see _Scene 0_ to start clean.

---

## Standard test matrix — run after every change

Walk the scenes below in **each** of these contexts; a change isn't "done" until all pass.
Use the browser dev-tools device toolbar (or `Playwright browser_resize`) for the widths.

| Mode               | Width / how                              | What's special                                                                                            |
| ------------------ | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Desktop**        | ≥ 1281px                                 | Full top bar (labelled contacts), full Focus chip row on one line.                                        |
| **iPad Pro**       | **1024px** — the **"iPad"** size         | Compact one-line top bar (icon contacts + ⓘ), Focus chips still full.                                     |
| **iPad Mini**      | 768px                                    | Mobile shell: view switches in their own sticky bar; Focus bar collapses to a rail once stuck to the top. |
| **iPhone**         | ~390–393px                               | Mobile shell; the Focus rail swipes horizontally and the ⓘ menu mirrors the switches when scrolled.       |
| **Galaxy Z**       | 344px                                    | Narrowest phone — nothing clips or overflows; rail funnel + pills stay legible.                           |
| **Print / PDF**    | Download ▾ → Print (or `window.print`)   | Light theme, expanded content, and **no top bar / switches bar / Focus bar / section-nav** on paper.      |
| **Markdown (.md)** | Download ▾ → Markdown                    | The exported `.md` mirrors the visible résumé.                                                            |
| **Offline**        | open `dist/resume_offline.html` directly | Single inlined file works with no server (videos stream from the CDN).                                    |

> Breakpoint ladder to expect: **>1200** full desktop top bar · **981–1200** compact one-line top bar +
> full Focus chips · **≤980** mobile shell (switches hand off) + the Focus bar collapses to its rail when
> it sticks to the top, re-expanding at its home position.

---

## Scene 0 — Start clean (so persisted state doesn't fool you)

The site remembers **theme**, **Headlines**, and **Recent · 5y** across reloads
(`resume-theme`, `resume-compact`, `resume-recent` in `localStorage`).

1. Open the page.
2. Open dev-tools console and run `localStorage.clear()`, then reload.
3. **You should see:** warm-cream **light** theme. First visit defaults to **Headlines + Recent · 5y
   ON** (the condensed first impression — a timeline teaser, capped skills, secondary sections folded
   away). Turn **both toggles OFF** to see the **full** view, which has: the top bar, the hero (photo
   plus round video bubble), a two-paragraph intro (the _"With 16+ years…"_ lead with a terracotta
   drop-cap, then a _"What I want to learn next…"_ paragraph — no drop-cap; on desktop both wrap
   around the photo, the second running full-width beneath it; on mobile/print they stack full-width),
   the **Focus** filter bar, Skills, the curved timeline, "How I work", a testimonial, Certificates,
   Education / Languages / Other, and a footer with a feedback box.

> Tip: the in-app field guide is the canonical feature list. Click **"How to use"**
> (top bar, ⓘ) any time — every story below mirrors one of its entries.

---

## Scene 1 — First impression & the guided tour

1. Click **How to use** in the top bar.
2. **See:** a modal titled _"How to read this résumé"_ listing ~14 numbered stories
   (feed to AI, last 5 years, Headlines, filter by role, find a skill, etc.).
3. Press **Esc** (or click the ✕ / the dark backdrop).
4. **See:** the modal closes.

---

## Scene 2 — Read me through one role's lens (Focus filters)

1. In the **Focus** bar, click a role chip — e.g. **AI**, **Architect**, **Team Lead**,
   **Backend**, **Frontend**, **QA**, or **DevOps**. Each chip shows a **count**.
2. **See:**
   - The chip turns terracotta (active).
   - **Skills** narrow to that role's groups/skills.
   - **Timeline** keeps only projects relevant to the role.
   - Each project's **Technologies** show only the relevant ones; the rest collapse
     behind a **"+N more"** pill.
   - **Always-learning** courses & conferences filter too.
   - A collapsed era shows a **"+N more roles"** pill.
3. Click **Clear** (or the chip again, or the `✕`) → everything returns to "all".
   - On a narrow window the word "Clear" compacts to a `✕`.

**Cross-check the count:** the number on a chip should equal the projects left on the
timeline when that filter is active.

---

## Scene 3 — Find where I used a specific skill (skill highlight)

1. Click a **skill chip that has the ↗ icon** (in Skills, or a project's Technologies).
2. **See:**
   - A small toast: _"Highlighting "X" across skills & projects"_.
   - That skill lights up **everywhere** it appears — Skills groups and every project
     that used it.
   - The page **scrolls to Skills** (to the matching group).
   - A pill for the active skill appears in the Focus bar with an `✕`.
3. Click the same chip again, or the pill's `✕` → highlight clears.

---

## Scene 4 — Filter the whole résumé by a project-only tool (funnel chips)

1. Click a chip with the **⏷ funnel icon** — a project-specific term that is _not_ a
   standalone skill (e.g. _"Sentry Catch lib"_).
2. **See:** a toast _"Filtering everything by "X""_ and the page jumps to the
   **timeline**, now filtered by that term (different behaviour from Scene 3's
   skill-highlight).
3. Clear via the active-skill pill `✕`.

---

## Scene 5 — Check one exact tool from a vacancy (search)

1. In the Focus bar's **search box** ("Search a skill — e.g. RabbitMQ, RAG…"), type a
   real term, e.g. `postgres`, `RabbitMQ`, `RAG`, `Symfony`.
2. **See:**
   - On first keystroke the page scrolls to **Skills**, which narrows to matching skills
     — _including ones normally hidden behind "+N more"_.
   - A **"N found ▾"** button appears. Click it for a breakdown panel: counts of
     matching **skills / projects / courses & conferences**, each a jump link.
3. Type nonsense (e.g. `zzzz`) → panel says _"Nothing matches… try a shorter spelling"_.
4. Click the **✕** in the search field → query clears, full Skills returns.

---

## Scene 6 — The 30-second version (Headlines / compact)

1. Click the **Headlines** toggle (top bar, near the brand).
2. **See:**
   - The page collapses to essentials — a short intro, headline skills & languages;
     most sections hide.
   - **Recent · 5y also turns on automatically** (Headlines implies recent).
   - **Skills** show only the configured headline groups (Agent Dev, Architect, Team Lead,
     Backend, Frontend), each capped to its curated **top ~7** chips with a per-group **"+N more"**;
     QA, DevOps, IDE & Want-to-learn fold into one **"+N more skill areas — show all"** pill
     (driven by `skillsHeadline` / per-group `headline[]` in `base.json`).
   - **Timeline** shows a **faded teaser** — a real glimpse of the most-recent era that fades to the
     page bg — with a **"Show recent projects…"** reveal button at the foot (a news-site preview).
     Clicking it drops Headlines but keeps Recent·5y. Reveal notice appears (Scene-7 style).
3. Click **"+N more skill areas — show all"** → **Headlines switches OFF and every group reveals**,
   but **Recent · 5y stays ON** (verify its toggle is still on). The full skills grid returns.
4. Reload the page → **Headlines is still on** (persisted). Toggle it back off.

---

## Scene 7 — Only the last 5 years (Recent · 5y)

1. With Headlines **off**, click **Recent · 5y**.
2. **See:** the timeline keeps only roles whose work **ended within the last 5
   years**; Skills narrow to skills used **in those recent roles _or_ in courses /
   conferences from the last 5 years**; the **Always-learning** section likewise keeps
   only recent courses/conferences; older eras/skills drop.
   - The 5-year window is measured from the résumé's **last-update date** (`updated` in
     `base.json`), not the wall clock — so the cut-off matches the dates printed on the page.
   - Sanity: the **Agent Development (AI / LLM)** group shows **no "+N more"** under
     Recent (every AI skill is within 5y); a skill used only in a pre-window project
     (e.g. an old PHP-era tech) stays hidden.
   - **Timeline projects** also cap their Technologies to their **main** set (a project's `main[]`
     if authored, else **2 top techs from each role it covers**), the rest behind a **"+N more"** (in
     print: "… on interactive online"). A focus filter / skill / search suppresses this (tech narrows
     to the query instead).
3. Toggle off → everything returns + a **"Now showing everything"** notice appears (closes via "Got it" / **Enter** / ✕ / Esc — no auto‑dismiss; the notice is transient and does not persist across reload).

> **Reveal notices:** turning **Headlines OFF** ("Here's more about me") or **Recent·5y OFF**
> ("Now showing everything") pops a small dismissible modal — a few short paragraphs explaining
> what's now shown, ending with a **Tip** (Headlines → use the Focus filter; Recent → click a skill
> or use skill search). It closes via "Got it" / **Enter** / ✕ / Esc, and only appears on an explicit
> toggle‑off — **not** when a focus filter/skill/search auto‑drops Headlines.

---

## Scene 8 — Open everything at once (Expand all)

1. Click **Expand all**.
2. **See:** every role and every conference/course card expands together — good for a
   full read-through or **Ctrl-F** across all detail.
3. **Now collapse one card by hand:** the **Expand all** toggle drops off, but the other
   cards stay open.
4. Click **Expand all** again → re-opens everything.

---

## Scene 9 — Read a conference or course card (description + programme link)

In the timeline, conferences and courses appear as cards tagged **CONFERENCE** or
**COURSE**. A card that has detail shows a **⌄ chevron** at the top-right.

1. Find such a card — e.g. **"Course: Software Architecture Design in Practice"** or
   **"Fwdays + DevRain AI"** — and click its header (or use **Expand all**, Scene 8).
2. **See:** the card opens to a **one-line description** of what the course/conference
   covered, plus a **"View programme on fwdays ↗"** link.
3. Click the link → the matching **fwdays programme page** opens in a new tab.
4. Click the header again → it collapses.
5. **Both conferences _and_ courses** behave this way (courses gained descriptions +
   programme links in June 2026). The link label adapts to the destination: **"View
   programme on fwdays ↗"** for fwdays events, and a generic **"View programme ↗"** for
   non-fwdays ones — e.g. **Vue.js Forge 3**, which links to `vuejsforge.com`.

---

## Scene 10 — Exact dates of a role

1. **Hover the (i)** next to a role title in the timeline.
2. **See:** a tooltip with the precise **start–end dates** for that specific project.
   (In print, those dates render inline instead — see Scene 14.)

---

## Scene 11 — Watch the intro video

1. Click the **round video bubble** next to the hero photo.
2. **See:** a modal plays a talking-head intro — the **30-second cut** when Headlines is
   on, the **full version** otherwise. Close it (✕ / Esc / backdrop).
3. Also try a **project video** if a timeline project shows a play affordance.

---

## Scene 12 — Spot what's new and in demand (badges)

1. Scan the Skills section (and timeline / certificates).
2. **See:**
   - **Highlighted chips** (soft tint + bolder text) = skills _in demand right now_.
   - A bold orange **NEW** badge = the freshest, most in-demand skills just started.
   - Other first-time skills get a small dot or a lightly highlighted chip.
   - Mnemonic: **highlighted = hot now, NEW = newly added.**

---

## Scene 13 — Download / feed to an AI (the ⤓ menu)

Click the **download (⤓)** button in the top bar. It opens a menu with three items:

1. **Print / Save as PDF** — see Scene 14.
2. **Markdown (.md) — for ATS & AI**
   - Click it → a `.md` of the **entire** résumé downloads (every skill, project, course,
     conference, fully expanded).
   - Open it: plain text, parser-friendly. Paste it into Claude/ChatGPT or an ATS.
3. **Download offline version** (hidden in the already-offline single-file build)
   - Click it → one self-contained `.html` downloads.
   - **Test it:** open that file with **no network / file://** — it should render the
     full résumé (styles + content inlined). Videos stream from the configured media URL,
     so they need network; everything else works offline.

---

## Scene 14 — Read it on paper / Save as PDF (print mode)

1. **⤓ → Print / Save as PDF** (preferred — it expands content and waits for images
   before printing). A raw **Ctrl/Cmd-P** also works.
2. In the print preview **see:**
   - Forced **light theme**, white background.
   - **All** collapsed content expanded. **Print is WYSIWYG — it honors the visible Headlines toggle**
     (see the Headlines vs full bullet below); the Skills cap and timeline teaser apply **only when
     Headlines is ON**.
   - **With Headlines ON, Skills fit ~one page**: print shows only the configured headline groups,
     each capped to its curated ~7 chips (single column, tightened), with "+N more … on interactive
     online" links for the rest and one "+N more skill areas …" link for the folded groups.
     **No other section's print layout changes.** With **Headlines OFF** the Skills section prints in
     full — every group and every chip (no caps, no "+N more" pills).
   - Hero = **portrait left / intro right**.
   - **Clickable** contact links; role dates shown **inline**.
   - Language bars keep their colour; a clickable page-link in the footer.
   - No cream background bleeding onto the page (it shouldn't).
   - **Save-as filename** defaults to `egor_berezovsky_resume_print_MM-YYYY` (set via `document.title`;
     works on Android. On Windows "Microsoft Print to PDF" the field comes up blank — a platform
     limitation, not something the page controls). The print running-header shows that same slug.
   - Each **timeline conference / course** card shows its **description + event link** (online
     they only appear after you expand the card).
   - The **footer** swaps its screen "New here?" + AI lines for a print **promo paragraph** with
     accent links to the live résumé (the "How to use guide" + the URL).
   - **In Headlines mode**, the timeline shows a **teaser** — a glimpse of the most-recent era —
     under it an accent link "See the projects on the timeline — on the interactive, AI-ready online
     version". **On screen** the teaser fades out via an alpha mask (and online the link is instead a
     "Show recent projects on the timeline" button that drops Headlines but keeps Recent·5y).
     **In print** the fade/clip is removed (`mask-image: none`, `max-height: none`), so the teaser's
     era intro prints **in full** with the "read online" link just below. Same layout shape online and
     in print (desktop spine / mobile single column).
   - **With Headlines OFF (and Recent · 5y OFF)** the timeline prints in **full** — every era and
     **every project card** (no teaser) — matching what's on screen.
3. **With Recent · 5y ON** (or any focus filter / skill / search active), also see:
   - A centered **status line** in the folio header listing the active view + filters, e.g.
     "Recent 5 years · Architect role · skill: Vue.js only — more on interactive online"
     ("Headlines" replaces "Recent 5 years" when Headlines is on; "·"-joined).
   - The Skills **"+N more"** and the **"+N earlier eras"** pill read **"… on interactive online"**
     and are accent **links** to the live résumé.
   - The **Always learning** section prints at most **2 courses + 2 conferences**, each followed by
     a "+N more … on interactive online" accent link.
4. Close the dialog → the page returns to its previous theme (light/dark restored) and the tab
   title is restored to "{name} — Résumé".

> The screen footer carries an **AI-ready advert** ("Hiring with AI? … Download Markdown (.md)")
> whose button triggers the same Markdown export as the ⤓ menu — this is the one change visible in
> the normal (non-print) view.

> A4 ≈ 794px wide, which is below the 980px mobile breakpoint — print and mobile layouts
> are independent, so verify both separately.

---

## Scene 15 — Switch the mood (theme)

1. Click the **moon / sun** icon.
2. **See:** the whole site flips between warm-cream **light** and **dark**.
3. Reload → the chosen theme **persists**.

---

## Scene 16 — Navigate & get in touch

1. **Section nav** (the on-page jump dots/links): click through to jump between sections;
   the active section should track as you scroll.
2. **Contacts** (top bar): **Telegram · LinkedIn · GitHub · Email**.
   - Telegram / LinkedIn / GitHub open in a new tab.
   - **Email** opens a `mailto:` with a pre-filled subject & intro body.
3. **Feedback box** at the very bottom of the footer — leave a note and submit; confirm
   the expected success/acknowledgement behaviour.

---

## Scene 17 — Mobile layout (≤ 980px)

1. Resize the window to **390 × 844** (iPhone 12) — or use device emulation.
2. **See:** the mobile shell engages — contact labels collapse to icons / a menu, the view
   switches move to their own sticky bar, and the Focus bar collapses to a horizontal rail once
   it sticks to the top (the ⓘ menu then mirrors the switches). Re-run Scenes 2, 5, 6 on mobile.
3. Resize back to desktop → layout restores.

---

## Scene 18 — The serpentine timeline (resize/zoom redraw)

1. Look at the curved **"spine"** threading the timeline dots.
2. **Resize** the window and **zoom** the browser (Ctrl +/−).
3. **See:** the spine **re-measures and redraws** to keep hitting the era dots (it's an
   SVG measured from `.epoch-dot` positions; recomputes on resize/zoom). No broken or
   detached curve.

---

## Scene 19 — Robustness / error state

1. **Healthy boot:** console has **no errors**; the boot-error screen does **not** appear.
2. **Broken-data check (optional):** if `assets/config.json` or `assets/resume.json`
   404s or is malformed, the app shows the **boot-error / "Couldn't load data"** screen
   instead of a half-rendered page. Confirm a _good_ build does **not** trip it.

---

## Scene 20 — Language (i18n)

The site is i18n-ready but **ships with English only**, so the **language switcher is
hidden** until a second locale is registered (`availableLangs().length > 1`). To exercise
the machinery:

1. **English (default):** every visible string renders in English; `<html lang="en">`;
   the document title is _"Egor Berezovsky — Résumé"_. The console shows **no
   `[i18n] missing …` lines** on a good build (every key resolves from `src/ui/locales/en.json`).
2. **Add a locale to test** (dev only): create `src/ui/locales/<code>.json` from `en.json`,
   translate a few values, register it in `src/ui/composables/i18n.ts` (`dictionaries` +
   `PLURAL_ORDER` if needed), and rebuild. Then:
   - A **language switcher appears in the footer** (under the contact-handle line: `EN · <CODE>`).
   - Click the other language → **UI strings, localized data fields (any `{ "en": …, "<code>": … }`
     value in `config.json`/`resume.json`), the document title, and `<html lang>` all switch
     live, with no page reload**; the active button is terracotta.
   - The choice **persists** (`localStorage['resume-lang']`) and `?lang=<code>` in the URL
     selects it on load (an unknown `?lang=` falls back to English).
   - Any phrase missing from `<code>.json` falls back to English **and** logs one
     `console.info('[i18n] missing …')` per key.
3. Remove the temporary locale to return to the en-only ship.

> Authoring: add `{ "en": "…", "<code>": "…" }` only to text fields — never to
> dates/periods, tech names, ids, or URLs (the filter/sort engine parses those). See
> `CONFIG_GUIDE.md → Localizing content`.

---

## Quick coverage checklist

- [ ] Guided tour modal opens/closes (Esc)
- [ ] Focus role filters + counts + Clear
- [ ] Skill-highlight chips (↗) light up site-wide + toast + clear
- [ ] Funnel chips (⏷) filter whole résumé
- [ ] Search narrows Skills + "N found" breakdown + empty state
- [ ] Headlines (auto-enables Recent · 5y) + persists
- [ ] Recent · 5y standalone + persists
- [ ] Expand all + hand-collapse drops the toggle
- [ ] Conference/course card expands → one-line description + programme link ("View programme on fwdays ↗" for fwdays; generic "View programme ↗" for non-fwdays, e.g. Vue.js Forge 3 → vuejsforge.com; courses included)
- [ ] Role-date (i) tooltip
- [ ] Intro video modal (30s in Headlines, full otherwise)
- [ ] NEW badges & highlighted chips
- [ ] Markdown export downloads & is complete
- [ ] Offline `.html` opens with no network
- [ ] Print / Save as PDF (light, expanded, clickable, inline dates)
- [ ] Theme toggle + persists
- [ ] Section nav + contacts + feedback box
- [ ] Mobile ≤980px layout
- [ ] Serpentine spine redraws on resize/zoom
- [ ] No console errors / no boot-error screen on a good build
- [ ] English-only: language switcher hidden, no `[i18n] missing` console lines; (dev) a 2nd locale switches UI + data + title + `<html lang>` live and persists
