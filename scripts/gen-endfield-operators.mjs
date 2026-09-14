/**
 * 公式wiki（SKPORT）から取った材料で、オペレーターの記事を書き出す。
 *
 *   node scripts/fetch-endfield-wiki.mjs      # 先に材料を取る
 *   node scripts/gen-endfield-operators.mjs   # 記事を書き出す
 *
 * ★ 方針
 *   - **数値と効果文は公式wikiのもの**。出典を frontmatter に必ず入れる。
 *   - 読み物（プロファイルの第一〜第四資料）と**せりふ全文は写さない**。
 *     ここで出すのは、遊ぶときに要る**ゲーム内のデータ**だけにする。
 *   - 既存の記事にある `order` `version` `sources` は**消さずに引き継ぐ**。
 *   - 横に長い表はレイアウト側（EndfieldLayout）が自動でスクロール箱に包む。
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIR = path.join(ROOT, 'src/content/endfield-operators');
const wiki = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/data/endfield-wiki/operators.json'), 'utf8'));
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/data/endfield-wiki/index.json'), 'utf8'));
const local = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/data/endfield-operators.json'), 'utf8'));

const TODAY = new Date().toISOString().slice(0, 10);
const SOURCE = { label: '公式wiki（SKPORT）— オペレーター', url: 'https://wiki.skport.com/endfield' };

/**
 * スキルの様子（技を出している瞬間）。
 * `scripts/fetch-endfield-wiki-images.mjs` が同梱したものを、
 * **台帳（images-ledger.json）経由で**引く。
 * 連番だけで当てにいくと、取得と生成で数え方がずれたときに黙って別の絵が出る。
 * 台帳には「オペレーター名 — スキル名」が入っているので、そこで突き合わせる。
 *
 * ★ 公式の元画像は**アニメーション GIF**（技の実演）。
 *   小さいアイコンではないので、**見出しには置かず、説明の下に1枚置く**。
 */
const skillIcon = {};
try {
  const ledger = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'scripts/data/endfield-wiki/images-ledger.json'), 'utf8'),
  );
  for (const x of ledger.items ?? []) {
    if (x.分類 !== 'スキルの様子') continue;
    const m = String(x.file).match(/skills\/operators-(.+)-\d+\.webp$/);
    const skill = String(x.name ?? '').split(' — ')[1]?.trim();
    if (!m || !skill) continue;
    skillIcon[`${m[1]}::${skill}`] = `/images/${x.file}`;
  }
} catch {
  /* 台帳が無いときはアイコン無しで書き出す（絵が出ないだけ） */
}

/* ------------------------------------------------------------------ *
 * 下ごしらえ
 * ------------------------------------------------------------------ */

/** 公式の表示名（前後の空白と「（男）」などを外したもの）→ 記事の slug */
const slugOf = {};
const enOf = {};
for (const l of local) {
  const key = l.name.trim();
  if (!slugOf[key] || l.id.length < slugOf[key].length) slugOf[key] = l.id;
  enOf[key] = l.en;
}
/** 「管理人（男）」「管理人（女）」は 1 本の記事にまとめる */
const baseName = (n) => n.trim().replace(/（[男女]）$/, '');

/** 素材などの参照 `{{entry:ID×個数}}` を名前に直す */
const entryName = (id) => index.items[id]?.name ?? `#${id}`;
function resolveEntries(s) {
  return String(s ?? '')
    // 参照が続けて並ぶと名前がくっついて読めなくなるので、あいだに中黒を入れる
    .replace(/\}\}\{\{/g, '}}・{{')
    .replace(/\{\{entry:(\d+)(?:×(\d+))?\}\}/g, (_, id, n) => {
      const name = entryName(id);
      if (!n || n === '0') return name;
      return `${name}×${Number(n).toLocaleString('en-US')}`;
    });
}

/** 表のセル。パイプと改行を逃がす */
const cell = (s) => resolveEntries(s).replace(/\|/g, '\\|').replace(/\n+/g, ' / ').trim();

/** 行の配列 → Markdown の表 */
function mdTable(rows, { dropEmptyFirstColumn = true } = {}) {
  if (!rows?.length) return '';
  let body = rows.map((r) => r.map(cell));
  // 先頭列がすべて空なら落とす（公式の表は行見出しの枠が空のことがある）
  if (dropEmptyFirstColumn && body.every((r) => !r[0])) body = body.map((r) => r.slice(1));
  const width = Math.max(...body.map((r) => r.length));
  body = body.map((r) => [...r, ...Array(width - r.length).fill('')]);
  const head = body[0];
  const rest = body.slice(1);
  return [
    `| ${head.join(' | ')} |`,
    `| ${head.map(() => '---').join(' | ')} |`,
    ...rest.map((r) => `| ${r.join(' | ')} |`),
  ].join('\n');
}

