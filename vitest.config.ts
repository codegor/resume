import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

// Standalone config for the unit tests (it is NOT the app's vite.config — that one sets
// root: public/ and the build plugins, which we don't want here). Unit tests live in
// src/tests/unit/*.test.ts; the Playwright E2E specs (*.spec.ts) are a separate suite.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src/ui', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/tests/unit/**/*.test.ts'],
  },
})
