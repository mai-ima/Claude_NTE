/**
 * エンドフィールド公式wiki（SKPORT）から項目を取得する。
 *
 *   node scripts/fetch-endfield-wiki.mjs            # 目録＋オペレーター33件
 *   node scripts/fetch-endfield-wiki.mjs --all      # 目録＋詳細を取れるだけ
 *   node scripts/fetch-endfield-wiki.mjs --sub 2    # 指定した分類だけ詳細を取る
 *
 * 出力
 *   scripts/data/endfield-wiki/index.json      … 全1100件超の「id → 名前・分類・タグ」
 *   scripts/data/endfield-wiki/operators.json  … オペレーターの中身（記事の材料）
 *   .cache/endfield-wiki/<id>.json             … 生の応答（追跡しない。作り直せる）
 *
 * ★ 大事なこと
 *   - ここで取ったものは**公式wikiの記述**。記事に写すときは出典を必ず付ける。
 *   - API の癖は scripts/lib/skport.mjs の冒頭に書いた（言語は `ja`）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { get, docToLines, docToText, WIKI_URL } from './lib/skport.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'scripts/data/endfield-wiki');
const CACHE = path.join(ROOT, '.cache/endfield-wiki');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(CACHE, { recursive: true });

const args = process.argv.slice(2);
const wantAll = args.includes('--all');
const onlySub = args.includes('--sub') ? args[args.indexOf('--sub') + 1] : null;

/* ------------------------------------------------------------------ *
 * 1. 目録（分類・絞り込みタグ・項目の一覧）
 * ------------------------------------------------------------------ */

const catalog = await get('/web/v1/wiki/item/catalog', { onlyOnline: 'false' });

/** タグID → 名前（★6 / 突撃 / 自然 …） */
const tagName = {};
/** タグID → そのタグが属する軸の名前（レア度 / 職業 …） */
const tagAxis = {};
const index = {};
const groups = [];

for (const main of catalog.catalog) {
  for (const sub of main.typeSub ?? []) {
    const walk = (node, axis) => {
      tagName[node.id] = node.name;
      if (axis) tagAxis[node.id] = axis;
      for (const c of node.children ?? []) walk(c, node.name);
    };
    for (const t of sub.filterTagTree ?? []) walk(t, null);

    const d = await get('/web/v1/wiki/item/catalog', { typeMainId: main.id, typeSubId: sub.id });
    const items = d.catalog?.[0]?.typeSub?.[0]?.items ?? [];
    groups.push({ mainId: main.id, mainName: main.name, subId: sub.id, subName: sub.name, count: items.length });
    for (const it of items) {
      index[it.itemId] = {
        name: it.name,
        sub: sub.name,
        subId: sub.id,
        cover: it.brief?.cover ?? '',
        dot: (it.brief?.dotType ?? '').replace('label_type_', ''),
        tags: (it.tagIds ?? []).map((t) => tagName[t]).filter(Boolean),
        /* 一覧にだけ載っている紹介文。オペレーターは1行目が決めぜりふ。
           分量が増えるので、オペレーター（sub=1）だけ残す。 */
        ...(sub.id === '1'
          ? { caption: (it.caption ?? []).map((c) => c.text?.text ?? '').filter(Boolean) }
          : {}),
      };
    }
    console.log(`目録: ${main.name} / ${sub.name} → ${items.length} 件`);
  }
}
fs.writeFileSync(
  path.join(OUT, 'index.json'),
  JSON.stringify({ 取得日: new Date().toISOString().slice(0, 10), 出典: WIKI_URL, groups, tagAxis, items: index }),
);
console.log(`index.json … ${Object.keys(index).length} 件`);

/* ------------------------------------------------------------------ *
 * 2. 詳細（ブロック文書を平たくする）
 * ------------------------------------------------------------------ */

/** 生の応答をキャッシュ越しに取る */
async function itemInfo(id) {
  const f = path.join(CACHE, `${id}.json`);
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'));
  const d = await get('/web/v1/wiki/item/info', { id });
  fs.writeFileSync(f, JSON.stringify(d));
  return d;
}

