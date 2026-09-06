import { useEffect, useRef, useState } from 'preact/hooks';
import { load, save, STORE_PREFIX } from '../../lib/store';

/**
 * localStorage と同期する useState。
 *
 * 同一ページに複数のアイランドが乗り、同じキーを参照しても競合しないように、
 * 書き込み時に window 上のカスタムイベントで他インスタンスへ通知して状態を揃える。
 * （アイランドはそれぞれ独立に hydrate されるが window は共有されるため確実に届く）
 * さらに別タブからの変更は native の `storage` イベントで取り込む。
 */
const SYNC_EVENT = 'nte:store-sync';

type Updater<T> = T | ((prev: T) => T);

interface Options {
  /**
   * localStorage への**書き込みだけ**を遅らせるミリ秒。画面の表示は即座に変わる。
   *
   * メモのように1文字ごとに更新が走るものは、そのたびに全件を JSON 化して
   * localStorage に書き、他アイランドへ通知していた。長文だと打鍵のたびに重くなる。
   *
   * 遅延中にページを離れると保存されないので、**アンマウントと `pagehide` で必ず書き出す**。
   */
  debounceMs?: number;
}

export function useStore<T>(
  name: string,
  initial: T,
  opts: Options = {},
): [T, (v: Updater<T>) => void] {
  const [value, setValue] = useState<T>(initial);
  const valueRef = useRef<T>(initial);
  valueRef.current = value;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 書き出し待ちの値。null は「待ちなし」 */
  const pending = useRef<{ v: T } | null>(null);

  /** 待っている値があれば今すぐ localStorage へ書き、他インスタンスへ知らせる */
  const flush = useRef(() => {});
  flush.current = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (!pending.current) return;
    const v = pending.current.v;
    pending.current = null;
    save(name, v);
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { key: name, value: v } }));
  };

  // 遅延保存を使うときは、ページを離れる前に必ず書き出す。
  // `beforeunload` ではなく `pagehide` を使うのは、iOS Safari が
  // タブを閉じる/戻るときに beforeunload を飛ばすことがあるため。
  useEffect(() => {
    if (!opts.debounceMs) return;
    const onHide = () => flush.current();
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onHide);
      flush.current(); // アンマウント時にも書き出す
    };
  }, [opts.debounceMs]);

  useEffect(() => {
    // マウント時に最新値を読み込む（SSR初期値からの引き継ぎ）
    setValue(load<T>(name, initial));

    // 同一ページの他アイランドからの更新通知
    const onSync = (e: Event) => {
      const detail = (e as CustomEvent).detail as { key: string; value: unknown };
      if (detail?.key === name) {
        valueRef.current = detail.value as T;
        setValue(detail.value as T);
      }
    };
    // 別タブ（同一オリジン）からの更新
    const onStorage = (e: StorageEvent) => {
      if (e.key === `${STORE_PREFIX}${name}`) {
        const next = load<T>(name, initial);
        valueRef.current = next;
        setValue(next);
      }
    };

    window.addEventListener(SYNC_EVENT, onSync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(SYNC_EVENT, onSync);
      window.removeEventListener('storage', onStorage);
    };
    // initial は固定値想定なので依存に含めない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const set = (updater: Updater<T>) => {
    const next =
      typeof updater === 'function' ? (updater as (prev: T) => T)(valueRef.current) : updater;
    valueRef.current = next;
    setValue(next); // 画面は常に即座に反映する
    if (!opts.debounceMs) {
      save(name, next);
      // 他インスタンスへ通知（自分は既に setValue 済みなのでループしない）
      window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { key: name, value: next } }));
      return;
    }
    pending.current = { v: next };
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => flush.current(), opts.debounceMs);
  };

  return [value, set];
}
