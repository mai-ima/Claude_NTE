/** チェックリスト/進行管理: デイリー・収集・育成の進捗管理。 */
import { useState } from 'preact/hooks';
import { useStore } from './useStore';
import { uid } from '../../lib/store';

interface Item {
  id: string;
  text: string;
  done: boolean;
}

export default function Checklist() {
  const [items, setItems] = useStore<Item[]>('tool.checklist', []);
  const [draft, setDraft] = useState('');

  const doneCount = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  function add() {
    const text = draft.trim();
    if (!text) return;
    setItems([...items, { id: uid(), text, done: false }]);
    setDraft('');
  }
  function toggle(id: string) {
    setItems(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  }
  function del(id: string) {
    setItems(items.filter((i) => i.id !== id));
  }
  function resetChecks() {
    setItems(items.map((i) => ({ ...i, done: false })));
  }

  return (
    <div class="tool">
      <div class="row" style={{ gap: '8px' }}>
        <input
          class="input"
          placeholder="項目を追加（例: デイリー消化）"
          value={draft}
          onInput={(e) => setDraft((e.target as HTMLInputElement).value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button class="btn btn-primary" type="button" onClick={add} disabled={!draft.trim()}>
          追加
        </button>
      </div>

      {items.length > 0 && (
        <div class="stack" style={{ gap: '6px' }}>
          <div class="row row-between text-sm muted">
            <span>
              {doneCount} / {items.length} 完了
            </span>
            <span>{pct}%</span>
          </div>
          <div class="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p class="empty">項目がありません。追加して進捗を管理しましょう。</p>
      ) : (
        <ul class="list-reset">
          {items.map((i) => (
            <li key={i.id} class={`check-item${i.done ? ' done' : ''}`}>
              <input
                type="checkbox"
                id={`chk-${i.id}`}
                checked={i.done}
                onChange={() => toggle(i.id)}
              />
              <label for={`chk-${i.id}`}>{i.text}</label>
              <button class="btn btn-sm btn-ghost btn-danger" type="button" onClick={() => del(i.id)} aria-label="削除">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <div class="row" style={{ justifyContent: 'flex-end' }}>
          <button class="btn btn-sm" type="button" onClick={resetChecks}>
            チェックをリセット
          </button>
        </div>
      )}
    </div>
  );
}
