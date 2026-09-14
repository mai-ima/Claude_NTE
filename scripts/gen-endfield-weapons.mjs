/**
 * 公式wiki（SKPORT）の材料で、武器の記事を書き出す。
 *
 *   node scripts/fetch-endfield-wiki.mjs --sub 2   # 先に材料を取る
 *   node scripts/gen-endfield-weapons.mjs
 *
 * 記事の並び
 *   概要 → 性能（初期と最大）→ 突破 → 武器スキル → 潜在強化
 *
 * 載せないもの
 *   「資料」（読み物）と「メディア資料」（外観のスクリーンショット）。
 *   取得の時点で落としてある（scripts/fetch-endfield-wiki.mjs）。
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT, TODAY, WIKI, readData, slugify, entryResolver, mdTable, linesToMd,
  blockOf, parseFront, slugByTitle, mergeSources, frontMatter,
} from './lib/efgen.mjs';

const DIR = path.join(ROOT, 'src/content/endfield-weapons');
const index = readData('index');
const wiki = readData('sub-2');
const resolve = entryResolver(index);
const known = slugByTitle(DIR);
const SOURCE = { label: '公式wiki（SKPORT）— 武器', url: WIKI };

/** 公式の武器種タグ（絞り込みに出てくる値） */
const TYPES = ['片手剣', '大剣', '長柄武器', '拳銃', 'アーツユニット'];
const RARITIES = ['★6', '★5', '★4', '★3'];

let n = 0;
for (const w of wiki.items) {
  const name = w.name.trim();
  const meta = index.items[w.itemId] ?? {};
  const slug = known[name] ?? slugify(meta.en) ?? '';
  if (!slug) { console.log(`× slug を作れない: ${name}`); continue; }

  const rarity = w.tags.find((t) => RARITIES.includes(t)) ?? '';
  const type = w.tags.find((t) => TYPES.includes(t)) ?? '';

  const file = path.join(DIR, `${slug}.md`);
  const old = fs.existsSync(file) ? parseFront(fs.readFileSync(file, 'utf8')) : { front: {}, sources: [], sections: {} };

  /* --- 入手方法と味つけの1文 ---------------------------------------- */
  const preview = blockOf(w, '武器記録', 'プレビュー');
  const intro = preview?.tabs?.[0]?.intro ?? {};
  const acquisition = (intro.text ?? '')
    .split('\n')
    .find((l) => l.includes('入手'))
    ? (intro.text ?? '').split('\n').slice(1).join(' ').trim()
    : '';
  /* 説明文の1行目は「エンドフィールドのオペレーター用武器…」という定型なので落とす */
  const flavor = (w.description ?? '').split('\n').slice(1).join('\n').trim();

  /* --- frontmatter --------------------------------------------------- */
  const fm = frontMatter(
    [
      ['title', name],
      ['en', meta.en],
      ['rarity', rarity],
      ['type', type],
      ['acquisition', acquisition || old.front.acquisition],
      ['recommendedFor', old.front.recommendedFor],
      ['order', Number(old.front.order ?? n + 1)],
      ['description', `${rarity} の${type || '武器'}。${acquisition ? `入手は${acquisition}。` : ''}`.trim()],
      ['status', 'verified'],
      ['updated', TODAY],
      ['checked', TODAY],
      ['tags', ['武器', rarity, type].filter(Boolean)],
      ['aliases', meta.en ? [meta.en] : []],
    ],
    mergeSources([SOURCE], old.sources),
  );

  /* --- 本文 ---------------------------------------------------------- */
  const md = [];
  md.push('## 概要');
  md.push(
    `**${name}**${meta.en ? `（${meta.en}）` : ''}は、**${rarity}** の**${type || '武器'}**。` +
      (acquisition ? `\n入手は**${acquisition}**。` : ''),
  );
  if (flavor) md.push(`> ${flavor.split('\n').join(' ')}`);

  const previewTable = preview?.tabs?.[0]?.lines?.find((l) => l.kind === 'table');
  if (previewTable) {
    md.push('## 性能');
    md.push('左が入手した直後、右が上限まで育てたとき。');
    md.push(mdTable(previewTable.rows, resolve, { mergeUnlabeled: true }));
  }

  const levelUp = blockOf(w, 'レベルアップ', '突破');
  if (levelUp?.tabs?.length) {
    const parts = [];
    for (const t of levelUp.tabs) {
      const tbl = t.lines?.find((l) => l.kind === 'table');
      if (!tbl) continue;
      parts.push(`### ${t.title || 'レベルアップ'}`);
      parts.push(mdTable(tbl.rows, resolve, { mergeUnlabeled: true }));
    }
    if (parts.length) {
      md.push('## 突破');
      md.push('各段階の値と、突破に要るもの。');
      md.push(parts.join('\n\n'));
    }
  }

  const skill = blockOf(w, 'スキル・活性化', '武器スキル効果');
  if (skill?.tabs?.length) {
    md.push('## 武器スキル');
    for (const t of skill.tabs) md.push(linesToMd(t.lines, resolve, '###'));
  }

  const pot = blockOf(w, '潜在', '潜在強化');
  if (pot?.tabs?.length) {
    md.push('## 潜在強化');
    for (const t of pot.tabs) md.push(linesToMd(t.lines, resolve, '###'));
  }

  /* 手で書いた節のうち、公式wikiに無い話（入手の詳細など）は引き継ぐ */
  for (const [t, text] of Object.entries(old.sections)) {
    if (!/入手|配布/.test(t)) continue;
    const kept = text.split('\n').filter((l) => !/^関連:/.test(l)).join('\n').trim();
    if (kept) { md.push(`## ${t}`); md.push(kept); }
  }

  md.push('関連: [武器](/endfield/terms/weapon-type/) ／ [オペレーター](/endfield/terms/operator/)');

  fs.writeFileSync(file, `---\n${fm}\n---\n\n${md.filter(Boolean).join('\n\n')}\n`);
  n += 1;
}
console.log(`武器の記事 ${n} 本を書き出しました`);
