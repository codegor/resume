import { fileURLToPath, URL } from 'node:url'
import { readFileSync, cpSync, readdirSync } from 'node:fs'
import { resolve, extname, join } from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { compression } from 'vite-plugin-compression2'
import { buildFromTree, writeAssembled } from './scripts/assemble-resume.mjs'

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url))

// Fallback media host for the single-file build (videos + cert screenshots stream
// from here when VITE_MEDIA_BASE_URL is unset). Overridable via VITE_DEFAULT_MEDIA_BASE_URL.
const DEFAULT_MEDIA_BASE_URL = 'https://codegor.github.io/resume'

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
}

/**
 * Single-file build helper. Reads the two JSON data files and:
 *   • for any png/jpg with an .avif sibling (certs, hero photo, video poster, provider
 *     logos), inlines ONLY the small AVIF variant (sibling `<key>Avif` field) and streams
 *     the heavier webp/jpg from `${mediaBase}`; images with no avif sibling (eras PNGs)
 *     and the placeholder svg stay fully base64-inlined;
 *   • streams each full video `src` from `${mediaBase}` (too big to inline → offline they
 *     fall back to the poster still) but base64-inlines the small `previewSrc` so the
 *     inline preview circle plays offline.
 * Both JSON blobs are injected as inline `<script type="application/json">` tags that the
 * app's loader prefers over fetch().
 */
function inlineDataPlugin(mediaBase: string): Plugin {
  const publicAssets = here('./public/assets')

  const toDataUri = (rel: string): string => {
    // rel looks like "assets/foto.jpg" — strip the leading "assets/" then read from public/assets
    const clean = rel.replace(/^\.?\//, '').replace(/^assets\//, '')
    try {
      const buf = readFileSync(resolve(publicAssets, clean))
      const mime = MIME[extname(clean).toLowerCase()] || 'application/octet-stream'
      return `data:${mime};base64,${buf.toString('base64')}`
    } catch {
      // Don't fail the build, but don't hide it either: a missing asset here means a
      // broken <img>/<video> src in the offline single-file output. Warn loudly.
      console.warn(
        `[inlineDataPlugin] missing media, left un-inlined: ${rel} (looked in public/assets/${clean})`,
      )
      return rel
    }
  }

  const isLocalImage = (v: unknown): v is string =>
    typeof v === 'string' && /^assets\/.+\.(png|jpe?g|webp|gif|svg)$/i.test(v)

  // For any png/jpg that has an .avif sibling, inline ONLY the small AVIF variant as
  // base64 (so the image shows offline) and stream the heavier webp/jpg from `${base}`.
  // SmartImg serves the inlined AVIF first; a browser that can't decode AVIF falls back
  // to the streamed webp/jpg, and offline-with-no-AVIF → the component's own error flow
  // (cert placeholder, hero monogram, video poster…). The AVIF data URI is stashed on a
  // sibling `<key>Avif` field (certImg→certImgAvif, photo→photoAvif, logo→logoAvif,
  // poster→posterAvif) that the component reads. Images with NO avif sibling (eras PNGs)
  // and non-png/jpg (the placeholder svg) stay fully base64-inlined.
  const isPngJpg = (v: unknown): v is string =>
    typeof v === 'string' && /^assets\/.+\.(png|jpe?g)$/i.test(v)
  const base = mediaBase.replace(/\/$/, '')

  const inlineImagesDeep = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(inlineImagesDeep)
    } else if (node && typeof node === 'object') {
      const obj = node as Record<string, unknown>
      for (const k of Object.keys(obj)) {
        const val = obj[k]
        const avifUri =
          isPngJpg(val) && base ? toDataUri(val.replace(/\.(png|jpe?g)$/i, '.avif')) : ''
        if (avifUri.startsWith('data:')) {
          obj[`${k}Avif`] = avifUri
          obj[k] = `${base}/${val.replace(/^\.?\//, '')}` // webp/jpg stream from the root
        } else if (isLocalImage(val)) obj[k] = toDataUri(val)
        else inlineImagesDeep(val)
      }
    }
  }

  // Era-cloud PNGs are referenced by `ghostYear` only (Epoch.vue builds the path
  // assets/eras/<year>.png at runtime), so they never appear as an image path *value*
  // for inlineImagesDeep to catch. Inline them here onto each epoch's `cloud` field —
  // Epoch.vue prefers `ecfg.cloud` when present so the offline file shows them without
  // a network fetch (they're ~20 KB each). The multifile build skips this plugin → no
  // `cloud` field → Epoch falls back to loading assets/eras/<year>.png.
  const inlineEraClouds = (cfg: Record<string, unknown>): void => {
    const epochs = cfg.epochs as Record<string, { ghostYear?: string; cloud?: string }> | undefined
    if (!epochs) return
    for (const ep of Object.values(epochs)) {
      if (ep && ep.ghostYear) {
        const uri = toDataUri('assets/eras/' + ep.ghostYear + '.png')
        if (uri.startsWith('data:')) ep.cloud = uri
      }
    }
  }

  const rewriteVideos = (cfg: Record<string, unknown>, res: Record<string, unknown>): void => {
    if (!mediaBase) return
    const base = mediaBase.replace(/\/$/, '')
    const isVideo = (val: unknown): val is string =>
      typeof val === 'string' && /^assets\/.+\.(mp4|webm|mov)$/i.test(val)
    type Vid = { src?: string; previewSrc?: string }
    const one = (v: Vid | undefined | null): void => {
      if (!v) return
      // The full clip is too big to inline → stream it from the prod/local root (offline
      // it fails to load → VideoModal falls back to the poster still). The lightweight
      // preview clip IS base64-inlined so the inline circle plays even offline.
      if (isVideo(v.src)) v.src = `${base}/${v.src.replace(/^\.?\//, '')}`
      if (isVideo(v.previewSrc)) v.previewSrc = toDataUri(v.previewSrc)
    }
    const videos = cfg.videos as Record<string, Vid> | undefined
    if (videos) for (const v of Object.values(videos)) one(v)
    // Per-project intro videos now live in resume.json: work_experience[].projects[].video
    const we = res.work_experience as Array<{ projects?: Array<{ video?: Vid }> }> | undefined
    if (Array.isArray(we)) we.forEach((exp) => (exp.projects || []).forEach((p) => one(p.video)))
  }

  const safeJson = (o: unknown) => JSON.stringify(o).replace(/</g, '\\u003c')

  return {
    name: 'inline-data-single',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        // The full data is assembled from the source tree in memory — public/assets/config.json
        // is the BASE config and the full resume.json/config.json only ever exist in dist/.
        const { resume: res, config: cfg } = buildFromTree(publicAssets)
        inlineImagesDeep(cfg)
        inlineImagesDeep(res)
        inlineEraClouds(cfg)
        rewriteVideos(cfg, res)
        return {
          html,
          tags: [
            {
              tag: 'script',
              attrs: { type: 'application/json', id: '__inline_config' },
              children: safeJson(cfg),
              injectTo: 'head',
            },
            {
              tag: 'script',
              attrs: { type: 'application/json', id: '__inline_resume' },
              children: safeJson(res),
              injectTo: 'head',
            },
          ],
        }
      },
    },
  }
}

