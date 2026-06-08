/** 記事ごとの個人メモ（localStorage）。再ビルド不要でスマホからその場編集できる副レイヤ。 */
import { useState } from 'preact/hooks';
import { useStore } from './tools/useStore';

interface Props {
  articleId: string;
}

export default function PersonalNote({ articleId }: Props) {
  const [text, setText] = useStore<string>(`note.${articleId}`, '');
  const [open, setOpen] = useState(false);

  return (
    <section class="card card-pad" style={{ marginTop: '32px' }}>
      <button
        class="row row-between"
        type="button"
        style={{ width: '100%', background: 'transparent', border: 0, padding: 0 }}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span style={{ fontWeight: 700 }}>個人メモ</span>
        <span class="muted text-sm">{open ? '閉じる' : text ? '保存済み ・ 開く' : '開く'}</span>
      </button>
      {open && (
        <div style={{ marginTop: '12px' }}>
          <textarea
            class="textarea"
            placeholder="この記事に関する自分用のメモ（この端末にのみ保存されます）"
            value={text}
            onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
          />
          <p class="hint" style={{ marginTop: '6px' }}>
            ※ 端末内（localStorage）に自動保存。設定ページからエクスポートでバックアップできます。
          </p>
        </div>
      )}
    </section>
  );
}
