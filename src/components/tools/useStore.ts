import { useEffect, useRef, useState } from 'preact/hooks';
import { load, save } from '../../lib/store';

/** localStorage と同期する useState。SSR時は初期値、マウント後に読み込む。 */
export function useStore<T>(name: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [value, setValue] = useState<T>(initial);
  const loaded = useRef(false);

  useEffect(() => {
    setValue(load<T>(name, initial));
    loaded.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  useEffect(() => {
    if (loaded.current) save(name, value);
  }, [name, value]);

  return [value, setValue];
}
