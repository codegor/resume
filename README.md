# Résumé

A single-page, **filterable, living résumé** — editorial print-magazine aesthetic, light/dark themes,
a "Headlines" compact view, a print/PDF mode, and a DOM-measured serpentine work timeline.

Built as a modern **Vue 3 + Vite + TypeScript** app (`<script setup>` SFCs, SCSS, ESLint + Prettier +
Stylelint). One `yarn build` emits **two outputs**:

| Output                                      | What                                                                                                                                                                                                                | For                                                                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `dist/index.html`                           | multifile — JS in `assets/js/`, CSS in `assets/css/`, data/media in `assets/`                                                                                                                                       | **hosting** (nginx / GitHub Pages)                                                                                      |
| `dist/<name>_resume_offline_<MM.YYYY>.html` | one fully-inlined, **offline** file (code, styles, fonts, JSON, images); named from resume.json `name` + `updated` (e.g. `egor_berezovsky_resume_offline_06.2026.html`), also offered via the top-bar download menu | **email attachment** — videos stream from `https://codegor.github.io/resume/assets/video/*` (poster still when offline) |

## Project layout

The **repo root is the Vite root**: `package.json` + all build/quality config live here, `public/` is
Vite's root dir (its `index.html` is the entry → `dist/index.html`), and the TS/Vue source stays in
`src/ui/` (reached via the `@` → `src/ui` alias).

```
package.json  yarn.lock  vite.config.ts  tsconfig*.json  eslint/prettier/stylelint/playwright  .env
public/
  index.html     Vite entry → compiled to dist/index.html
  assets/        config.json, resume.json, certs/, video/, eras/, … (data/media)
src/ui/          TS/Vue source (no package.json here)
  main.ts  App.vue   components/ 41 SFCs   composables/  utils/  types/   assets/ scss + fonts
scripts/         assemble-resume.mjs (content assembler), finalize-single.mjs, i18n-extract-keys.mjs, …
src/tests/       Playwright E2E suite (one spec per use-case) + unit/ (vitest)
dist/            build output (generated; gitignored)
legacy/          archived no-build version + its assets/ (reference only)
CONFIG_GUIDE.md  end-user guide for editing the JSON
Dockerfile  docker-compose.yml  nginx.conf  Makefile   ops (app run; tests run from the Makefile)
.github/workflows/ci.yml                                 lint + unit + E2E on every PR / push to main
.github/workflows/deploy-pages.yml                       production → GitHub Pages
```

## Editing content

Content is authored in `public/assets/` as a **source tree** (2026-06-12 Step-2 split); the full
`resume.json` + `config.json` the app loads are **generated into `dist/` by the build** (`scripts/assemble-resume.mjs`):

- **`public/assets/resume/`** — the content tree (`NN_*.json` file+folder pairs: `base.json`, `courses/`,
  `conferences/`, `epochs/`). Work, skills, courses, conferences, education, the role filters, etc.
- **`public/assets/config.json`** — the **base** visual/interaction config (contacts, hero, CTA, videos,
  skillAliases…) minus `epochs{}` (epochs are authored in the `epochs/` tree). See `CONFIG_GUIDE.md`.

Edit the tree, then `yarn build` (or `node scripts/assemble-resume.mjs`) to regenerate the full files.
(The single-file offline `…_resume_offline_<MM.YYYY>.html` inlines them, so rebuild to refresh the attachment.)

## Two environments

|           | Local                                           | Production                                                |
| --------- | ----------------------------------------------- | --------------------------------------------------------- |
| URL       | `http://resume.local/` (root)                   | `https://codegor.github.io/resume/` (`/resume/` sub-path) |
| Built by  | the dev_env **`node`** container (`yarn build`) | **GitHub Actions** (`yarn build`)                         |
| Served by | dev_env nginx (serves `dist/`)                  | GitHub Pages                                              |
| Videos    | local `assets/video/*`                          | stream from `VITE_MEDIA_BASE_URL`                         |

`base: './'` (relative URLs) makes the same build work at both the root and the `/resume/` sub-path.

### Local workflow (dev_env)

Files are edited on Windows and **auto-synced (VS Code SFTP)** to the remote `mac`. The build runs in
the already-running dev_env `node:22` container; nginx serves `dist/`.

```bash
make dev-install     # yarn install in the node container
make dev-build       # yarn build  (emits both index.html + <name>_resume_offline_<MM.YYYY>.html)
make dev-watch       # rebuild dist/ on every change → just refresh the browser
make dev-reload      # reload the dev_env nginx vhost (only after a vhost edit)
```

### Production (GitHub Pages)

Push to `main` → `.github/workflows/deploy-pages.yml` builds and deploys `dist/` to
`https://codegor.github.io/resume/`. Set the repo **variable** `VITE_MEDIA_BASE_URL` to the host the
videos stream from (so large mp4s aren't committed).

## Standalone Docker (portability)

```bash
make run                 # docker compose up --build → http://localhost:8081
make prod-build prod-run # build + run the production image
docker compose --profile dev up   # local Vite HMR dev server on :3000
```

## Scripts (run from the repo root)

```bash
yarn dev          # Vite dev server (HMR) on :3000
yarn build        # type-check + both variants → dist/
yarn watch        # vite build --watch → dist/
yarn run check    # type-check + eslint + stylelint + prettier (read-only gate; NOT `yarn check`, the Yarn-1 dep verifier)
yarn lint:fix     # eslint --fix      yarn format   # prettier --write
yarn test         # Playwright E2E (src/tests)
yarn test:unit    # vitest unit tests (src/tests/unit)
```

## Testing

`make test` runs the Playwright suite via the official Playwright docker image against the served site
(`PLAYWRIGHT_BASE_URL`, default `http://resume.local`) — desktop + mobile projects, one spec per
use-case (load, theme, filters, skills, video, guide, expand/collapse, md-export, print, mobile,
timeline, single-file). `docker-compose` runs the **app only**; tests run from the Makefile.

**Unit tests** (vitest) live in `src/tests/unit/` — `yarn test:unit` (assembler / site-data adapter /
filters / i18n). Both gates run in CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) on every
PR and push to `main`, and the Pages deploy ([`deploy-pages.yml`](.github/workflows/deploy-pages.yml))
re-runs `check` + unit + E2E before publishing.

## License

Proprietary — **All Rights Reserved**. See [LICENSE](LICENSE). Viewing the published site is fine;
reusing the code or design requires written consent (codeegor@gmail.com).
