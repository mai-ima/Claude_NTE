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
    const parsed: unknown = JSON.parse(raw);
    // 形チェック: 旧スキーマやインポートで形の違う値が入っていても島ごとクラッシュさせない。
    // オブジェクトは fallback とマージして欠落キーを既定値で補う。
    if (Array.isArray(fallback)) return Array.isArray(parsed) ? (parsed as T) : fallback;
    if (fallback !== null && typeof fallback === 'object') {
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return fallback;
      return { ...(fallback as object), ...(parsed as object) } as T;
    }
    if (typeof parsed !== typeof fallback) return fallback;
    return parsed as T;
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

/**
 * nte.* の全データを集めてエクスポート用オブジェクトにする。
 * 値は localStorage の生文字列をそのまま持ち回る（ラウンドトリップ安全）。
 * JSON.parse して保持すると、インポート時に文字列ストア（個人メモ等）が
 * 引用符なしで書き戻されて読み込み不能になるため、生表現を崩さない。
 */
export function exportAll(): { schemaVersion: number; exportedAt: string; data: Record<string, unknown> } {
  const data: Record<string, unknown> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(STORE_PREFIX)) continue;
      const raw = localStorage.getItem(k);
      if (raw == null) continue;
      data[k] = raw;
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
    typeof (parsed as { data: unknown }).data !== 'object' ||
    (parsed as { data: unknown }).data === null
  ) {
    return { ok: false, imported: 0, error: 'バックアップ形式が正しくありません。' };
  }
  const data = (parsed as { data: Record<string, unknown> }).data;
  let imported = 0;
  try {
    for (const [k, v] of Object.entries(data)) {
      if (!k.startsWith(STORE_PREFIX)) continue;
      // exportAll は生文字列を格納する。文字列はそのまま書き戻し、
      // 旧バックアップ（パース済みの値）が来た場合のみ JSON 文字列化する。
      localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
      imported++;
    }
  } catch (err) {
    return { ok: false, imported, error: `保存に失敗しました（容量超過の可能性）: ${String(err)}` };
  }
  return { ok: true, imported };
}

/** 初期化しても残す「設定」キー（テーマ・UIモード・表示の追加設定）。
 *  メモ/ツール等の「データ」だけを消し、表示の好みは保持する。 */
const KEEP_ON_CLEAR = new Set([
  'nte.theme',
  'nte.ui',
  'nte.motion',
  'nte.autoterm',
  'nte.spoiler',
  'nte.width',
  'nte.draftmark',
]);

/** nte.* のデータを全消去（テーマ・UI・表示設定は保持） */
export function clearAll(): number {
  const toRemove: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORE_PREFIX) && !KEEP_ON_CLEAR.has(k)) toRemove.push(k);
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
