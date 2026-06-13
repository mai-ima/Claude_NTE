/**
 * 育成・スタミナ計画ツール（統合版）。
 * - 本性ピクセル（戦闘スタミナ: 既定240 / 6分で1回復）の全回復時刻・周回可能数・回復バー。
 * - シティスタミナ（既定200 / 毎週月曜04:00 UTC+8 リセット）の残量と次回リセットまで。
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
  { id: 'd2', text: '本性ピクセルを使い切る', done: false, cycle: 'daily' },
  { id: 'd3', text: 'シティスタミナで ファンス 稼ぎ', done: false, cycle: 'daily' },
  { id: 'w1', text: 'アノマリーボスの週課報酬を回収', done: false, cycle: 'weekly' },
  { id: 'w2', text: 'シティスタミナを使い切る（週リセット前）', done: false, cycle: 'weekly' },
  { id: 'w3', text: 'Beyond the Rails を進める', done: false, cycle: 'weekly' },
];

/** 次の「月曜04:00 (UTC+8)」を返す */
function nextWeeklyReset(now: number): Date {
  const OFFSET = 8 * 3600 * 1000;
  const shifted = new Date(now + OFFSET); // UTC+8 の壁時計を UTC フィールドで表現
  const day = shifted.getUTCDay(); // 0=日..6=土
  let daysUntilMon = (1 - day + 7) % 7;
  const past4 = shifted.getUTCHours() >= 4;
  if (daysUntilMon === 0 && past4) daysUntilMon = 7;
  const target = new Date(shifted);
  target.setUTCDate(shifted.getUTCDate() + daysUntilMon);
  target.setUTCHours(4, 0, 0, 0);
  return new Date(target.getTime() - OFFSET);
}

