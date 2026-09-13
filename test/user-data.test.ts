/**
 * 利用者ごとのデータ（お気に入り・最近見たページ）の検査。
 *
 * 保存先は差し替えられる作りなので、テストでは**その場限りの入れ物**を差し込む。
 * localStorage を用意しなくても、規則（重ねない・上限で切る・入れ直しで外れる）を確かめられる。
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  setSource,
  localSource,
  toggleFavorite,
  getFavorites,
  isFavorite,
  removeFavorite,
  pushHistory,
  getHistory,
  clearHistory,
  relativeTime,
  HISTORY_LIMIT,
  type UserDataSource,
  type ItemRef,
} from '../src/lib/user-data';

/** その場限りの保存先。Map に入れるだけ */
function memorySource(): UserDataSource {
  const box = new Map<string, unknown>();
  return {
    label: 'テスト',
    async read<T>(name: string, fallback: T): Promise<T> {
      return (box.has(name) ? (box.get(name) as T) : fallback);
    },
    async write<T>(name: string, value: T): Promise<boolean> {
      box.set(name, value);
      return true;
    },
  };
}

const item = (id: string): ItemRef => ({
  key: `characters:${id}`,
  title: id,
  href: `/characters/${id}/`,
  kind: 'characters',
  wiki: 'nte',
  at: new Date().toISOString(),
});

describe('user-data', () => {
  beforeEach(() => {
    setSource(memorySource());
  });

  it('保存を押すと入り、もう一度押すと外れる', async () => {
    expect(await toggleFavorite(item('mint'))).toBe(true);
    expect(await isFavorite('characters:mint')).toBe(true);
    expect(await toggleFavorite(item('mint'))).toBe(false);
    expect(await isFavorite('characters:mint')).toBe(false);
  });

  it('保存は新しいものが先頭に来る', async () => {
    await toggleFavorite(item('a'));
    await toggleFavorite(item('b'));
    const list = await getFavorites();
    expect(list.map((f) => f.title)).toEqual(['b', 'a']);
  });

  it('指定した1件だけを外す', async () => {
    await toggleFavorite(item('a'));
    await toggleFavorite(item('b'));
    await removeFavorite('characters:a');
    expect((await getFavorites()).map((f) => f.title)).toEqual(['b']);
  });

  it('同じページを何度見ても履歴は1件にまとまる', async () => {
    await pushHistory(item('mint'));
    await pushHistory(item('zero'));
    await pushHistory(item('mint'));
    const list = await getHistory();
    expect(list).toHaveLength(2);
    // 最後に見たものが先頭
    expect(list[0].title).toBe('mint');
  });

  it('履歴は上限を超えたら古いものから捨てる', async () => {
    for (let i = 0; i < HISTORY_LIMIT + 5; i++) await pushHistory(item(`c${i}`));
    const list = await getHistory();
    expect(list).toHaveLength(HISTORY_LIMIT);
    // いちばん新しいものが残り、最初の方は消えている
    expect(list[0].title).toBe(`c${HISTORY_LIMIT + 4}`);
    expect(list.some((h) => h.title === 'c0')).toBe(false);
  });

  it('履歴を消せる', async () => {
    await pushHistory(item('mint'));
    await clearHistory();
    expect(await getHistory()).toEqual([]);
  });

  it('壊れた保存が入っていても空として扱う（画面を壊さない）', async () => {
    const broken: UserDataSource = {
      label: '壊れた',
      async read<T>(_name: string, _fallback: T): Promise<T> {
        return 'これは配列ではない' as unknown as T;
      },
      async write<T>(_name: string, _value: T): Promise<boolean> {
        return true;
      },
    };
    setSource(broken);
    expect(await getFavorites()).toEqual([]);
    expect(await getHistory()).toEqual([]);
  });

  it('相対表記は境目で切り替わる', () => {
    const now = Date.parse('2026-09-13T12:00:00Z');
    const ago = (ms: number) => new Date(now - ms).toISOString();
    expect(relativeTime(ago(30 * 1000), now)).toBe('さっき');
    expect(relativeTime(ago(5 * 60 * 1000), now)).toBe('5分前');
    expect(relativeTime(ago(3 * 3600 * 1000), now)).toBe('3時間前');
    expect(relativeTime(ago(2 * 86400 * 1000), now)).toBe('2日前');
    expect(relativeTime('これは日付ではない', now)).toBe('');
  });

  it('既定の保存先はこの端末', () => {
    expect(localSource.label).toBe('この端末');
  });
});
