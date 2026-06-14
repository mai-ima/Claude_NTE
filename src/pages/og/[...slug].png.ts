/**
 * 記事ごとの動的OG画像（1200×630 PNG）をビルド時に生成する静的エンドポイント。
 * satori(JSX風オブジェクト→SVG) → @resvg/resvg-js(SVG→PNG)。
 * URL 例: /og/characters/lacrimosa.png
 * 日本語フォントは src/assets/fonts の Noto Sans JP（JPサブセットOTF）を同梱。
 */
import type { APIRoute } from 'astro';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { SECTIONS, elementMeta } from '../../lib/nav';
import { publishedEntries, titleOf } from '../../lib/content';

// ビルド時の cwd はプロジェクトルート。バンドル後も壊れないよう cwd 基準で読む。
const fontData = readFileSync(join(process.cwd(), 'src/assets/fonts/NotoSansJP-Regular.otf'));

const SITE = 'NTE 完全攻略wiki';
const DEFAULT_ACCENT = '#6c8cff';

interface OgProps {
  title: string;
  section: string;
  accent: string;
}

export async function getStaticPaths() {
  const paths: { params: { slug: string }; props: OgProps }[] = [];
  for (const s of SECTIONS) {
    const entries = await publishedEntries(s.collection);
    for (const e of entries) {
      const d = e.data as Record<string, unknown>;
      const accent = d.element ? elementMeta(d.element as string).hue : DEFAULT_ACCENT;
      paths.push({
        params: { slug: `${s.collection}/${e.id}` },
        props: { title: titleOf(e), section: s.label, accent },
      });
    }
  }
  return paths;
}

/** satori 用の素朴な要素ビルダー（JSXを使わない） */
function el(type: string, style: Record<string, unknown>, children?: unknown) {
  return { type, props: { style, ...(children !== undefined ? { children } : {}) } };
}

export const GET: APIRoute = async ({ props }) => {
  const { title, section, accent } = props as OgProps;

  const tree = el(
    'div',
    {
      width: '1200px',
      height: '630px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '72px',
      background: 'linear-gradient(135deg, #0f1115 0%, #171a21 100%)',
      color: '#e6e8ec',
      fontFamily: 'Noto Sans JP',
    },
    [
      // 上段: サイト名＋アクセントの点
      el(
        'div',
        { display: 'flex', alignItems: 'center', fontSize: '30px', color: '#9aa3b2' },
        [
          el('div', {
            width: '22px',
            height: '22px',
            borderRadius: '999px',
            background: accent,
            marginRight: '16px',
          }),
          el('div', { display: 'flex' }, SITE),
        ],
      ),
      // 中段: タイトル
      el(
        'div',
        {
          display: 'flex',
          fontSize: title.length > 22 ? '64px' : '78px',
          fontWeight: 700,
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
        },
        title,
      ),
      // 下段: セクションのピル
      el(
        'div',
        { display: 'flex' },
        el(
          'div',
          {
            display: 'flex',
            alignItems: 'center',
            padding: '12px 26px',
            borderRadius: '999px',
            fontSize: '30px',
            color: '#0f1115',
            background: accent,
          },
          section,
        ),
      ),
    ],
  );

  const svg = await satori(tree as never, {
    width: 1200,
    height: 630,
    fonts: [{ name: 'Noto Sans JP', data: fontData, weight: 400, style: 'normal' }],
  });

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();

  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};
