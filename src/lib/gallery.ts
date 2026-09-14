/**
 * 同梱している画像を**分類ごとに数え上げる**（管理ページのギャラリー用）。
 *
 * ★ なぜ要るか（利用者の指示 2026-09-14）
 *   > 管理者機能内にギャラリーを追加。ギャラリーでは公式サイトやwikiから取得した画像、
 *   > キャラ画像、アイコン、UIパーツなど細かく分類して表示
 *
 *   同梱した絵は1500枚を超えていて、**どこに何があるか一覧で見る場所が無かった**。
 *   出どころ（公式サイト／公式wiki／攻略wiki）と用途（立ち絵／顔／アイコン／UIのパーツ）で
 *   分けて並べ、1枚ずつ見て確かめられるようにする。
 *
 * ★ ビルドのときだけ動く
 *   `public/` を直接読む。ブラウザからは呼べない（`node:fs` を使う）。
 *   寸法は**ファイルの先頭64バイトだけ**読んで取る（`img-size.mjs`）ので、
 *   1500枚あっても目に見えるほど遅くはならない。
 *
 * ★ 出どころの引き方
 *   公式wiki由来は `scripts/data/endfield-wiki/images-ledger.json` に1枚ずつの URL がある。
 *   それ以外はグループ単位の説明で足りる（`docs/IMAGE-SOURCES.md` に1枚ずつ書いてある）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { measure } from './img-size.mjs';

/* ★ `import.meta.dirname` は使わない（Vite がまとめると undefined になる）。
   Astro のビルドはいつもリポジトリの直下で走るので、そこを起点にする。 */
const ROOT = path.resolve(process.cwd());
const PUBLIC_IMAGES = path.join(ROOT, 'public/images');

export interface GalleryItem {
  /** `/images/…` から始まる、そのまま `<img src>` に書ける道 */
  src: string;
  /** 拡張子を外したファイル名 */
  name: string;
  /** 元の名前（公式wikiの台帳にあるもの）。無ければ空 */
  title: string;
  /** 取ってきた URL。無ければ空 */
  from: string;
  w: number;
  h: number;
  /** キロバイト */
  kb: number;
}

export interface GalleryGroup {
  id: string;
  /** 画面に出す名前 */
  label: string;
  /** どこから取ってきたか */
  source: string;
  /** 何に使っているか */
  use: string;
  items: GalleryItem[];
}

/** 並べる順と、まとめ方。**上から順に画面へ出る** */
const GROUPS: { id: string; dir: string; label: string; source: string; use: string }[] = [
  {
    id: 'nte-chars',
    dir: 'official/nte/characters',
    label: 'NTE — キャラクターの立ち絵',
    source: 'NTE 公式サイト（日本語版）',
    use: '記事の上に出す大きな絵',
  },
  {
    id: 'nte-faces',
    dir: 'official/nte/faces',
    label: 'NTE — 顔のアイコン',
    source: 'NTE 公式サイト（キャラページのタブから切り出し）',
    use: '一覧の小さな丸（64px 以下）',
  },
  {
    id: 'ef-illust',
    dir: 'official/endfield/illust',
    label: 'エンドフィールド — 全身の立ち絵',
    source: 'エンドフィールド公式サイト（日本語版）',
    use: 'オペレーター記事の上に出す大きな絵',
  },
  {
    id: 'ef-operators',
    dir: 'official/endfield/operators',
    label: 'エンドフィールド — オペレーターの顔',
    source: 'エンドフィールド公式wiki（SKPORT）',
    use: '一覧のサムネ',
  },
  {
    id: 'ef-classes',
    dir: 'official/endfield/classes',
    label: 'エンドフィールド — 職業のアイコン',
    source: 'エンドフィールド公式サイト',
    use: 'サムネの左上・記事の要点',
  },
  {
    id: 'ef-elements',
    dir: 'official/endfield/elements',
    label: 'エンドフィールド — 属性のアイコン',
    source: 'エンドフィールド公式サイト',
    use: 'サムネの左上・記事の要点',
  },
  {
    id: 'ef-weapons',
    dir: 'official/endfield/weapons',
    label: 'エンドフィールド — 武器のアイコン',
    source: 'エンドフィールド公式wiki（SKPORT）',
    use: '一覧のサムネ・記事の絵',
  },
  {
    id: 'ef-gear',
    dir: 'official/endfield/gear',
    label: 'エンドフィールド — 装備のアイコン',
    source: 'エンドフィールド公式wiki（SKPORT）',
    use: '一覧のサムネ・記事の絵',
  },
  {
    id: 'ef-items',
    dir: 'official/endfield/items',
    label: 'エンドフィールド — アイテムのアイコン',
    source: 'エンドフィールド公式wiki（SKPORT）',
    use: '一覧のサムネ・記事の絵',
  },
  {
    id: 'ef-industry',
    dir: 'official/endfield/industry',
    label: 'エンドフィールド — 設備・図面のアイコン',
    source: 'エンドフィールド公式wiki（SKPORT）',
    use: '一覧のサムネ・記事の絵',
  },
  {
    id: 'ef-enemies',
    dir: 'official/endfield/enemies',
    label: 'エンドフィールド — 脅威のアイコン',
    source: 'エンドフィールド公式wiki（SKPORT）',
    use: '一覧のサムネ・記事の絵',
  },
  {
    id: 'ef-skills',
    dir: 'official/endfield/wiki/skills',
    label: 'エンドフィールド — 技を出している様子',
    source: 'エンドフィールド公式wiki（SKPORT）の動く絵から1コマ',
    use: 'オペレーター記事のスキル説明の下',
  },
  {
    id: 'ef-ui',
    dir: 'official/endfield/ui',
    label: 'エンドフィールド — 画面から取った UI',
    source: 'エンドフィールド公式サイト',
    use: '見た目を写すための下敷き（ページには出していない）',
  },
  {
    id: 'ef-ui-parts',
    dir: 'official/endfield/ui-parts',
    label: 'エンドフィールド — UI のパーツ',
    source: '公式サイト・公式wikiを開いたときに読まれた画像',
    use: '見た目を写すための下敷き（ページには出していない）',
  },
  {
    id: 'nte-ui-parts',
    dir: 'official/nte/ui-parts',
    label: 'NTE — UI のパーツ',
    source: 'NTE 公式サイトを開いたときに読まれた画像',
    use: '見た目を写すための下敷き（ページには出していない）',
  },
  {
    id: 'nte-logo',
    dir: 'official/nte/logo',
    label: 'NTE — ロゴ',
    source: 'NTE 公式サイト',
    use: '未使用',
  },
  {
    id: 'ef-logo',
    dir: 'official/endfield/logo',
    label: 'エンドフィールド — ロゴ',
    source: 'エンドフィールド公式サイト',
    use: '未使用',
  },
];

