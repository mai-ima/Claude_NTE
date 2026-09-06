import { describe, it, expect } from 'vitest';
import {
  WIKIS,
  WIKI_LIST,
  DEFAULT_WIKI,
  wiki,
  wikiOfCollection,
  wikiOfPath,
} from '../src/lib/wikis';
import { SECTIONS, ALPHA_SECTIONS, sectionByCollection } from '../src/lib/nav';

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
  it('sectionByCollection は両 wiki を横断して引ける', () => {
    expect(sectionByCollection('terms')?.href).toBe('/terms/');
    expect(sectionByCollection('alphaTerms')?.href).toBe('/alpha/terms/');
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
