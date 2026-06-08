// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import pagefind from 'astro-pagefind';

// --- Deploy configuration ---------------------------------------------------
// Deploy target: Vercel (static). Astro is auto-detected; `dist/` is served
// from the domain root, so the base path must be "/". No adapter is required
// for a static build — adding one would only complicate the output.
const SITE_URL = 'https://claude-nte.vercel.app';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  base: '/',
  trailingSlash: 'always',
  output: 'static',
  build: { format: 'directory' },
  // 注: Markdown/MDX 内部リンクは「相対リンク」で記述しているため base 付与の
  // 変換プラグインは不要（Astro のバージョン更新にも壊れにくい）。
  integrations: [preact({ compat: true }), mdx(), icon(), pagefind(), sitemap()],
});
