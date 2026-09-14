/**
 * エンドフィールド公式wiki（SKPORT）の画像を、まとめて取って同梱の形に直す。
 *
 *   node scripts/fetch-endfield-wiki-images.mjs           # アイコン（全1116件）
 *   node scripts/fetch-endfield-wiki-images.mjs --skills  # スキルのアイコンも
 *   node scripts/fetch-endfield-wiki-images.mjs --all     # 全部
 *
 * ★ そのままでは同梱できない
 *   公式の元画像は **PNG で1枚400KB前後**、スキルのアニメーション GIF は
 *   **1枚8MB** ある。1629枚あるので、素で落とすと数百MBになる。
 *   落としながら **WebP へ小さくして、元は捨てる**。
 *
 * ★ 保存先（記事から自動で引けるように、**記事の slug で保存する**）
 *   public/images/official/endfield/<分類>/<slug>.webp   … 一覧と記事のアイコン
 *   public/images/official/endfield/wiki/skills/*.webp   … スキルのアイコン
 *
 *   `src/components/Avatar.astro` は `official/endfield/<dir>/<id>` を探すので、
 *   ここに置くだけで表示に出る。
 *
 * ★ 権利
 *   画像の権利は運営元（Gryphline / Hypergryph）にある。
 *   利用者の判断で同梱している（→ .claude/state/DECISIONS.md 2026-09-13）。
 *   1枚ずつの出どころは docs/IMAGE-SOURCES.md に残す。
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ROOT, DATA, readData, buildSlugMap, slugByTitle } from './lib/efgen.mjs';

const args = process.argv.slice(2);
const wantSkills = args.includes('--skills') || args.includes('--all');
const wantIcons = !args.includes('--skills') || args.includes('--all');

const OUT = path.join(ROOT, 'public/images/official/endfield');
const index = readData('index');
const all = fs.existsSync(path.join(DATA, 'all.json')) ? readData('all') : { items: [] };

/** 公式の分類 → こちらのコレクション（記事の置き場） */
const SUB_TO_DIR = {
  1: 'operators',
  2: 'weapons',
  3: 'enemies',
  4: 'gear',
  5: 'industry',
  6: 'items',
  15: 'items',
  16: 'items',
  17: 'industry',
};
/** 分類 → 記事のディレクトリ（既にある記事の slug を使い続けるため） */
const CONTENT_DIR = {
  operators: 'endfield-operators',
  weapons: 'endfield-weapons',
  enemies: 'endfield-enemies',
  gear: 'endfield-gear',
  items: 'endfield-items',
  industry: 'endfield-industry',
};

/** 分類ごとに「itemId → slug」を決める（記事の生成と同じ規則。efgen.mjs に寄せてある） */
const slugOf = {};
for (const [dir, content] of Object.entries(CONTENT_DIR)) {
  const known = slugByTitle(path.join(ROOT, 'src/content', content));
  const entries = Object.entries(index.items).filter(([, m]) => SUB_TO_DIR[m.subId] === dir);
  Object.assign(slugOf, buildSlugMap(entries, known));
}
/* 「管理人（女）」は記事を分けていない（1本に男女をまとめた）。
   絵だけ2枚目として置きたいので、男性版の slug に `-2` を付けた名前にする。
   記事側は `<slug>-2` も探す（src/pages/endfield/operators/[slug].astro）。 */
for (const [itemId, meta] of Object.entries(index.items)) {
  if (!/（女）$/.test(meta.name ?? '')) continue;
  const base = Object.entries(index.items).find(
    ([, m]) => m.subId === meta.subId && m.name === meta.name.replace('（女）', '（男）'),
  );
  if (base) slugOf[itemId] = `${slugOf[base[0]]}-2`;
}

/** 1枚落として WebP にする。成功したら byte 数を返す */
async function grab(url, dest, { size = 128, fit = 'cover' } = {}) {
  if (fs.existsSync(dest)) return 0; // すでにある
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  /* GIF は1枚目だけ。アニメーションのまま持つと重すぎる */
  const img = sharp(buf, { animated: false })
    .resize(size, size, { fit, withoutEnlargement: true })
    .webp({ quality: 82 });
  const out = await img.toBuffer();
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, out);
  return out.length;
}

