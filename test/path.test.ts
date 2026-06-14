import { describe, it, expect } from 'vitest';
import { withBase, activeHref } from '../src/lib/path';

// テストは base="/"（Vercel 本番設定）前提。

describe('withBase', () => {
  it('ディレクトリURLは末尾スラッシュを保つ', () => {
    expect(withBase('/characters/')).toBe('/characters/');
  });
  it('末尾スラッシュが無ければ付与する', () => {
    expect(withBase('/characters')).toBe('/characters/');
  });
  it('拡張子付き（アセット）は末尾スラッシュを付けない', () => {
    expect(withBase('/og/x.png')).toBe('/og/x.png');
  });
  it('ハッシュ/クエリはそのまま', () => {
    expect(withBase('/a/#sec')).toBe('/a/#sec');
  });
});

describe('activeHref', () => {
  it('最長一致を選ぶ', () => {
    expect(activeHref('/tools/tier-list/', ['/tools/', '/tools/tier-list/'])).toBe(
      '/tools/tier-list/',
    );
  });
  it('ホームは完全一致のときだけ', () => {
    expect(activeHref('/', ['/', '/tools/'])).toBe('/');
    expect(activeHref('/tools/', ['/', '/tools/'])).toBe('/tools/');
  });
  it('一致なしは null', () => {
    expect(activeHref('/about/', ['/tools/', '/characters/'])).toBeNull();
  });
});
