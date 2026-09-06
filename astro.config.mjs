// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import pagefind from 'astro-pagefind';
import { unified } from '@astrojs/markdown-remark';
import remarkCjkFriendly from 'remark-cjk-friendly';
import rehypeTermLinks from './src/lib/rehype-term-links.mjs';

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
  // 廃統合した旧ツールの URL を統合先へリダイレクト（旧リンク/ブックマーク救済）。
  redirects: {
    '/tools/gacha-odds/': '/tools/gacha-dashboard/',
    '/tools/gacha-budget/': '/tools/gacha-dashboard/',
    // 実態（レクイエム弧盤PU）と食い違っていた旧スラッグを救済。
    '/events/road-of-no-return/': '/events/lacrimosa-arc-pickup/',
  },
  // Markdown の処理系。Astro 6 では markdown.remark/rehypePlugins が非推奨のため、
  // unified() のプロセッサへ直接渡す。
  //  - remarkCjkFriendly: CommonMark は「**強調**です」のように閉じ記号の前が
  //    全角の括弧・句読点だと強調として認識しない。日本語の本文では頻出するため、
  //    CJK に配慮した判定へ拡張する（英語などの挙動は変わらない）。
  //  - rehypeTermLinks: 本文中の用語をその用語ページへ自動リンク（Wikipedia風）。
  markdown: {
    processor: unified({
      remarkPlugins: [remarkCjkFriendly],
      rehypePlugins: [rehypeTermLinks],
    }),
  },
  // 注: Markdown/MDX 内部リンクは「相対リンク」で記述しているため base 付与の
  // 変換プラグインは不要（Astro のバージョン更新にも壊れにくい）。
  integrations: [preact({ compat: true }), mdx(), icon(), pagefind(), sitemap()],
});
