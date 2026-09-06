import { describe, it, expect } from 'vitest';
import {
  elementMeta,
  roleMeta,
  reactionsFor,
  sectionByCollection,
  ELEMENT_RING,
  DUO_REACTIONS,
  TRIO_REACTIONS,
  ELEMENT_META,
} from '../src/lib/nav';

describe('elementMeta', () => {
  it('日本版の属性名を返す', () => {
    expect(elementMeta('Cosmos').label).toBe('光');
    expect(elementMeta('Psyche').label).toBe('魂');
  });
  it('未知の属性はそのままフォールバック', () => {
    const m = elementMeta('Unknown');
    expect(m.label).toBe('Unknown');
    expect(m.en).toBe('Unknown');
  });
});

describe('roleMeta', () => {
  it('既知ロールのラベルを返す', () => {
    expect(roleMeta('DPS').label).toContain('アタッカー');
  });
  it('未知ロールはフォールバック', () => {
    expect(roleMeta('Xyz').label).toBe('Xyz');
  });
});

describe('reactionsFor', () => {
  it('リング上の各属性はちょうど2つの隣接反応を持つ', () => {
    for (const el of ELEMENT_RING) {
      expect(reactionsFor(el)).toHaveLength(2);
    }
  });
  it('返す相手は DUO_REACTIONS と整合する', () => {
    const r = reactionsFor('Cosmos');
    const partners = r.map((x) => x.partner).sort();
    expect(partners).toEqual(['Anima', 'Lakshana']);
  });
  it('DUO_REACTIONS は6ペア（リング一周）', () => {
    expect(DUO_REACTIONS).toHaveLength(6);
  });
  it('すべての Duo 反応に日本語名がある（英語名だけで表示されないように）', () => {
    for (const r of DUO_REACTIONS) {
      expect(r.ja, `${r.name} に日本語名がない`).toBeTruthy();
      expect(r.effect, `${r.name} に効果の説明がない`).toBeTruthy();
    }
  });
});

/**
 * トリオ反応は以前、異能連環チェッカーとチームビルダーがそれぞれ別に持っていて、
 * 表記が食い違っていた（日本語名 vs 英語名）。nav.ts に集約したので、
 * ここが唯一の定義であることを守る。
 */
describe('TRIO_REACTIONS', () => {
  it('充蓄と失諧の2種類', () => {
    expect(TRIO_REACTIONS).toHaveLength(2);
    expect(TRIO_REACTIONS.map((t) => t.ja).sort()).toEqual(['充蓄', '失諧']);
  });
  it('各トリオは3属性で、すべて既知の属性', () => {
    for (const t of TRIO_REACTIONS) {
      expect(t.els).toHaveLength(3);
      expect(new Set(t.els).size, `${t.ja} の属性が重複している`).toBe(3);
      for (const el of t.els) {
        expect(ELEMENT_META[el], `${t.ja} に未知の属性 ${el}`).toBeDefined();
      }
    }
  });
  it('日本語名と効果の説明がある', () => {
    for (const t of TRIO_REACTIONS) {
      expect(t.ja).toBeTruthy();
      expect(t.effect).toBeTruthy();
    }
  });
});

describe('sectionByCollection', () => {
  it('既知コレクションのメタを返す', () => {
    expect(sectionByCollection('characters')?.label).toBe('キャラクター');
    expect(sectionByCollection('terms')?.href).toBe('/terms/');
  });
  it('未知コレクションは undefined', () => {
    expect(sectionByCollection('nope')).toBeUndefined();
  });
});