export default function Planner() {
  const [cur, setCur] = useStore<number>('tool.planner.pixels', 0);
  // 現在値を入力した時刻。これを基準に経過分から現在量を推定する（表示が時間でズレないように）。
  const [curAt, setCurAt] = useStore<number>('tool.planner.pixelsAt', 0);
  const [max, setMax] = useState(240);
  const [perMin, setPerMin] = useState(6);
  const [runCost, setRunCost] = useState(40);
  const [city, setCity] = useStore<number>('tool.planner.city', 200);
  const [cityMax, setCityMax] = useState(200);
  const [tasks, setTasks] = useStore<Task[]>('tool.planner.tasks', DEFAULT_TASKS);
  const [newTask, setNewTask] = useState('');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  /** 現在値をセットし、推定の基準時刻も今に更新する */
  const setCurNow = (v: number) => {
    setCur(v);
    setCurAt(Date.now());
  };

  const entered = Math.max(0, Math.floor(cur));
  const m = Math.max(0, Math.floor(max));
  // 入力時刻からの経過分でピクセルを進めた「現在の推定量」。基準時刻が無ければ静的に扱う。
  const regened = perMin > 0 && curAt > 0 ? Math.floor((now - curAt) / (perMin * 60_000)) : 0;
  const c = Math.min(m, entered + Math.max(0, regened));
  const remaining = Math.max(0, m - c);
  const minutesToFull = perMin > 0 ? remaining * perMin : Infinity;
  const eta = isFinite(minutesToFull) && remaining > 0 ? new Date(now + minutesToFull * 60_000) : null;
  const runsNow = runCost > 0 ? Math.floor(c / runCost) : 0;
  const pixelPct = m > 0 ? Math.min(100, Math.round((c / m) * 100)) : 0;

  const reset = nextWeeklyReset(now);
  const cityPct = cityMax > 0 ? Math.min(100, Math.round((city / cityMax) * 100)) : 0;
  const untilResetH = Math.max(0, Math.floor((reset.getTime() - now) / 3600000));
  const untilResetD = Math.floor(untilResetH / 24);

  const fmt = (min: number) => {
    if (!isFinite(min)) return '—';
    const total = Math.round(min);
    const h = Math.floor(total / 60);
    const mm = total % 60;
    return h === 0 ? `${mm}分` : `${h}時間${mm}分`;
  };

  const toggle = (id: string) => setTasks((p) => p.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
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
      {/* 本性ピクセル */}
      <section class="card card-pad stack" style={{ gap: '10px' }}>
        <div class="row row-between">
          <strong>本性ピクセル（戦闘）</strong>
          <span class="muted text-sm">{c} / {m}</span>
        </div>
        <div class="progress"><span style={{ width: `${pixelPct}%` }} /></div>
        <div class="row row-between text-sm">
          <span>全回復まで <strong>{c >= m ? '回復済み' : fmt(minutesToFull)}</strong></span>
          <span>今 <strong>{runsNow}</strong> 回 周回可</span>
        </div>
        {eta && c < m && (
          <div class="text-sm muted">全回復予定: {eta.toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
        )}
        <div class="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
          <label class="field" style={{ flex: '1 1 80px', marginBottom: 0 }}>
            <span class="text-sm">現在値</span>
            <input class="input" type="number" min={0} value={cur} onInput={(e) => setCurNow(Number((e.target as HTMLInputElement).value) || 0)} />
          </label>
          <label class="field" style={{ flex: '1 1 80px', marginBottom: 0 }}>
            <span class="text-sm">最大</span>
            <input class="input" type="number" min={0} value={max} onInput={(e) => setMax(Number((e.target as HTMLInputElement).value) || 0)} />
          </label>
          <label class="field" style={{ flex: '1 1 80px', marginBottom: 0 }}>
            <span class="text-sm">回復(分/1)</span>
            <input class="input" type="number" min={0} step={0.5} value={perMin} onInput={(e) => setPerMin(Number((e.target as HTMLInputElement).value) || 0)} />
          </label>
          <label class="field" style={{ flex: '1 1 80px', marginBottom: 0 }}>
            <span class="text-sm">1周回</span>
            <input class="input" type="number" min={1} value={runCost} onInput={(e) => setRunCost(Number((e.target as HTMLInputElement).value) || 1)} />
          </label>
        </div>
        <p class="hint">既定: 上限240・6分で1回復・アノマリーゾーン1回40（倍取り80）。</p>
      </section>

      {/* シティスタミナ */}
      <section class="card card-pad stack" style={{ gap: '10px' }}>
        <div class="row row-between">
          <strong>シティスタミナ（都市）</strong>
          <span class="muted text-sm">{city} / {cityMax}</span>
        </div>
        <div class="progress"><span style={{ width: `${cityPct}%`, background: '#06b6d4' }} /></div>
        <div class="text-sm">
          次の週リセット（月曜04:00 UTC+8）まで <strong>約{untilResetD}日{untilResetH % 24}時間</strong>
        </div>
        <div class="row" style={{ gap: '8px' }}>
          <label class="field" style={{ flex: 1, marginBottom: 0 }}>
            <span class="text-sm">現在値</span>
            <input class="input" type="number" min={0} value={city} onInput={(e) => setCity(Number((e.target as HTMLInputElement).value) || 0)} />
          </label>
          <label class="field" style={{ flex: 1, marginBottom: 0 }}>
            <span class="text-sm">最大</span>
            <input class="input" type="number" min={0} value={cityMax} onInput={(e) => setCityMax(Number((e.target as HTMLInputElement).value) || 0)} />
          </label>
        </div>
        <p class="hint">毎分回復せず、毎週月曜04:00(UTC+8)に全回復。リセット前に使い切るのが基本。</p>
      </section>

      {/* タスク */}
      <section class="card card-pad stack">
        <TaskGroup title="デイリー" items={daily} onToggle={toggle} onRemove={remove} onReset={() => resetChecks('daily')} />
        <TaskGroup title="ウィークリー" items={weekly} onToggle={toggle} onRemove={remove} onReset={() => resetChecks('weekly')} />
        <div class="row" style={{ gap: '8px' }}>
          <input class="input" placeholder="タスクを追加" value={newTask}
            onInput={(e) => setNewTask((e.target as HTMLInputElement).value)}
            onKeyDown={(e) => e.key === 'Enter' && !(e as KeyboardEvent).isComposing && add('daily')} />
          <button class="btn btn-sm" type="button" onClick={() => add('daily')}>日課に</button>
          <button class="btn btn-sm" type="button" onClick={() => add('weekly')}>週課に</button>
        </div>
      </section>
    </div>
  );
}

function TaskGroup({
  title, items, onToggle, onRemove, onReset,
}: {
  title: string;
  items: Task[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onReset: () => void;
}) {
  const done = items.filter((t) => t.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;
  return (
    <div>
      <div class="row row-between" style={{ marginBottom: '4px' }}>
        <strong class="text-sm">{title} <span class="muted">({done}/{items.length})</span></strong>
        <button class="btn btn-sm btn-ghost" type="button" onClick={onReset}>戻す</button>
      </div>
      <div class="progress" style={{ marginBottom: '8px' }}><span style={{ width: `${pct}%` }} /></div>
      {items.length === 0 ? (
        <p class="muted text-sm">タスクがありません。</p>
      ) : (
        <ul class="list-reset">
          {items.map((t) => (
            <li class={`check-item${t.done ? ' done' : ''}`} key={t.id}>
              <input type="checkbox" checked={t.done} onChange={() => onToggle(t.id)} id={`pt-${t.id}`} />
              <label for={`pt-${t.id}`}>{t.text}</label>
              <button class="btn btn-sm btn-ghost" type="button" aria-label="削除" onClick={() => onRemove(t.id)}>×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
