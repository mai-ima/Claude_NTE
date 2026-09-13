/**
 * 利用者ごとのデータ（お気に入り・最近見たページ）。
 *
 * ★ なぜ store.ts と分けるのか
 *   `store.ts` は「この端末の中だけ」の素朴な保存。こちらは**将来サーバーへ移す前提**の層で、
 *   読み書きの入口を1か所（`source`）に絞ってある。Neon などを入れるときは
 *   `setSource()` に別の実装を渡すだけでよく、**呼び出し側（画面）は書き換えない**。
 *
 * ★ いまの既定は localStorage
 *   サーバーを持たない静的サイトなので、**この端末の中だけ**に残る。
 *   ほかの端末には出ていかないし、こちらから送信もしない（プライバシーポリシーのとおり）。
 *
 * ★ API を Promise にしてある理由
 *   localStorage は同期だがネットワークは非同期。あとから差し替えたときに
 *   呼び出し側の形が変わらないよう、**最初から非同期の顔**にしてある。
 */
import { load, save } from './store';

/** 保存する「ページ1件」の最小の情報。表示に必要なものだけを持つ */
export interface ItemRef {
  /** 一意キー。`<コレクション>:<記事ID>`（例: `characters:mint`） */
  key: string;
  /** 画面に出す名前 */
  title: string;
  /** 行き先 */
  href: string;
  /** 種類（一覧の絞り込みに使う。例: characters / terms / guides） */
  kind: string;
  /** どの wiki のものか（`nte` / `endfield` など） */
  wiki: string;
  /** 記録した時刻（ISO 文字列） */
  at: string;
}

export const FAVORITES_NAME = 'favorites';
export const HISTORY_NAME = 'history';

/** 履歴の上限。増やしすぎると localStorage を圧迫するので絞る */
export const HISTORY_LIMIT = 30;

/**
 * 保存先の差し替え口。**ここだけを入れ替えれば保存先が変わる**。
 * 実装は「名前で読み書きする」だけに絞ってあり、DB でも HTTP でも同じ形で書ける。
 */
export interface UserDataSource {
  /** 保存先の名前（管理ページに出す） */
  label: string;
  read<T>(name: string, fallback: T): Promise<T>;
  write<T>(name: string, value: T): Promise<boolean>;
}

/** 既定。この端末の localStorage に置く */
export const localSource: UserDataSource = {
  label: 'この端末',
  async read<T>(name: string, fallback: T): Promise<T> {
    return load<T>(name, fallback);
  },
  async write<T>(name: string, value: T): Promise<boolean> {
    return save<T>(name, value);
  },
};

let source: UserDataSource = localSource;

/** 保存先を差し替える（サーバーを入れたときに1回だけ呼ぶ） */
export function setSource(next: UserDataSource): void {
  source = next;
}

/** いまの保存先（管理ページの表示に使う） */
export function currentSource(): UserDataSource {
  return source;
}

/** 配列で来るはずの値を安全に整える（壊れた保存が入っていても画面を壊さない） */
function asItems(value: unknown): ItemRef[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is ItemRef =>
      !!v &&
      typeof v === 'object' &&
      typeof (v as ItemRef).key === 'string' &&
      typeof (v as ItemRef).href === 'string' &&
      typeof (v as ItemRef).title === 'string',
  );
}

/* ---- お気に入り ------------------------------------------------------- */

export async function getFavorites(): Promise<ItemRef[]> {
  return asItems(await source.read<ItemRef[]>(FAVORITES_NAME, []));
}

export async function isFavorite(key: string): Promise<boolean> {
  return (await getFavorites()).some((f) => f.key === key);
}

/** 入っていれば外し、無ければ足す。**足したかどうか**を返す */
export async function toggleFavorite(item: ItemRef): Promise<boolean> {
  const list = await getFavorites();
  const i = list.findIndex((f) => f.key === item.key);
  if (i >= 0) {
    list.splice(i, 1);
    await source.write(FAVORITES_NAME, list);
    return false;
  }
  // 新しいものを先頭に置く（一覧は上から新しい順）
  list.unshift({ ...item, at: new Date().toISOString() });
  await source.write(FAVORITES_NAME, list);
  return true;
}

export async function removeFavorite(key: string): Promise<void> {
  const list = (await getFavorites()).filter((f) => f.key !== key);
  await source.write(FAVORITES_NAME, list);
}

/* ---- 最近見たページ --------------------------------------------------- */

export async function getHistory(): Promise<ItemRef[]> {
  return asItems(await source.read<ItemRef[]>(HISTORY_NAME, []));
}

/**
 * 1件を履歴の先頭へ積む。同じページは**重ねずに1件へまとめる**（時刻だけ更新）。
 * 上限を超えた分は古いものから捨てる。
 */
export async function pushHistory(item: ItemRef): Promise<void> {
  const list = (await getHistory()).filter((h) => h.key !== item.key);
  list.unshift({ ...item, at: new Date().toISOString() });
  await source.write(HISTORY_NAME, list.slice(0, HISTORY_LIMIT));
}

export async function clearHistory(): Promise<void> {
  await source.write(HISTORY_NAME, []);
}

/* ---- 表示の助け ------------------------------------------------------- */

/** 「2時間前」のような相対表記。参考にした画面もこの形 */
export function relativeTime(iso: string, now = Date.now()): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const sec = Math.max(0, Math.floor((now - t) / 1000));
  if (sec < 60) return 'さっき';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}分前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}時間前`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day}日前`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month}か月前`;
  return `${Math.floor(month / 12)}年前`;
}