const PIC = /\.(webp|avif|png|jpe?g|gif|svg)$/i;

/** 公式wikiの台帳（`置き場所 → 元の名前と URL`）。無ければ空 */
function loadLedger(): Map<string, { title: string; from: string }> {
  const map = new Map<string, { title: string; from: string }>();
  const file = path.join(ROOT, 'scripts/data/endfield-wiki/images-ledger.json');
  if (!fs.existsSync(file)) return map;
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as unknown;
    const items = Array.isArray(raw)
      ? raw
      : ((raw as Record<string, unknown>).items as unknown[]) ?? [];
    for (const it of items as Record<string, string>[]) {
      if (!it.file) continue;
      map.set(`/images/${it.file}`, { title: it.name ?? '', from: it.from ?? '' });
    }
  } catch {
    /* 壊れていても画面は出す（出どころが空になるだけ） */
  }
  return map;
}

/** 1つのフォルダを読む。並びは名前順 */
function readDir(dir: string, ledger: ReturnType<typeof loadLedger>): GalleryItem[] {
  const abs = path.join(PUBLIC_IMAGES, dir);
  if (!fs.existsSync(abs)) return [];
  const out: GalleryItem[] = [];
  for (const f of fs.readdirSync(abs).sort()) {
    if (!PIC.test(f)) continue;
    const full = path.join(abs, f);
    const st = fs.statSync(full);
    if (!st.isFile()) continue;
    const src = `/images/${dir}/${f}`;
    const size = f.toLowerCase().endsWith('.svg') ? null : measure(full);
    const meta = ledger.get(src);
    out.push({
      src,
      name: f.replace(/\.[a-z0-9]+$/i, ''),
      title: meta?.title ?? '',
      from: meta?.from ?? '',
      w: size?.w ?? 0,
      h: size?.h ?? 0,
      kb: Math.round(st.size / 1024),
    });
  }
  return out;
}

/** 分類ごとの一覧を作る。空の分類は落とす */
export function buildGallery(): GalleryGroup[] {
  const ledger = loadLedger();
  const groups: GalleryGroup[] = [];
  for (const g of GROUPS) {
    const items = readDir(g.dir, ledger);
    if (items.length === 0) continue;
    groups.push({ id: g.id, label: g.label, source: g.source, use: g.use, items });
  }
  /* 上の一覧に載せていないフォルダも拾う（入れ忘れで見えなくなるのを防ぐ）。
     `public/images/` の直下2階層までを見て、既出でないものを「その他」に入れる。 */
  const known = new Set(GROUPS.map((g) => g.dir));
  const walk = (rel: string, depth: number) => {
    const abs = path.join(PUBLIC_IMAGES, rel);
    if (!fs.existsSync(abs)) return;
    for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const sub = rel ? `${rel}/${e.name}` : e.name;
      if (known.has(sub)) continue;
      const items = readDir(sub, ledger);
      if (items.length > 0) {
        groups.push({
          id: `other-${sub.replace(/[^a-z0-9]+/gi, '-')}`,
          label: `そのほか — ${sub}`,
          source: '（分類に入れていないもの。→ docs/IMAGE-SOURCES.md）',
          use: '—',
          items,
        });
        known.add(sub);
      }
      if (depth < 3) walk(sub, depth + 1);
    }
  };
  walk('', 1);
  return groups;
}

/** 合計の枚数と容量（見出しに出す） */
export function gallerySummary(groups: GalleryGroup[]): { count: number; mb: string } {
  let count = 0;
  let kb = 0;
  for (const g of groups) {
    count += g.items.length;
    for (const i of g.items) kb += i.kb;
  }
  return { count, mb: (kb / 1024).toFixed(1) };
}
