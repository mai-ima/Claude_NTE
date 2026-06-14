import { describe, it, expect } from 'vitest';
import { phaseOf, hrefOf } from '../src/lib/content';

const DAY = 86_400_000;

describe('hrefOf', () => {
  it('コレクション内リンクを組む（base=/）', () => {
    expect(hrefOf('terms', 'annulith')).toBe('/terms/annulith/');
  });
});

describe('phaseOf', () => {
  const now = 1_000 * DAY; // 適当な基準時刻

  it('開始前は upcoming で残り日数を返す', () => {
    const r = phaseOf(now, now + 3 * DAY, now + 10 * DAY);
    expect(r.phase).toBe('upcoming');
    expect(r.daysLeft).toBe(3);
  });

  it('開催中は current で終了までの日数', () => {
    const r = phaseOf(now, now - 2 * DAY, now + 5 * DAY);
    expect(r.phase).toBe('current');
    expect(r.daysLeft).toBe(5);
  });

  it('終了時刻以降は ended', () => {
    const r = phaseOf(now, now - 10 * DAY, now - DAY);
    expect(r.phase).toBe('ended');
  });

  it('終了未設定の開催中は daysLeft なし', () => {
    const r = phaseOf(now, now - DAY, null);
    expect(r.phase).toBe('current');
    expect(r.daysLeft).toBeUndefined();
  });

  it('開始未設定・終了未設定は常に current', () => {
    expect(phaseOf(now, null, null).phase).toBe('current');
  });
});