/**
 * Multi-file build only. `public/` is the Vite *root* (it holds index.html), so it can't
 * also be the `publicDir` — Vite forbids root === publicDir. So we copy the static
 * data/media from `public/assets` → `dist/assets` ourselves once the bundle is written.
 * (The single-file build base64-inlines these instead, so it skips this plugin.)
 */
function copyAssetsPlugin(): Plugin {
  return {
    name: 'copy-public-assets',
    apply: 'build',
    closeBundle() {
      // Copy public/assets → dist/assets, EXCLUDING the source (the resume/ tree + the BASE
      // public/assets/config.json) — then write the FULL assembled resume.json + config.json
      // into dist/assets. So the new format lives only in public/, the old format only in dist/.
      const srcRoot = here('./public/assets')
      cpSync(srcRoot, here('./dist/assets'), {
        recursive: true,
        filter: (src) => {
          const rel = src.slice(srcRoot.length).replace(/\\/g, '/')
          return !(rel === '/resume' || rel.startsWith('/resume/') || rel === '/config.json')
        },
      })
      writeAssembled(here('./dist/assets'), srcRoot)
      // robots.txt lives at the dist root (not under assets/), so copy it separately.
      cpSync(here('./public/robots.txt'), here('./dist/robots.txt'))
    },
  }
}

/**
 * Step-2: the résumé content is authored as a source TREE (public/assets/resume/ +
 * public/assets/config.json = the BASE config). The app loads the FULL resume.json + config.json
 * which exist ONLY in dist/ — written by copyAssetsPlugin (multifile) / inlined by inlineDataPlugin
 * (single) / served from memory in dev (below). This plugin just (a) registers the source files
 * as watch inputs so `vite build --watch` rebuilds on a content edit, and (b) serves the assembled
 * full data in `vite dev`. buildFromTree() takes the assets dir explicitly because Vite bundles
 * this config, making import.meta.url inside the imported helper unreliable.
 */
