/** メモ/ノート: 自由記述の走り書きを複数保存（localStorage）。 */
import { useState } from 'preact/hooks';
import { useStore } from './useStore';
import { uid } from '../../lib/store';

interface Note {
  id: string;
  text: string;
  updated: number;
}

export default function Notes() {
  const [notes, setNotes] = useStore<Note[]>('tool.notes', []);
  const [draft, setDraft] = useState('');

  function add() {
    const text = draft.trim();
    if (!text) return;
    setNotes([{ id: uid(), text, updated: Date.now() }, ...notes]);
    setDraft('');
  }

  function update(id: string, text: string) {
    setNotes(notes.map((n) => (n.id === id ? { ...n, text, updated: Date.now() } : n)));
  }

  function del(id: string) {
    setNotes(notes.filter((n) => n.id !== id));
  }

  return (
    <div class="tool">
      <div class="field" style={{ marginBottom: 0 }}>
        <label for="note-draft">新しいメモ</label>
        <textarea
          id="note-draft"
          class="textarea"
          placeholder="攻略の覚え書き、やることなど…"
          value={draft}
          onInput={(e) => setDraft((e.target as HTMLTextAreaElement).value)}
        />
      </div>
      <div class="row row-between">
        <span class="muted text-sm">{notes.length} 件のメモ</span>
        <button class="btn btn-primary" type="button" onClick={add} disabled={!draft.trim()}>
          追加
        </button>
      </div>

      {notes.length === 0 ? (
        <p class="empty">まだメモはありません。上から追加してください。</p>
      ) : (
        <ul class="list-reset stack">
          {notes.map((n) => (
            <li key={n.id} class="card card-pad">
              <textarea
                class="textarea"
                style={{ minHeight: '72px' }}
                value={n.text}
                onInput={(e) => update(n.id, (e.target as HTMLTextAreaElement).value)}
              />
              <div class="row row-between" style={{ marginTop: '8px' }}>
                <span class="muted text-sm">
                  {new Date(n.updated).toLocaleString('ja-JP')}
                </span>
                <button class="btn btn-sm btn-danger" type="button" onClick={() => del(n.id)}>
                  削除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