/** ウィジェットの「タブ」を、タブが無い場合（default）も含めて配列で返す */
function tabsOf(widget) {
  const list = widget.tabList ?? [];
  if (list.length) return list.map((t) => ({ ...t, data: widget.tabDataMap?.[t.tabId] }));
  const def = widget.tabDataMap?.default;
  return def ? [{ tabId: 'default', title: '', icon: '', data: def }] : [];
}

/** 文書キー（文字列）でも実体でも受け取れるようにする */
const resolveDoc = (doc, v) => (typeof v === 'string' ? doc.documentMap?.[v] : v);

/**
 * 残さないもの。
 * - **音声記録**（せりふ全文）と**メディア**（X・YouTube・ギャラリー）は、
 *   こちらの記事で出す予定が無い。まるごと写し取るのは避け、保存もしない。
 * - プロファイルの長い読み物（第一〜第四資料）も同じ理由で残さない。
 *   必要になったら `.cache/` から作り直せる。
 */
const SKIP_CHAPTER = new Set(['メディア']);
const SKIP_BLOCK = new Set(['音声記録', 'プロファイル']);

/** 1項目 → 記事の材料 */
function distill(raw) {
  const it = raw.item ?? {};
  const doc = it.document ?? {};
  const out = {
    itemId: it.itemId,
    name: it.name,
    cover: it.brief?.cover ?? '',
    illustration: doc.extraInfo?.illustration ?? '',
    description: docToText(it.brief?.description),
    publishedAt: it.publishedAtTs ? new Date(Number(it.publishedAtTs) * 1000).toISOString().slice(0, 10) : '',
    tags: (it.tagIds ?? []).map((t) => tagName[t]).filter(Boolean),
    chapters: [],
  };
  for (const ch of doc.chapterGroup ?? []) {
    if (SKIP_CHAPTER.has((ch.title ?? '').trim())) continue;
    const chapter = { title: ch.title, blocks: [] };
    for (const w of ch.widgets ?? []) {
      const cw = doc.widgetCommonMap?.[w.id];
      if (!cw) continue;
      const title = (w.title ?? '').replace(/^\/\/\s*/, '').trim();
      if (SKIP_BLOCK.has(title)) continue;
      const block = { title, type: cw.type };
      if (cw.type === 'table' && (cw.tableList ?? []).length) {
        block.pairs = cw.tableList.map((r) => ({ label: String(r.label ?? '').trim(), value: String(r.value ?? '').trim() }));
      }
      block.tabs = [];
      for (const t of tabsOf(cw)) {
        const data = t.data ?? {};
        const tab = { title: t.title ?? '' };
        if (data.intro) {
          tab.intro = {
            name: (data.intro.name ?? '').trim(),
            type: (data.intro.type ?? '').trim(),
            icon: data.intro.imgUrl ?? '',
            text: docToText(resolveDoc(doc, data.intro.description)),
          };
        }
        if (data.content) tab.lines = docToLines(resolveDoc(doc, data.content));
        if ((data.audioList ?? []).length) {
          tab.audio = data.audioList.map((a) => ({ title: a.title, text: a.profile }));
        }
        if (tab.intro || tab.lines?.length || tab.audio) block.tabs.push(tab);
      }
      chapter.blocks.push(block);
    }
    out.chapters.push(chapter);
  }
  return out;
}

/** 詳細を取る分類を決める */
const targets = [];
for (const [id, meta] of Object.entries(index)) {
  if (onlySub) { if (meta.subId === onlySub) targets.push(id); continue; }
  if (wantAll) { targets.push(id); continue; }
  if (meta.subId === '1') targets.push(id); // 既定はオペレーターだけ
}

const results = [];
let n = 0;
for (const id of targets) {
  const raw = await itemInfo(id);
  results.push(distill(raw));
  n += 1;
  if (n % 10 === 0 || n === targets.length) console.log(`詳細: ${n}/${targets.length}`);
}

const name = onlySub ? `sub-${onlySub}` : wantAll ? 'all' : 'operators';
fs.writeFileSync(
  path.join(OUT, `${name}.json`),
  JSON.stringify({ 取得日: new Date().toISOString().slice(0, 10), 出典: WIKI_URL, items: results }),
);
console.log(`${name}.json … ${results.length} 件`);
