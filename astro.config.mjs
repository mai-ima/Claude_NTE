// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import pagefind from 'astro-pagefind';
import AstroPWA from '@vite-pwa/astro';

// --- Deploy configuration ---------------------------------------------------
// Primary target: GitHub Pages (project site -> served under /claude_nte).
// `SITE_URL` / `SITE_BASE` can be overridden by the environment so the same
// build also works on Vercel (set SITE_BASE="/" there) without code changes.
const SITE_URL = process.env.SITE_URL ?? 'https://mai-ima.github.io';
const SITE_BASE = process.env.SITE_BASE ?? '/claude_nte';

// Markdown/MDX 本文内のルート絶対リンク（"/wiki/..." 等）に base を付与する
// rehype プラグイン。これがないと base 配下デプロイ時に内部リンクが 404 になる。
function rehypeBasePath() {
  const prefix = SITE_BASE === '/' ? '' : SITE_BASE.replace(/\/$/, '');
  const fix = (val) => {
    if (
      typeof val === 'string' &&
      val.startsWith('/') &&
      !val.startsWith('//') &&
      (prefix === '' || !val.startsWith(prefix + '/'))
    ) {
      return prefix + val;
    }
    return val;
  };
  const walk = (node) => {
    if (node.type === 'element' && node.properties) {
      if (node.tagName === 'a') node.properties.href = fix(node.properties.href);
      if (node.tagName === 'img') node.properties.src = fix(node.properties.src);
    }
    if (node.children) node.children.forEach(walk);
  };
  return (tree) => walk(tree);
}

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  base: SITE_BASE,
  trailingSlash: 'always',
  output: 'static',
  build: { format: 'directory' },
  markdown: {
    // Markdown/MDX 本文のルート絶対リンクに base を付与（MDXもこの設定を継承）
    rehypePlugins: [rehypeBasePath],
  },
  integrations: [
    preact({ compat: true }),
    mdx(),
    icon(),
    pagefind(),
    sitemap(),
    AstroPWA({
      registerType: 'autoUpdate',
      // 登録スクリプトと manifest link は BaseLayout で明示的に挿入する
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'NTE 完全攻略wiki',
        short_name: 'NTE wiki',
        description: 'NTE（ゲーム）に関する攻略・情報をまとめた自分専用wiki + ツール',
        lang: 'ja',
        dir: 'ltr',
        start_url: SITE_BASE,
        scope: SITE_BASE,
        display: 'standalone',
        background_color: '#fafafa',
        theme_color: '#3b6ef0',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: SITE_BASE,
        globPatterns: ['**/*.{html,js,css,svg,png,webp,woff2,json}'],
        runtimeCaching: [
          {
            // Pagefind search index is generated after the SW build step,
            // so cache it at runtime to keep search available offline.
            urlPattern: ({ url }) => url.pathname.includes('/pagefind/'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'pagefind-index' },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
});
