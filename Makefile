# Egor Berezovsky résumé — quick commands.
# .env (repo root) vars are loaded and passed to docker build as build-args.

ifneq (,$(wildcard .env.local))
	include .env.local
	export
else ifneq (,$(wildcard .env))
	include .env
	export
endif

# Defaults (override via env or .env)
NODE_CONTAINER ?= node
# The repo root is the Vite root (package.json + config live here); builds run from it.
REMOTE_DIR ?= /var/www/resume
# MUST track the installed @playwright/test version (the image bakes in matching browser
# binaries). `yarn list @playwright/test` resolves ^1.49.1 → 1.60.0, so the image is
# v1.60.0-jammy. A stale pin fails at browser launch ("Executable doesn't exist …
# chromium_headless_shell-<rev>"). Bump this in lockstep whenever the lockfile bumps.
PLAYWRIGHT_IMAGE ?= mcr.microsoft.com/playwright:v1.60.0-jammy
PLAYWRIGHT_BASE_URL ?= http://resume.local
VITE_MEDIA_BASE_URL ?=
VITE_DEFAULT_MEDIA_BASE_URL ?=
VITE_RESUME_URL ?=
WEB_PORT ?= 8081

.PHONY: help dev-install dev-build dev-watch dev-reload run up down stop prod-build prod-run static-prod-build test test-unit lint format

help:
	@echo "dev_env (build in the existing node container, serve via dev_env nginx):"
	@echo "  make dev-install   yarn install in the node container"
	@echo "  make dev-build     yarn build  in the node container (both variants)"
	@echo "  make dev-watch     yarn watch  (rebuild dist/ on change)"
	@echo "  make dev-reload    reload the dev_env nginx vhost"
	@echo "app run (standalone Docker, arch-style):"
	@echo "  make run|up|down|stop      docker compose"
	@echo "  make prod-build|prod-run   production image"
	@echo "  make static-prod-build     builder stage only (extract dist/ for Pages)"
	@echo "quality:"
	@echo "  make test          Playwright suite via the official playwright image"
	@echo "  make test-unit     vitest unit tests in the node container"
	@echo "  make lint          yarn check (type + eslint + stylelint + prettier)"
	@echo "  make format        yarn format"

# ---- dev_env (primary) ----
dev-install:
	docker exec $(NODE_CONTAINER) sh -c "corepack enable >/dev/null 2>&1; cd $(REMOTE_DIR) && yarn install"

dev-build:
	docker exec $(NODE_CONTAINER) sh -c "corepack enable >/dev/null 2>&1; cd $(REMOTE_DIR) && VITE_MEDIA_BASE_URL=$(VITE_MEDIA_BASE_URL) VITE_DEFAULT_MEDIA_BASE_URL=$(VITE_DEFAULT_MEDIA_BASE_URL) VITE_RESUME_URL=$(VITE_RESUME_URL) yarn build"

dev-watch:
	docker exec $(NODE_CONTAINER) sh -c "corepack enable >/dev/null 2>&1; cd $(REMOTE_DIR) && yarn watch"

dev-reload:
	docker compose exec nginx sh -c "nginx -t && nginx -s reload"

# ---- standalone app run (arch-style) ----
run:
	docker compose up --build

up:
	docker compose up -d --build

down:
	docker compose down

stop:
	docker compose stop

prod-build:
	docker build . -f Dockerfile -t resume --build-arg VITE_MEDIA_BASE_URL=$(VITE_MEDIA_BASE_URL) --build-arg VITE_DEFAULT_MEDIA_BASE_URL=$(VITE_DEFAULT_MEDIA_BASE_URL) --build-arg VITE_RESUME_URL=$(VITE_RESUME_URL)

prod-run:
	docker run --rm -p $(WEB_PORT):80 resume

# build only the `builder` stage and tag it, so dist/ can be extracted from the
# container (used by the GitHub Pages workflow — no nginx runner needed).
static-prod-build:
	docker build . -f Dockerfile --target builder -t resume-static --build-arg VITE_MEDIA_BASE_URL=$(VITE_MEDIA_BASE_URL) --build-arg VITE_DEFAULT_MEDIA_BASE_URL=$(VITE_DEFAULT_MEDIA_BASE_URL) --build-arg VITE_RESUME_URL=$(VITE_RESUME_URL)

# ---- Playwright tests (official playwright docker image; NOT compose) ----
test:
	docker run --rm --ipc=host -v "$(CURDIR)":/work -w /work \
		-e PLAYWRIGHT_BASE_URL=$(PLAYWRIGHT_BASE_URL) \
		$(PLAYWRIGHT_IMAGE) \
		sh -c "corepack enable && yarn install --frozen-lockfile && yarn test"

# ---- quality ----
lint:
	docker exec $(NODE_CONTAINER) sh -c "corepack enable >/dev/null 2>&1; cd $(REMOTE_DIR) && yarn run check"

test-unit:
	docker exec $(NODE_CONTAINER) sh -c "corepack enable >/dev/null 2>&1; cd $(REMOTE_DIR) && yarn test:unit"

format:
	docker exec $(NODE_CONTAINER) sh -c "corepack enable >/dev/null 2>&1; cd $(REMOTE_DIR) && yarn run format"