/** まとめて落とす（同時に走らせる本数を絞る） */
async function run(jobs, label, parallel = 12) {
  let ok = 0;
  let skip = 0;
  let bytes = 0;
  const fails = [];
  let i = 0;
  async function worker() {
    while (i < jobs.length) {
      const job = jobs[i];
      i += 1;
      try {
        const n = await job.fn();
        if (n === 0) skip += 1;
        else { ok += 1; bytes += n; }
      } catch (e) {
        fails.push(`${job.name}: ${e.message.slice(0, 80)}`);
      }
      const done = ok + skip + fails.length;
      if (done % 100 === 0) console.log(`  ${label}: ${done}/${jobs.length}`);
    }
  }
  await Promise.all(Array.from({ length: parallel }, worker));
  console.log(`${label}: 新規 ${ok} / 既存 ${skip} / 失敗 ${fails.length} / 合計 ${(bytes / 1024 / 1024).toFixed(1)}MB`);
  for (const f of fails.slice(0, 10)) console.log(`  × ${f}`);
  return { ok, skip, bytes, fails: fails.length };
}

const ledger = [];

/* ------------------------------------------------------------------ *
 * 1. 一覧のアイコン（全1116件）
 * ------------------------------------------------------------------ */
if (wantIcons) {
  const jobs = [];
  for (const [itemId, meta] of Object.entries(index.items)) {
    const dir = SUB_TO_DIR[meta.subId];
    if (!dir || !meta.cover) continue;
    const slug = slugOf[itemId];
    if (!slug) continue;
    const dest = path.join(OUT, dir, `${slug}.webp`);
    jobs.push({
      name: `${dir}/${slug}`,
      fn: () => grab(meta.cover, dest, { size: 256 }),
    });
    ledger.push({ file: `official/endfield/${dir}/${slug}.webp`, from: meta.cover, name: meta.name, 分類: meta.sub });
  }
  console.log(`アイコン ${jobs.length} 枚`);
  await run(jobs, 'アイコン');
}

/* ------------------------------------------------------------------ *
 * 2. スキルのアイコン（GIF は1枚目だけ）
 * ------------------------------------------------------------------ */
if (wantSkills) {
  const jobs = [];
  const seen = new Set();
  for (const it of all.items) {
    const meta = index.items[it.itemId] ?? {};
    const dir = SUB_TO_DIR[meta.subId];
    if (!dir) continue;
    const slug = slugOf[it.itemId];
    if (!slug) continue;
    let n = 0;
    for (const ch of it.chapters) {
      for (const b of ch.blocks) {
        for (const t of b.tabs ?? []) {
          const url = t.intro?.icon;
          if (!url || seen.has(url)) continue;
          seen.add(url);
          n += 1;
          const dest = path.join(OUT, 'wiki/skills', `${dir}-${slug}-${n}.webp`);
          jobs.push({ name: `skill ${slug}-${n}`, fn: () => grab(url, dest, { size: 96, fit: 'inside' }) });
          ledger.push({
            file: `official/endfield/wiki/skills/${dir}-${slug}-${n}.webp`,
            from: url,
            name: `${it.name} — ${t.intro?.name ?? ''}`,
            分類: 'スキルのアイコン',
          });
        }
      }
    }
  }
  console.log(`スキルのアイコン ${jobs.length} 枚`);
  await run(jobs, 'スキル', 8);
}

/* ------------------------------------------------------------------ *
 * 3. 台帳
 * ------------------------------------------------------------------ */
const ledgerFile = path.join(DATA, 'images-ledger.json');
fs.writeFileSync(ledgerFile, JSON.stringify({ 取得日: new Date().toISOString().slice(0, 10), items: ledger }));
console.log(`台帳: scripts/data/endfield-wiki/images-ledger.json（${ledger.length} 件）`);
