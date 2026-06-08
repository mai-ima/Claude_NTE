// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import pagefind from 'astro-pagefind';

// --- Deploy configuration ---------------------------------------------------
// Primary target: GitHub Pages (project site -> served under /claude_nte).
// `SITE_URL` / `SITE_BASE` can be overridden by the environment so the same
// build also works elsewhere (e.g. Vercel with SITE_BASE="/").
const SITE_URL = process.env.SITE_URL ?? 'https://mai-ima.github.io';
const SITE_BASE = process.env.SITE_BASE ?? '/claude_nte';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  base: SITE_BASE,
  trailingSlash: 'always',
  output: 'static',
  build: { format: 'directory' },
  // 注: Markdown/MDX 内部リンクは「相対リンク」で記述しているため base 付与の
  // 変換プラグインは不要（Astro のバージョン更新にも壊れにくい）。
  integrations: [preact({ compat: true }), mdx(), icon(), pagefind(), sitemap()],
});
