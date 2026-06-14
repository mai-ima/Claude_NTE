import { describe, it, expect } from 'vitest';
import {
  elementMeta,
  roleMeta,
  reactionsFor,
  sectionByCollection,
  ELEMENT_RING,
  DUO_REACTIONS,
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
