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

export function useStore<T>(name: string, initial: T): [T, (v: Updater<T>) => void] {
  const [value, setValue] = useState<T>(initial);
  const valueRef = useRef<T>(initial);
  valueRef.current = value;

  useEffect(() => {
    // マウント時に最新値を読み込む（SSR初期値からの引き継ぎ）
    setValue(load<T>(name, initial));

    // 同一ページの他アイランドからの更新通知
    const onSync = (e: Event) => {
      const detail = (e as CustomEvent).detail as { key: string; value: unknown };
      if (detail?.key === name) setValue(detail.value as T);
    };
    // 別タブ（同一オリジン）からの更新
    const onStorage = (e: StorageEvent) => {
      if (e.key === `${STORE_PREFIX}${name}`) setValue(load<T>(name, initial));
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
    setValue(next);
    save(name, next);
    // 他インスタンスへ通知（自分は既に setValue 済みなのでループしない）
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { key: name, value: next } }));
  };

  return [value, set];
}
