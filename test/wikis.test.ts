import { describe, it, expect } from 'vitest';
import {
  WIKIS,
  WIKI_LIST,
  LIVE_WIKIS,
  DEFAULT_WIKI,
  wiki,
  wikiOfCollection,
  wikiOfPath,
} from '../src/lib/wikis';
import { SECTIONS, ALPHA_SECTIONS, ENDFIELD_SECTIONS, sectionByCollection } from '../src/lib/nav';

describe('wiki レジストリ', () => {
  it('既定は NTE で、ルート（base=""）に置かれる', () => {
    expect(DEFAULT_WIKI).toBe('nte');
    expect(wiki().id).toBe('nte');
    expect(wiki().base).toBe('');
  });

  it('未知の id は既定 wiki にフォールバックする', () => {
    // @ts-expect-error 実行時の安全網を確認する
    expect(wiki('unknown').id).toBe('nte');
  });

  it('切替UIの一覧はルート wiki が先頭', () => {
    expect(WIKI_LIST[0].id).toBe('nte');
    expect(WIKI_LIST.map((w) => w.id)).toContain('alpha');
  });

  it('運用中だけを絞った一覧には準備中とサンプルが入らない', () => {
    // フッターの羅列などで使う。全6件を並べると横に溢れるため運用中だけにしている。
    for (const w of LIVE_WIKIS) expect(w.kind ?? 'live').toBe('live');
    expect(LIVE_WIKIS.map((w) => w.id)).not.toContain('alpha');
  });
});

describe('準備中（planned）の wiki', () => {
  const planned = WIKI_LIST.filter((w) => w.kind === 'planned');

  it('原神・鳴潮・崩壊：スターレイルの3つが準備中になっている', () => {
    expect(planned.map((w) => w.id).sort()).toEqual(['genshin', 'hsr', 'wuwa']);
  });

  it('記事コレクションを持たない（ページはトップ1枚だけ）', () => {
    for (const w of planned) expect(w.sections).toHaveLength(0);
  });

  it('公式サイトの URL を持つ（中身が無いぶん、公式へ案内する）', () => {
    for (const w of planned) {
      expect(w.officialUrl, `${w.id} に officialUrl がありません`).toMatch(/^https:\/\//);
    }
  });

  it('権利者名を持つ（非公式ファンサイトとして必ず明記する）', () => {
    for (const w of planned) expect(w.rightsHolder).toBeTruthy();
  });

  it('ナビは自分自身のホームだけを指す', () => {
    for (const w of planned) {
      for (const item of [...w.primaryNav, ...w.bottomNav]) {
        expect(item.href).toBe(`${w.base}/`);
      }
    }
  });
});

describe('アークナイツ：エンドフィールド wiki', () => {
  it('URL はすべて /endfield/ 配下に閉じている', () => {
    for (const s of WIKIS.endfield.sections) {
      expect(s.href.startsWith('/endfield/')).toBe(true);
    }
  });

  it('セクションには実ディレクトリ名（dir）がある', () => {
    for (const s of WIKIS.endfield.sections) {
      expect(s.dir).toBeTruthy();
      expect(s.dir).not.toBe(s.collection); // キャメルではなくケバブのディレクトリ
      expect(s.dir!.startsWith('endfield-')).toBe(true);
    }
  });

  it('コレクションから所属 wiki を引ける', () => {
    expect(wikiOfCollection('endfieldOperators').id).toBe('endfield');
    expect(wikiOfCollection('endfieldIndustry').id).toBe('endfield');
  });

  it('パスから wiki を判定できる', () => {
    expect(wikiOfPath('/endfield/').id).toBe('endfield');
    expect(wikiOfPath('/endfield/operators/foo/').id).toBe('endfield');
  });
});

describe('wiki 間の分離', () => {
  it('コレクション名は wiki をまたいで重複しない', () => {
    const all = WIKI_LIST.flatMap((w) => w.sections.map((s) => s.collection));
    expect(new Set(all).size).toBe(all.length);
  });

  it('αテストの URL はすべて /alpha/ 配下に閉じている', () => {
    for (const s of WIKIS.alpha.sections) {
      expect(s.href.startsWith('/alpha/')).toBe(true);
    }
  });

  it('NTE の URL は /alpha/ 配下に入らない', () => {
    for (const s of WIKIS.nte.sections) {
      expect(s.href.startsWith('/alpha/')).toBe(false);
    }
  });

  it('コレクションから所属 wiki を引ける', () => {
    expect(wikiOfCollection('characters').id).toBe('nte');
    expect(wikiOfCollection('alphaCharacters').id).toBe('alpha');
    // 未登録のコレクションは既定 wiki 扱い
    expect(wikiOfCollection('nope').id).toBe('nte');
  });

  it('パスから wiki を判定できる（base 付きでも動く）', () => {
    expect(wikiOfPath('/characters/zanko/').id).toBe('nte');
    expect(wikiOfPath('/alpha/characters/sample-alpha/').id).toBe('alpha');
    expect(wikiOfPath('/alpha/').id).toBe('alpha');
    expect(wikiOfPath('/claude_nte/alpha/terms/').id).toBe('alpha');
    expect(wikiOfPath('/').id).toBe('nte');
  });
});

describe('セクション定義', () => {
  it('sectionByCollection は全 wiki を横断して引ける', () => {
    expect(sectionByCollection('terms')?.href).toBe('/terms/');
    expect(sectionByCollection('endfieldTerms')?.href).toBe('/endfield/terms/');
    expect(sectionByCollection('alphaTerms')?.href).toBe('/alpha/terms/');
  });

  it('エンドフィールドのセクションは12種そろっている', () => {
    expect(ENDFIELD_SECTIONS).toHaveLength(12);
  });

  it('αテストのセクションには実ディレクトリ名（dir）がある', () => {
    for (const s of ALPHA_SECTIONS) {
      expect(s.dir).toBeTruthy();
      expect(s.dir).not.toBe(s.collection); // キャメルではなくケバブのディレクトリ
    }
  });

  it('NTE のセクションはディレクトリ名＝コレクション名（dir 省略）', () => {
    for (const s of SECTIONS) {
      expect(s.dir).toBeUndefined();
    }
  });

  it('各 wiki のナビは自分の wiki の中だけを指す（他 wiki のページを混ぜない）', () => {
    // ここが緩いと、α のタブやナビから NTE 側へ飛ばされる事故が起きる（実際に起きた）。
    for (const w of WIKI_LIST) {
      for (const item of [...w.primaryNav, ...w.bottomNav]) {
        expect(wikiOfPath(item.href).id, `${w.id} のナビ: ${item.href}`).toBe(w.id);
      }
    }
  });

  it('α のナビに NTE 専用ページ（/settings/ など）が混ざっていない', () => {
    const alphaHrefs = [...WIKIS.alpha.primaryNav, ...WIKIS.alpha.bottomNav].map((n) => n.href);
    for (const href of alphaHrefs) {
      expect(href.startsWith('/alpha/'), `α のナビ: ${href}`).toBe(true);
    }
  });
});