/** 蒸留した行の配列 → Markdown */
function linesToMd(lines, headingLevel = '####') {
  const out = [];
  for (let i = 0; i < lines.length; i += 1) {
    const l = lines[i];
    if (l.kind === 'heading') {
      // 「名前」＋「種別（引用）」が続く形は 1 行の見出しにまとめる
      const next = lines[i + 1];
      const label = l.text.replace(/\*\*/g, '').trim();
      if (next?.kind === 'quote') {
        out.push(`${headingLevel} ${label}（${next.text.replace(/\*\*/g, '').trim()}）`);
        i += 1;
      } else {
        out.push(`${headingLevel} ${label}`);
      }
      continue;
    }
    if (l.kind === 'quote') { out.push(`> ${resolveEntries(l.text)}`); continue; }
    if (l.kind === 'p') { out.push(resolveEntries(l.text)); continue; }
    if (l.kind === 'table') { out.push(mdTable(l.rows)); continue; }
  }
  return out.filter(Boolean).join('\n\n');
}

/** 章 → ブロックを名前で引く */
function blockOf(op, chapter, title) {
  const ch = op.chapters.find((c) => c.title.trim() === chapter);
  return ch?.blocks.find((b) => b.title === title);
}

/* ------------------------------------------------------------------ *
 * frontmatter
 * ------------------------------------------------------------------ */