function assembleSourcePlugin(): Plugin {
  const assetsDir = here('./public/assets')
  const treeDir = here('./public/assets/resume')
  const baseFile = here('./public/assets/config.json')
  return {
    name: 'assemble-resume-source',
    buildStart() {
      // `vite build --watch`: rebuild when any source file changes (copyAssets / inlineData
      // regenerate the full JSONs themselves — nothing is written into public/).
      const watchAll = (p: string): void => {
        for (const e of readdirSync(p, { withFileTypes: true })) {
          const full = join(p, e.name)
          if (e.isDirectory()) watchAll(full)
          else this.addWatchFile(full)
        }
      }
      try {
        watchAll(treeDir)
        this.addWatchFile(baseFile)
      } catch {
        /* tree missing → nothing to watch */
      }
    },
    // Dev server: public/ has only the source, so serve the FULL assembled data from memory.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0]
        if (url === '/assets/resume.json' || url === '/assets/config.json') {
          const built = buildFromTree(assetsDir)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(url.endsWith('resume.json') ? built.resume : built.config))
          return
        }
        next()
      })
      server.watcher.add([treeDir, baseFile])
      server.watcher.on('all', (_event, file) => {
        const f = String(file).replace(/\\/g, '/')
        if (f.includes('/public/assets/resume/') || f.endsWith('/public/assets/config.json')) {
          server.ws.send({ type: 'full-reload' })
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const isSingle = mode === 'single'
  const env = loadEnv(mode, here('.'), '')
  // Offline single file defaults to the GitHub Pages host so its videos stream from
  // <defaultBase>/assets/video/*. VITE_DEFAULT_MEDIA_BASE_URL overrides that default;
  // VITE_MEDIA_BASE_URL (set per-build) still wins over both.
  const defaultBase = env.VITE_DEFAULT_MEDIA_BASE_URL || DEFAULT_MEDIA_BASE_URL
  const mediaBase = env.VITE_MEDIA_BASE_URL || (isSingle ? defaultBase : '')

  return {
    base: './',
    appType: 'mpa',
    // public/ is the Vite root: its index.html is the entry → emits as dist/index.html, and
    // bare imports (`vue`…) resolve from the repo-root node_modules (public/'s parent). The
    // TS/Vue source lives in src/ui (index.html points at ../src/ui/main.ts; the `@` alias maps
    // there too).
    root: here('./public'),
    // public/ is the root, so it can't also be publicDir (Vite forbids root === publicDir);
    // the multi build copies public/assets → dist/assets via copyAssetsPlugin() instead.
    // (In dev, public/assets sit under the root, so they're served at /assets/* directly.)
    publicDir: false,
    // .env lives at the repo root, and index.html imports src/ui/* (outside the public/ root).
    envDir: here('.'),
    server: { fs: { allow: [here('.')] } },
    resolve: {
      alias: { '@': here('./src/ui') },
    },
    plugins: [
      assembleSourcePlugin(),
      vue(),
      ...(isSingle ? [inlineDataPlugin(mediaBase), viteSingleFile()] : []),
      ...(isSingle
        ? []
        : [
            copyAssetsPlugin(),
            compression({
              algorithms: ['gzip', 'brotliCompress'],
              include: /\.(js|css|html|svg|json)$/,
            }),
          ]),
    ],
    build: {
      outDir: isSingle ? here('./dist/.single') : here('./dist'),
      emptyOutDir: true,
      target: 'es2020',
      minify: 'terser',
      cssMinify: true,
      terserOptions: { compress: { drop_console: true, drop_debugger: true } },
      rollupOptions: {
        // Entry is auto-detected as <root>/index.html = public/index.html → dist/index.html.
        output: {
          entryFileNames: 'assets/js/[name]-[hash].js',
          chunkFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (info) => {
            const name = info.names?.[0] ?? ''
            if (name.endsWith('.css')) return 'assets/css/[name]-[hash][extname]'
            if (/\.(woff2?|ttf|eot)$/i.test(name)) return 'assets/fonts/[name]-[hash][extname]'
            return 'assets/[name]-[hash][extname]'
          },
          manualChunks: isSingle
            ? undefined
            : (id) => (id.includes('node_modules') ? 'vendor' : undefined),
        },
      },
    },
  }
})
