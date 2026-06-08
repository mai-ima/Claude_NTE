// タッチアイコン（ホーム画面ブックマーク用）を生成するスクリプト。
// オリジナルの「NTE」モノグラム。使い方: node scripts/gen-icons.mjs
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'icons');

const ACCENT = '#3b6ef0';

function squareSvg(size) {
  const r = Math.round(size * 0.22);
  const fs = Math.round(size * 0.32);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${r}" fill="${ACCENT}"/>
    <text x="50%" y="52%" text-anchor="middle" dominant-baseline="central"
      font-family="'Hiragino Sans','Noto Sans JP',system-ui,sans-serif"
      font-size="${fs}" font-weight="800" letter-spacing="1" fill="#ffffff">NTE</text>
  </svg>`;
}

async function render(svg, file) {
  await sharp(Buffer.from(svg)).png().toFile(join(outDir, file));
  console.log('generated', file);
}

await mkdir(outDir, { recursive: true });
await render(squareSvg(192), 'icon-192.png');
console.log('done');
