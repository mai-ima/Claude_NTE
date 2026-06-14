import { describe, it, expect } from 'vitest';
import { cssVars } from '../src/lib/css';
import { editUrl, editUrlFor } from '../src/lib/edit-url';
import { uid, importAll, save, load } from '../src/lib/store';

describe('cssVars', () => {
  it('base とカスタムプロパティをマージ', () => {
    expect(cssVars({ '--el': '#fff' }, { margin: '0' })).toEqual({ margin: '0', '--el': '#fff' });
  });
  it('base 省略時はカスタムプロパティのみ', () => {
    expect(cssVars({ '--x': 1 })).toEqual({ '--x': 1 });
  });
});

describe('edit-url', () => {
  it('ファイルパスから GitHub 編集URLを組む', () => {
    expect(editUrl('src/content/terms/x.md')).toBe(
      'https://github.com/mai-ima/claude_nte/edit/main/src/content/terms/x.md',
    );
  });
  it('コレクション＋slug の既定（.md）', () => {
    expect(editUrlFor('terms', 'x')).toContain('src/content/terms/x.md');
  });
  it('拡張子を指定できる', () => {
    expect(editUrlFor('story', 'main', 'mdx')).toContain('src/content/story/main.mdx');
  });
});

describe('store', () => {
  it('uid はユニークな文字列を返す', () => {
    const a = uid();
    const b = uid();
    expect(typeof a).toBe('string');
    expect(a).not.toBe(b);
  });

  it('save→load で値が往復する', () => {
    save('test-key', { n: 42 });
    expect(load('test-key', { n: 0 })).toEqual({ n: 42 });
  });

  it('importAll は不正JSONを拒否する', () => {
    const res = importAll('not json');
    expect(res.ok).toBe(false);
  });

  it('importAll は正しい形を取り込む', () => {
    const payload = JSON.stringify({
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      data: { 'nte.demo': JSON.stringify({ a: 1 }) },
    });
    const res = importAll(payload);
    expect(res.ok).toBe(true);
  });
});
