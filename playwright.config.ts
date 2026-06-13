import { defineConfig, devices } from '@playwright/test'

// Test the SERVED build. Default: the dev_env nginx at resume.local.
// Override with PLAYWRIGHT_BASE_URL (e.g. http://web in the docker run, or a preview).
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://resume.local'

export default defineConfig({
  testDir: './src/tests',
  testIgnore: '**/unit/**', // *.test.ts under unit/ are vitest (yarn test:unit), not Playwright
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  // Three viewports, all chromium-only (iPad/iPhone device presets would pull in webkit):
  //  • desktop  > 1180px → centered .wrap, full top bar
  //  • ipad     821–1180 → tablet layout (@media min-821 max-1180), still the desktop top bar
  //  • iphone   ≤ 820px  → mobile masthead + (i) menu (@media ≤820)
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'ipad',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 768 }, hasTouch: true },
    },
    // Pixel 5 (chromium, 393×851) stands in for the iPhone view (iPhone 12 would pull in webkit).
    { name: 'iphone', use: { ...devices['Pixel 5'] } },
  ],
})