function parseFront(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { sources: [], sections: {} };
  const front = {};
  const sources = [];
  let key = null;
  let cur = null;
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z][A-Za-z0-9_]*):\s*(.*)$/);
    if (kv) {
      key = kv[1];
      cur = null;
      const v = kv[2].trim();
      if (v === '') front[key] = [];
      else if (v.startsWith('[')) {
        front[key] = v.replace(/^\[|\]$/g, '').split(',').map((x) => x.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      } else front[key] = v.replace(/^["']|["']$/g, '');
      continue;
    }
    /* 出典は「  - label: …」「    url: …」の2行組 */
    if (key === 'sources') {
      const lab = line.match(/^\s*-\s*label:\s*"?(.*?)"?\s*$/);
      if (lab) { cur = { label: lab[1], url: '' }; sources.push(cur); continue; }
      const url = line.match(/^\s*url:\s*"?(.*?)"?\s*$/);
      if (url && cur) cur.url = url[1];
      continue;
    }
    if (key && /^\s*-\s/.test(line)) {
      if (!Array.isArray(front[key])) front[key] = [];
      front[key].push(line.replace(/^\s*-\s*/, ''));
    }
  }
  front.sources = sources.filter((s) => s.url);

  /* 手で書いた節を拾っておく（`## 見出し` 単位） */
  const body = raw.slice(m[0].length);
  const sections = {};
  let title = null;
  let buf = [];
  for (const line of body.split('\n')) {
    const h = line.match(/^##\s+(.+)$/);
    if (h) {
      if (title) sections[title] = buf.join('\n').trim();
      title = h[1].trim();
      buf = [];
    } else if (title) buf.push(line);
  }
  if (title) sections[title] = buf.join('\n').trim();
  front.sections = sections;
  return front;
}

const q = (s) => `"${String(s).replace(/"/g, '\\"')}"`;

/* ------------------------------------------------------------------ *
 * 1件ぶんの記事を組み立てる
 * ------------------------------------------------------------------ */

/** 公式の「基本情報」から label → value を引く */
function basicOf(op) {
  const b = blockOf(op, 'オペレーター情報', '基本情報');
  const map = {};
  for (const p of b?.pairs ?? []) {
    /* 管理人（プレイヤーの分身）は性別・誕生日・種族が「■■」で伏せられている。
       そのまま出しても読む人の役に立たないので落とす。 */
    if (/^[■\s]+$/.test(p.value)) continue;
    map[p.label.replace(/\s+/g, '')] = p.value;
  }
  return map;
}

/** 能力値の「一覧」タブ（全レベルをまとめた表） */
function statTable(op) {
  const b = blockOf(op, '能力値', 'レベルアップ') ?? blockOf(op, '能力値', 'レベルアップ');
  const all = b?.tabs?.find((t) => t.title === '一覧') ?? b?.tabs?.[b.tabs.length - 1];
  return all?.lines?.find((l) => l.kind === 'table') ?? null;
}

function mainSubStat(table) {
  let mainStat = '';
  let subStat = '';
  for (const row of table?.rows ?? []) {
    const label = String(row[0] ?? '').replace(/\*\*/g, '');
    if (label.includes('（メイン能力）')) mainStat = label.replace('（メイン能力）', '').trim();
    if (label.includes('（サブ能力）')) subStat = label.replace('（サブ能力）', '').trim();
  }
  return { mainStat, subStat };
}

function recommendedWeapons(op) {
  const b = blockOf(op, 'おすすめ武器', 'ゲーム内推奨');
  const t = b?.tabs?.[0]?.lines?.find((l) => l.kind === 'table');
  const names = new Set();
  for (const row of t?.rows ?? []) {
    for (const c of row) {
      for (const m of String(c).matchAll(/\{\{entry:(\d+)/g)) {
        const meta = index.items[m[1]];
        if (meta?.subId === '2') names.add(meta.name);
      }
    }
  }
  return [...names];
}

function axisOf(op, axisName) {
  /* tags は「★6」「突撃」のような**名前の配列**なので、どの軸のタグかは
     名前から判断する（公式の絞り込みに出てくる値をそのまま並べた）。 */
  const KNOWN = {
    レア度: ['★6', '★5', '★4', '★3'],
    ステータス: ['灼熱', '寒冷', '電磁', '自然', '物理'],
    職業: ['前衛', '術師', '補助', '重装', '先鋒', '突撃'],
    武器種類: ['片手剣', '大剣', '長柄武器', '拳銃', 'アーツユニット'],
  };
  const list = KNOWN[axisName];
  if (list) return op.tags.find((t) => list.includes(t)) ?? '';
  /* 陣営は消去法（上のどれでもないもの） */
  const used = new Set(Object.values(KNOWN).flat());
  return op.tags.find((t) => !used.has(t)) ?? '';
}

function build(op, order, variants = []) {
  const name = baseName(op.name);
  const slug = slugOf[name];
  if (!slug) return null;
  const file = path.join(DIR, `${slug}.md`);
  const old = fs.existsSync(file) ? parseFront(fs.readFileSync(file, 'utf8')) : {};

  const basic = basicOf(op);
  /* 管理人は男性版・女性版で CV だけが違うので、1行にまとめて両方載せる */
  for (const v of variants) {
    const suffix = v.name.match(/（(.)）$/)?.[1] ?? '';
    const other = basicOf(v);
    for (const key of ['日本語CV', '中国語CV', '英語CV', '韓国語CV']) {
      if (!basic[key] || !other[key] || basic[key] === other[key]) continue;
      const mine = op.name.match(/（(.)）$/)?.[1] ?? '';
      basic[key] = `${basic[key]}（${mine}）／${other[key]}（${suffix}）`;
    }
  }
  const stats = statTable(op);
  const { mainStat, subStat } = mainSubStat(stats);
  const weapons = recommendedWeapons(op);
  const caption = index.items[op.itemId]?.caption ?? [];
  const quote = (caption[0] ?? '').match(/^「(.+)」$/)?.[1] ?? '';

  const rarity = axisOf(op, 'レア度');
  const klass = axisOf(op, '職業');
  const element = axisOf(op, 'ステータス');
  const weaponType = axisOf(op, '武器種類');
  const faction = basic['陣営'] || axisOf(op, '陣営');
  const preview = index.items[op.itemId]?.dot === 'preview';

  /* --- frontmatter --------------------------------------------------- */
  const sources = [];
  const push = (s) => { if (s?.url && !sources.some((x) => x.url === s.url)) sources.push(s); };
  push(SOURCE);
  for (const s of old.sources ?? []) push(s);

  const fm = [];
  fm.push(`title: ${q(name)}`);
  if (enOf[name]) fm.push(`en: ${q(enOf[name])}`);
  if (rarity) fm.push(`rarity: ${q(rarity)}`);
  if (klass) fm.push(`class: ${q(klass)}`);
  if (element) fm.push(`element: ${q(element)}`);
  if (weaponType) fm.push(`weaponType: ${q(weaponType)}`);
  if (faction) fm.push(`faction: ${q(faction)}`);
  if (basic['性別']) fm.push(`gender: ${q(basic['性別'])}`);
  if (basic['誕生日']) fm.push(`birthday: ${q(basic['誕生日'])}`);
  if (basic['種族']) fm.push(`race: ${q(basic['種族'])}`);
  if (basic['日本語CV']) fm.push(`cvJa: ${q(basic['日本語CV'])}`);
  if (basic['中国語CV']) fm.push(`cvCn: ${q(basic['中国語CV'])}`);
  if (basic['英語CV']) fm.push(`cvEn: ${q(basic['英語CV'])}`);
  if (basic['韓国語CV']) fm.push(`cvKr: ${q(basic['韓国語CV'])}`);
  if (mainStat) fm.push(`mainStat: ${q(mainStat)}`);
  if (subStat) fm.push(`subStat: ${q(subStat)}`);
  if (weapons.length) fm.push(`recommendedWeapons: [${weapons.map(q).join(', ')}]`);
  if (quote) fm.push(`quote: ${q(quote)}`);
  if (old.version) fm.push(`version: ${q(old.version)}`);
  fm.push(`implemented: ${preview ? 'false' : 'true'}`);
  fm.push(`order: ${old.order ?? order}`);

  const desc = preview
    ? `${rarity} の${klass}／${element}属性のオペレーター（実装前に公開された情報）。`
    : `${rarity} の${klass}／${element}属性のオペレーター。武器種は${weaponType}、所属は${faction}。`;
  fm.push(`description: ${q(desc)}`);
  fm.push(`status: ${q(preview ? 'draft' : 'verified')}`);
  fm.push(`updated: ${TODAY}`);
  fm.push(`checked: ${TODAY}`);
  const tags = ['オペレーター', rarity, klass, element, weaponType, faction].filter(Boolean);
  fm.push(`tags: [${tags.map(q).join(', ')}]`);
  if (enOf[name]) fm.push(`aliases: [${q(enOf[name])}]`);
  fm.push('sources:');
  for (const s of sources) fm.push(`  - label: ${q(s.label)}\n    url: ${q(s.url)}`);

  /* --- 本文 ---------------------------------------------------------- */
  const md = [];
  md.push('## 概要');
  md.push(
    `**${name}**${enOf[name] ? `（${enOf[name]}）` : ''}は、**${rarity}** の[オペレーター](/endfield/terms/operator/)。\n` +
      `[職業](/endfield/terms/class/)は**${klass}**、[属性](/endfield/terms/element/)は**${element}**。\n` +
      `扱う[武器種](/endfield/terms/weapon-type/)は**${weaponType}**で、所属は**${faction}**。`,
  );
  if (quote) md.push(`> 「${quote}」`);
  if (name === '管理人') {
    md.push(
      '公式wikiでは**男性版と女性版が別々の項目**になっているが、' +
        'レア度・職業・属性・能力値・スキルはどちらも同じ。ここでは1つにまとめている。\n' +
        '性別・誕生日・種族は公式wikiでも伏せられている。',
    );
  }
  if (preview) {
    md.push(
      '> **要確認**: この項目は**実装前に公開された情報**です。\n' +
        '> 実装時に数値や効果が変わることがあります。',
    );
  }

  md.push('## 基本情報');
  const rows = [['項目', '内容']];
  for (const [k, v] of Object.entries(basic)) if (v) rows.push([k, v]);
  md.push(mdTable(rows, { dropEmptyFirstColumn: false }));

  if (stats) {
    md.push('## 能力値');
    md.push('レベルごとの能力値と、上げるのに要るもの。');
    md.push(mdTable(stats.rows));
  }

  const skills = blockOf(op, '能力拡張', '戦闘スキル');
  if (skills?.tabs?.length) {
    md.push('## 戦闘スキル');
    for (const t of skills.tabs) {
      const skillName = (t.intro?.name ?? '').trim();
      const head = [t.intro?.name, t.intro?.type ? `（${t.intro.type}）` : ''].join('');
      md.push(`### ${head || 'スキル'}`);
      if (t.intro?.text) md.push(resolveEntries(t.intro.text).split('\n').join('\n\n'));
      /* 技を出している様子。同梱していないときは何も出ないだけ（壊れない） */
      const shot = skillIcon[`${slug}::${skillName}`];
      if (shot) md.push(`![${skillName || 'スキル'}の様子](${shot})`);
      const tbl = t.lines?.find((l) => l.kind === 'table');
      if (tbl) md.push(mdTable(tbl.rows));
    }
  }

  const talents = blockOf(op, '能力拡張', '素質・配属スキル');
  if (talents?.tabs?.length) {
    md.push('## 素質・配属スキル');
    for (const t of talents.tabs) md.push(linesToMd(t.lines ?? [], '###'));
  }

  const promote = blockOf(op, '能力拡張', '昇進');
  if (promote?.tabs?.length) {
    md.push('## 昇進と装備適正');
    const pr = [['段階', '解放されるもの', '解放条件', '必要なもの']];
    for (const t of promote.tabs) {
      const tbl = t.lines?.find((l) => l.kind === 'table');
      /* 1行目は見出し（空・解放後・解放条件・アイテム消費）なので落とし、
         2行目以降（段階名＋中身）をそのまま1本の表に積む */
      for (const row of (tbl?.rows ?? []).slice(1)) {
        if (row.some(Boolean)) pr.push(row);
      }
    }
    md.push(mdTable(pr, { dropEmptyFirstColumn: false }));
  }

  const potential = blockOf(op, '潜在', '潜在解放');
  if (potential?.tabs?.length) {
    /* 公式は見出しの無い表で出しているので、こちらでは
       「名前（POTENTIAL n）」＋効果 の1本の表に組み直す。
       同じ節に並んでいる「記念画像」はイラストの一覧なので載せない。 */
    const pot = [['潜在', '効果']];
    for (const t of potential.tabs) {
      for (const line of t.lines ?? []) {
        if (line.kind !== 'table') continue;
        /* 見出しが「記念画像」の表（イラストの一覧）は載せない。
           効果文の中の「記念画像「◯◯」を解放」で誤爆しないよう、左上のセルだけを見る */
        if (String(line.rows[0]?.[0] ?? '').includes('記念画像')) continue;
        for (const row of line.rows) {
          const cells = row.filter((c) => String(c).trim());
          if (cells.length >= 2) pot.push([cells[0], cells.slice(1).join(' / ')]);
        }
      }
    }
    if (pot.length > 1) {
      md.push('## 潜在');
      md.push(mdTable(pot, { dropEmptyFirstColumn: false }));
    }
  }

  const person = blockOf(op, 'プロファイル', '個人情報');
  if (person?.tabs?.length) {
    md.push('## 人物');
    for (const t of person.tabs) {
      let body = linesToMd(t.lines ?? [], '###');
      /* 「陣営」「種族」は**まとめのページへ渡す**（2026-09-14）。
         組織名や種族名だけを置くより、そこから世界の説明へ辿れる方がいい。
         自動リンクは一般語を避けているので、ここは手で張る。 */
      body = body
        .replace(/(### 陣営\n\n)([^\n[]+)\n/, '$1[$2](/endfield/terms/factions/)\n')
        .replace(/(### 種族\n\n)([^\n[]+)\n/, '$1[$2](/endfield/terms/races/)\n');
      md.push(body);
    }
  }

  /* 手で書いた「入手」まわりの節は消さずに引き継ぐ（公式wikiに無い情報のため） */
  for (const [t, text] of Object.entries(old.sections ?? {})) {
    if (!t.includes('入手')) continue;
    /* 末尾の「関連: …」行は、こちらで付け直すので落とす */
    const kept = text.split('\n').filter((l) => !/^関連:/.test(l)).join('\n').trim();
    if (!kept) continue;
    md.push(`## ${t}`);
    md.push(kept);
  }

  md.push(
    '関連: [オペレーター](/endfield/terms/operator/) ／ ' +
      '[職業](/endfield/terms/class/) ／ [属性](/endfield/terms/element/) ／ ' +
      '[武器種](/endfield/terms/weapon-type/)',
  );

  return { file, text: `---\n${fm.join('\n')}\n---\n\n${md.filter(Boolean).join('\n\n')}\n` };
}

/* ------------------------------------------------------------------ *
 * 書き出す
 * ------------------------------------------------------------------ */

let n = 0;
const seen = new Set();
wiki.items.forEach((op, i) => {
  const key = baseName(op.name);
  if (seen.has(key)) return; // 管理人の男女ぶんは 1 本にまとめる
  const variants = wiki.items.filter((x) => baseName(x.name) === key && x !== op);
  const built = build(op, i + 1, variants);
  if (!built) { console.log(`× 対応する記事が見つからない: ${op.name}`); return; }
  seen.add(key);
  fs.writeFileSync(built.file, built.text);
  n += 1;
});
console.log(`オペレーター記事 ${n} 本を書き出しました`);
