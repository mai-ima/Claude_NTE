/**
 * localStorage ベースの簡易ストア。
 * - 個人メモ / ツールの状態を端末内に保存する副レイヤ。
 * - try-catch で保護し、容量超過・パース失敗時も UI を壊さない。
 * - エクスポート/インポートで端末間バックアップ可能。
 */

export const STORE_PREFIX = 'nte.';
export const SCHEMA_VERSION = 1;

function key(name: string): string {
  return `${STORE_PREFIX}${name}`;
}

export function load<T>(name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key(name));
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[store] load failed: ${name}`, err);
    return fallback;
  }
}

export function save<T>(name: string, value: T): boolean {
  try {
    localStorage.setItem(key(name), JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`[store] save failed: ${name}`, err);
    return false;
  }
}

export function remove(name: string): void {
  try {
    localStorage.removeItem(key(name));
  } catch {
    /* noop */
  }
}

/** nte.* の全データを集めてエクスポート用オブジェクトにする */
export function exportAll(): { schemaVersion: number; exportedAt: string; data: Record<string, unknown> } {
  const data: Record<string, unknown> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(STORE_PREFIX)) continue;
      const raw = localStorage.getItem(k);
      if (raw == null) continue;
      try {
        data[k] = JSON.parse(raw);
      } catch {
        data[k] = raw;
      }
    }
  } catch (err) {
    console.warn('[store] export failed', err);
  }
  return { schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), data };
}

export interface ImportResult {
  ok: boolean;
  imported: number;
  error?: string;
}

/** エクスポートJSONを検証して取り込む */
export function importAll(json: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, imported: 0, error: 'JSONとして解析できませんでした。' };
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('data' in parsed) ||
    typeof (parsed as { data: unknown }).data !== 'object'
  ) {
    return { ok: false, imported: 0, error: 'バックアップ形式が正しくありません。' };
  }
  const data = (parsed as { data: Record<string, unknown> }).data;
  let imported = 0;
  try {
    for (const [k, v] of Object.entries(data)) {
      if (!k.startsWith(STORE_PREFIX)) continue;
      localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
      imported++;
    }
  } catch (err) {
    return { ok: false, imported, error: `保存に失敗しました（容量超過の可能性）: ${String(err)}` };
  }
  return { ok: true, imported };
}

/** nte.* を全消去（テーマ設定は保持） */
export function clearAll(): number {
  const toRemove: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORE_PREFIX) && k !== 'nte.theme') toRemove.push(k);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* noop */
  }
  return toRemove.length;
}

/** 一意なIDを生成 */
export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
