/**
 * 公式wiki（SKPORT）の材料で、**脅威・装備・アイテム・設備**の記事を書き出す。
 *
 *   node scripts/fetch-endfield-wiki.mjs --all      # 先に材料を取る（15分ほど）
 *   node scripts/gen-endfield-entries.mjs           # 4分類ぜんぶ
 *   node scripts/gen-endfield-entries.mjs enemies   # 分類ひとつだけ
 *
 * オペレーターと武器は作りが違うので別のスクリプトにしてある
 * （`gen-endfield-operators.mjs` / `gen-endfield-weapons.mjs`）。
 * この4分類は**章とブロックの並びがほぼ同じ**なので、1本でまとめて作る。
 *
 * ★ 記事の slug は `scripts/lib/efgen.mjs` の `buildSlugMap()` で決める。
 *   画像の取得（`fetch-endfield-wiki-images.mjs`）と**同じ関数**を使うので、
 *   `public/images/official/endfield/<分類>/<slug>.webp` がそのまま絵になる。
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT, TODAY, WIKI, readData, buildSlugMap, entryResolver, mdTable, linesToMd,
  parseFront, slugByTitle, mergeSources, frontMatter,
} from './lib/efgen.mjs';

const index = readData('index');
const all = readData('all');
const resolve = entryResolver(index);

/** タグの中から、候補に載っているものを1つ選ぶ */
const pick = (tags, list) => tags.find((t) => list.includes(t)) ?? '';
const RARITY = ['★6', '★5', '★4', '★3', '★2', '★1'];
const QUALITY = ['金品質', '紫品質', '青品質', '緑品質', '灰品質'];
const SLOT = ['胴', '腕', 'アクセサリー'];
const ENEMY_KIND = ['アンゲロス', 'ランドブレーカー', '野生の生物', '滄賊', '蝕影', '巫術の造物', '造裔'];
const ENEMY_CLASS = ['通常クラス', '精鋭クラス', '上級クラス', '幹部クラス', 'ボスクラス'];
const ITEM_KIND = [
  '工業製品', '消費アイテム', '採集素材', '天然資源', '貴重素材', '強化素材', 'プレゼント',
  '機能的アイテム', '物資箱', '沈殿物品', 'オペレーターの印', '沈殿晶核', '理性回復剤',
  '限定レアアイテム', 'レアアイテム', '任務アイテム', '探知機', '通貨', 'イベント通貨',
];
const FACILITY_KIND = [
  '合成生産', '基礎生産', '戦闘サポート', '倉庫搬入出', '物流装置', '栽培用',
  '資源採集', 'サポート設備', '電力供給', '装飾品',
];

/** 分類ごとの決めごと */
const KINDS = {
  enemies: {
    subs: ['3'],
    content: 'endfield-enemies',
    imgDir: 'enemies',
    label: '脅威',
    source: '公式wiki（SKPORT）— 脅威',
    related: '関連: [敵・ボス](/endfield/enemies/) ／ [エリア](/endfield/areas/)',
    front: (tags) => ({
      type: pick(tags, ENEMY_KIND) || '脅威',
    }),
    lead: (name, en, tags) => {
      const kind = pick(tags, ENEMY_KIND);
      const cls = pick(tags, ENEMY_CLASS);
      return `**${name}**${en ? `（${en}）` : ''}は、${kind ? `**${kind}**に属する` : ''}敵。${cls ? `**${cls}**。` : ''}`;
    },
  },
  gear: {
    subs: ['4'],
    content: 'endfield-gear',
    imgDir: 'gear',
    label: '装備',
    source: '公式wiki（SKPORT）— 装備',
    related: '関連: [装備](/endfield/gear/) ／ [オペレーター](/endfield/terms/operator/)',
    front: (tags) => ({
      slot: pick(tags, SLOT),
      quality: pick(tags, QUALITY),
      setName: tags.find((t) => ![...RARITY, ...QUALITY, ...SLOT, 'セットなし'].includes(t)) ?? '',
    }),
    lead: (name, en, tags) => {
      const slot = pick(tags, SLOT);
      const quality = pick(tags, QUALITY);
      const set = tags.find((t) => ![...RARITY, ...QUALITY, ...SLOT, 'セットなし'].includes(t));
      return (
        `**${name}**${en ? `（${en}）` : ''}は、${quality ? `**${quality}**の` : ''}${slot ? `**${slot}**の` : ''}装備。` +
        (set ? `セットは**${set}**。` : 'セット効果はない。')
      );
    },
  },
  items: {
    subs: ['6', '15', '16'],
    content: 'endfield-items',
    imgDir: 'items',
    label: 'アイテム',
    source: '公式wiki（SKPORT）— アイテム',
    related: '関連: [アイテム](/endfield/items/) ／ [集成工業](/endfield/industry/)',
    front: (tags, meta) => ({
      type: pick(tags, ITEM_KIND) || (meta.sub === '基質' ? '基質' : '素材'),
    }),
    lead: (name, en, tags, meta) => {
      const kind = pick(tags, ITEM_KIND) || (meta.sub === '基質' ? '基質' : 'アイテム');
      const rarity = pick(tags, RARITY);
      return `**${name}**${en ? `（${en}）` : ''}は、${rarity ? `**${rarity}** の` : ''}**${kind}**。`;
    },
  },
  industry: {
    subs: ['5', '17'],
    content: 'endfield-industry',
    imgDir: 'industry',
    label: '設備',
    source: '公式wiki（SKPORT）— 設備・システム図面',
    related: '関連: [集成工業](/endfield/industry/) ／ [アイテム](/endfield/items/)',
    front: (tags, meta) => ({
      category: meta.subId === '17' ? '図面' : pick(tags, FACILITY_KIND) || '設備',
    }),
    lead: (name, en, tags, meta) => {
      const isPlan = meta.subId === '17';
      const kind = pick(tags, FACILITY_KIND);
      const area = tags.find((t) => !RARITY.includes(t) && !FACILITY_KIND.includes(t));
      if (isPlan) return `**${name}**${en ? `（${en}）` : ''}は、集成工業の**システム図面**。${area ? `分類は**${area}**。` : ''}`;
      const rarity = pick(tags, RARITY);
      return `**${name}**${en ? `（${en}）` : ''}は、${rarity ? `**${rarity}** の` : ''}**${kind || '設備'}**。`;
    },
  },
};

