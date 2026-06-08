/**
 * 育成・スタミナ計画ツール。
 * - キャラクターピクセル（戦闘スタミナ: 既定240 / 6分で1回復）の全回復時刻。
 * - アノマリーゾーン周回（1回 40 or 80）で「今いくつ回れるか」。
 * - デイリー/ウィークリーのタスク管理（端末内保存）。
 * 既定値は2026/6時点のコミュニティ情報。ゲーム内の最新値で上書きしてください。
 */
import { useEffect, useState } from 'preact/hooks';
import { useStore } from './useStore';
import { uid } from '../../lib/store';

interface Task {
  id: string;
  text: string;
  done: boolean;
  cycle: 'daily' | 'weekly';
}

const DEFAULT_TASKS: Task[] = [
  { id: 'd1', text: 'デイリーミッション消化', done: false, cycle: 'daily' },
  { id: 'd2', text: 'キャラクターピクセルを使い切る', done: false, cycle: 'daily' },
  { id: 'd3', text: 'シティスタミナで Fons 稼ぎ', done: false, cycle: 'daily' },
  { id: 'w1', text: 'アノマリーボスの週課報酬を回収', done: false, cycle: 'weekly' },
  { id: 'w2', text: 'シティスタミナを使い切る（週リセット）', done: false, cycle: 'weekly' },
  { id: 'w3', text: 'Beyond the Rails を進める', done: false, cycle: 'weekly' },
];

export default function Planner() {
  const [cur, setCur] = useStore<number>('tool.planner.pixels', 0);
  const [max, setMax] = useState(240);
  const [perMin, setPerMin] = useState(6);
  const [runCost, setRunCost] = useState(40);
  const [tasks, setTasks] = useStore<Task[]>('tool.planner.tasks', DEFAULT_TASKS);
  const [newTask, setNewTask] = useState('');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const c = Math.max(0, Math.floor(cur));
  const m = Math.max(0, Math.floor(max));
  const remaining = Math.max(0, m - c);
  const minutesToFull = perMin > 0 ? remaining * perMin : Infinity;
  const eta = isFinite(minutesToFull) ? new Date(now + minutesToFull * 60_000) : null;
  const runsNow = runCost > 0 ? Math.floor(c / runCost) : 0;

  const fmt = (min: number) => {
    if (!isFinite(min)) return '—';
    const h = Math.floor(min / 60);
    const mm = Math.round(min % 60);
    return h === 0 ? `${mm}分` : `${h}時間${mm}分`;
  };

  const toggle = (id: string) =>
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (id: string) => setTasks((p) => p.filter((t) => t.id !== id));
  const add = (cycle: 'daily' | 'weekly') => {
    const text = newTask.trim();
    if (!text) return;
    setTasks((p) => [...p, { id: uid(), text, done: false, cycle }]);
    setNewTask('');
  };
  const resetChecks = (cycle: 'daily' | 'weekly') =>
    setTasks((p) => p.map((t) => (t.cycle === cycle ? { ...t, done: false } : t)));

  const daily = tasks.filter((t) => t.cycle === 'daily');
  const weekly = tasks.filter((t) => t.cycle === 'weekly');

  return (
    <div class="tool">
      {/* スタミナ */}
      <div class="tool-result stack" style={{ gap: '10px' }}>
        <div class="row row-between">
          <div>
            <p class="muted text-sm mt-0">全回復までの時間</p>
            <p class="big">{c >= m ? '回復済み' : fmt(minutesToFull)}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p class="muted text-sm mt-0">今すぐ周回できる回数</p>
            <p class="big" style={{ fontSize: '1.6rem' }}>{runsNow} 回</p>
          </div>
        </div>
        {eta && c < m && (
          <div class="text-sm muted">
            全回復予定: <strong>{eta.toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
          </div>
        )}
      </div>

      <div class="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
        <label class="field" style={{ flex: '1 1 90px', marginBottom: 0 }}>
          <span class="text-sm">現在のピクセル</span>
          <input class="input" type="number" min={0} value={cur} onInput={(e) => setCur(Number((e.target as HTMLInputElement).value) || 0)} />
        </label>
        <label class="field" style={{ flex: '1 1 90px', marginBottom: 0 }}>
          <span class="text-sm">最大値</span>
          <input class="input" type="number" min={0} value={max} onInput={(e) => setMax(Number((e.target as HTMLInputElement).value) || 0)} />
        </label>
        <label class="field" style={{ flex: '1 1 90px', marginBottom: 0 }}>
          <span class="text-sm">回復(分/1)</span>
          <input class="input" type="number" min={0} step={0.5} value={perMin} onInput={(e) => setPerMin(Number((e.target as HTMLInputElement).value) || 0)} />
        </label>
        <label class="field" style={{ flex: '1 1 90px', marginBottom: 0 }}>
          <span class="text-sm">1周回の消費</span>
          <input class="input" type="number" min={1} value={runCost} onInput={(e) => setRunCost(Number((e.target as HTMLInputElement).value) || 1)} />
        </label>
      </div>
      <p class="hint">既定値: ピクセル上限240・6分で1回復・アノマリーゾーン1回40（倍取り80）。</p>

      {/* タスク */}
      <hr class="divider" />
      <TaskGroup title="デイリー" items={daily} onToggle={toggle} onRemove={remove} onReset={() => resetChecks('daily')} />
      <TaskGroup title="ウィークリー" items={weekly} onToggle={toggle} onRemove={remove} onReset={() => resetChecks('weekly')} />

      <div class="row" style={{ gap: '8px' }}>
        <input
          class="input"
          placeholder="タスクを追加"
          value={newTask}
          onInput={(e) => setNewTask((e.target as HTMLInputElement).value)}
          onKeyDown={(e) => e.key === 'Enter' && add('daily')}
        />
        <button class="btn btn-sm" type="button" onClick={() => add('daily')}>日課に</button>
        <button class="btn btn-sm" type="button" onClick={() => add('weekly')}>週課に</button>
      </div>
    </div>
  );
}

function TaskGroup({
  title,
  items,
  onToggle,
  onRemove,
  onReset,
}: {
  title: string;
  items: Task[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onReset: () => void;
}) {
  const done = items.filter((t) => t.done).length;
  return (
    <div>
      <div class="row row-between" style={{ marginBottom: '4px' }}>
        <strong class="text-sm">
          {title} <span class="muted">({done}/{items.length})</span>
        </strong>
        <button class="btn btn-sm btn-ghost" type="button" onClick={onReset}>
          チェックを戻す
        </button>
      </div>
      {items.length === 0 ? (
        <p class="muted text-sm">タスクがありません。</p>
      ) : (
        <ul class="list-reset">
          {items.map((t) => (
            <li class={`check-item${t.done ? ' done' : ''}`} key={t.id}>
              <input type="checkbox" checked={t.done} onChange={() => onToggle(t.id)} id={`pt-${t.id}`} />
              <label for={`pt-${t.id}`}>{t.text}</label>
              <button class="btn btn-sm btn-ghost" type="button" aria-label="削除" onClick={() => onRemove(t.id)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
