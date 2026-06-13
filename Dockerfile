# Multi-stage build: yarn build the Vue app, then serve dist/ with nginx.
# OPTIONAL portability path — the dev_env primary flow builds in the existing
# `node` container and serves via the dev_env nginx. (See README / Makefile.)

# ---- builder ----
# Repo root is the Vite root (package.json + config live here; public/ holds index.html;
# the TS/Vue source is in src/ui/).
FROM node:22-alpine AS builder
WORKDIR /app

# .env var(s) baked at build time (e.g. the remote media host for the single-file build)
ARG VITE_MEDIA_BASE_URL=""
ENV VITE_MEDIA_BASE_URL=$VITE_MEDIA_BASE_URL
# Fallback media host for the single build when VITE_MEDIA_BASE_URL is empty
# (empty here → vite.config.ts default https://codegor.github.io/resume).
ARG VITE_DEFAULT_MEDIA_BASE_URL=""
ENV VITE_DEFAULT_MEDIA_BASE_URL=$VITE_DEFAULT_MEDIA_BASE_URL
# Live-résumé URL (globe icon / mobile menu / print / .md); empty → config.json resumeUrl
ARG VITE_RESUME_URL=""
ENV VITE_RESUME_URL=$VITE_RESUME_URL

RUN corepack enable

# install deps first (better layer caching)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# the rest of the build inputs (vite/ts config at root, source in src/ui, static in public,
# build helpers in scripts). .dockerignore keeps node_modules/dist/legacy/… out.
COPY . .

# build (emits dist/index.html + dist/<name>_resume_offline_<MM.YYYY>.html → /app/dist)
RUN yarn build

# ---- runner ----
FROM nginx:1.27-alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s --retries=5 CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1