/* 引数で分類を絞れる */
const only = process.argv.slice(2).filter((a) => KINDS[a]);
const targets = only.length ? only : Object.keys(KINDS);

for (const kind of targets) {
  const K = KINDS[kind];
  const DIR = path.join(ROOT, 'src/content', K.content);
  fs.mkdirSync(DIR, { recursive: true });

  const known = slugByTitle(DIR);
  const entries = Object.entries(index.items).filter(([, m]) => K.subs.includes(m.subId));
  const slugOf = buildSlugMap(entries, known);
  const SOURCE = { label: K.source, url: WIKI };

  /* 記事1本ぶんに束ねる。**同じ名前の項目は1本にまとめる**
     （公式wikiには同名の項目が別々に登録されていることがある）。 */
  const groups = new Map();
  for (const it of all.items) {
    const meta = index.items[it.itemId];
    if (!meta || !K.subs.includes(meta.subId)) continue;
    const slug = slugOf[it.itemId];
    if (!slug) continue;
    if (!groups.has(slug)) groups.set(slug, { meta, items: [] });
    groups.get(slug).items.push(it);
  }

  let n = 0;
  for (const [slug, group] of groups) {
    const it = group.items[0];
    const meta = group.meta;
    const name = it.name.trim();
    const tags = [...new Set(group.items.flatMap((x) => x.tags.map((t) => t.trim())))].filter(Boolean);
    const file = path.join(DIR, `${slug}.md`);
    const old = fs.existsSync(file)
      ? parseFront(fs.readFileSync(file, 'utf8'))
      : { front: {}, sources: [], sections: {} };

    /* --- 本文 ------------------------------------------------------- */
    const md = [];
    md.push('## 概要');
    md.push(K.lead(name, meta.en, tags, meta));
    /* 公式の説明文。1行だけの短いものが多いので、そのまま引用として置く */
    const flavor = (it.description ?? '').trim();
    if (flavor) md.push(flavor.split('\n').map((l) => `> ${l}`).join('\n> \n'));

    let sections = 0;
    /* 同名でまとめたときは、2件目以降に「（2）」を付けて章を続ける */
    const chapters = group.items.flatMap((x, i) =>
      x.chapters.map((ch) => ({ ...ch, title: i === 0 ? ch.title : `${ch.title}（${i + 1}）` })),
    );
    for (const ch of chapters) {
      const chTitle = ch.title.trim().replace(/^\\+/, '');
      for (const b of ch.blocks) {
        const body = [];
        for (const t of b.tabs ?? []) {
          if (t.title) body.push(`### ${t.title}`);
          if (t.intro?.name) body.push(`**${t.intro.name}**${t.intro.type ? `（${t.intro.type}）` : ''}`);
          if (t.intro?.text) body.push(resolve(t.intro.text).split('\n').join('\n\n'));
          if (t.lines?.length) body.push(linesToMd(t.lines, resolve, '###'));
        }
        if (b.pairs?.length) {
          body.push(mdTable([['項目', '内容'], ...b.pairs.map((p) => [p.label, p.value])], resolve, {
            dropEmptyFirstColumn: false,
          }));
        }
        const text = body.filter(Boolean).join('\n\n').trim();
        if (!text) continue;
        /* 章とブロックの名前が同じときは見出しを1つにする（「入手方法/入手方法」が多い） */
        md.push(`## ${chTitle === b.title || !b.title ? chTitle : `${chTitle}（${b.title}）`}`);
        md.push(text);
        sections += 1;
      }
    }
    if (!sections) {
      md.push(
        '> 🛠 **要確認**: 公式wikiに項目はありますが、**中身がまだ載っていません**。\n' +
          '> 載りしだい書き足します。',
      );
    }

    /* 手で書いた節は消さずに引き継ぐ */
    for (const [t, text] of Object.entries(old.sections)) {
      if (md.some((m) => m === `## ${t}`)) continue;
      if (t === '概要') continue;
      const kept = text.split('\n').filter((l) => !/^関連:/.test(l)).join('\n').trim();
      if (kept) { md.push(`## ${t}`); md.push(kept); }
    }
    md.push(K.related);

    /* --- frontmatter ------------------------------------------------ */
    const extra = K.front(tags, meta);
    const rarity = pick(tags, RARITY);
    const fm = frontMatter(
      [
        ['title', name],
        ['en', meta.en],
        ...Object.entries(extra),
        ['acquisition', old.front.acquisition],
        ['order', Number(old.front.order ?? n + 1)],
        ['description', K.lead(name, '', tags, meta).replace(/\*\*/g, '').replace(/^.+?は、/, '').trim()],
        ['status', sections ? 'verified' : 'draft'],
        ['updated', TODAY],
        ['checked', TODAY],
        ['tags', [K.label, ...tags].filter(Boolean)],
        ['aliases', meta.en ? [meta.en] : []],
      ],
      mergeSources([SOURCE], old.sources),
    );
    void rarity;

    fs.writeFileSync(file, `---\n${fm}\n---\n\n${md.filter(Boolean).join('\n\n')}\n`);
    n += 1;
  }
  console.log(`${K.label}: ${n} 本`);
}
