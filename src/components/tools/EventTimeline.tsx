/**
 * イベントタイムライン。events コレクション（loadEvents）をビルド時に受け取り、
 * 開催中/予定/終了をガント風タイムラインで可視化し、残り時間をライブカウントダウン表示する。
 * 検証済みデータ（各イベントの start/end）のみ使用。創作なし。
 */
import { useEffect, useState } from 'preact/hooks';
import { cssVars } from '../../lib/css';

export interface TLEvent {
  id: string;
  title: string;
  href: string;
  kind: 'banner' | 'weapon-banner' | 'event';
  featured: string[];
  startMs: number | null;
  endMs: number | null;
}

const KIND = {
  banner: { label: 'ピックアップ', hue: 'var(--accent)' },
  'weapon-banner': { label: '武器(弧盤)', hue: '#a855f7' },
  event: { label: 'イベント', hue: '#06b6d4' },
} as const;

const DAY = 86_400_000;

type Phase = 'current' | 'upcoming' | 'ended';
function phaseOf(now: number, s: number | null, e: number | null): Phase {
  if (s != null && now < s) return 'upcoming';
  if (e != null && now >= e) return 'ended';
  return 'current';
}

function fmtLeft(ms: number): string {
  if (ms <= 0) return '0';
  const d = Math.floor(ms / DAY);
  if (d >= 2) return `${d}日`;
  const h = Math.floor(ms / 3_600_000) % 24;
  const m = Math.floor(ms / 60_000) % 60;
  const sec = Math.floor(ms / 1000) % 60;
  const dd = Math.floor(ms / DAY);
  return `${dd > 0 ? dd + '日 ' : ''}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

const fmtDate = (ms: number | null) =>
  ms == null
    ? '未定'
    : new Date(ms).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', timeZone: 'Asia/Tokyo' });

export default function EventTimeline({ events }: { events: TLEvent[] }) {
  const [now, setNow] = useState(Date.now());
  const [filter, setFilter] = useState<Phase | 'all'>('all');

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const withPhase = events.map((e) => ({ ...e, phase: phaseOf(now, e.startMs, e.endMs) }));
  const current = withPhase.filter((e) => e.phase === 'current');
  const upcoming = withPhase.filter((e) => e.phase === 'upcoming');

  // ガント軸: 開催中＋予定のうち日付があるものから [min(now), max end] を作る
  const live = [...current, ...upcoming].filter((e) => e.startMs != null && e.endMs != null);
  const axisMin = Math.min(now, ...live.map((e) => e.startMs as number));
  const axisMax = Math.max(now + 7 * DAY, ...live.map((e) => e.endMs as number));
  const span = Math.max(DAY, axisMax - axisMin);
  const pct = (ms: number) => `${(((ms - axisMin) / span) * 100).toFixed(2)}%`;

  const shown = filter === 'all' ? withPhase : withPhase.filter((e) => e.phase === filter);
  const phaseLabel: Record<Phase, string> = { current: '開催中', upcoming: '予定', ended: '終了' };
  const phaseColor: Record<Phase, string> = {
    current: 'var(--success, #2f855a)',
    upcoming: 'var(--accent)',
    ended: 'var(--muted)',
  };

  return (
    <div class="tool stack" style={{ gap: '18px' }}>
      {/* ガント風タイムライン（開催中＋予定） */}
      {live.length > 0 && (
        <section class="card card-pad">
          <div class="row row-between" style={{ marginBottom: '10px' }}>
            <strong class="text-sm">タイムライン（開催中・予定）</strong>
            <span class="muted text-sm">{fmtDate(axisMin)} 〜 {fmtDate(axisMax)}</span>
          </div>
          <div class="tl-gantt">
            {/* 今日マーカー */}
            <div class="tl-today" style={{ left: pct(now) }} aria-hidden="true">
              <span class="tl-today-dot" />
            </div>
            {live
              .slice()
              .sort((a, b) => (a.startMs as number) - (b.startMs as number))
              .map((e) => {
                const left = pct(e.startMs as number);
                const right = 100 - parseFloat(pct(e.endMs as number));
                const hue = KIND[e.kind].hue;
                return (
                  <a
                    href={e.href}
                    key={e.id}
                    class="tl-bar"
                    style={cssVars({ '--hue': hue }, { left, right: `${right}%` })}
                    title={`${e.title}（${fmtDate(e.startMs)}〜${fmtDate(e.endMs)}）`}
                  >
                    <span class="tl-bar-label">{e.title}</span>
                  </a>
                );
              })}
          </div>
          <div class="cluster text-sm" style={{ marginTop: '10px', gap: '12px' }}>
            {Object.entries(KIND).map(([k, v]) => (
              <span key={k} class="row" style={{ gap: '5px', alignItems: 'center' }}>
                <span style={cssVars({ '--hue': v.hue }, { width: '12px', height: '12px', borderRadius: '3px', background: 'var(--hue)' })} />
                {v.label}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* フィルタ */}
      <div class="filterbar cluster" role="tablist" aria-label="表示フィルタ">
        {(['all', 'current', 'upcoming', 'ended'] as const).map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            class={`chip ${filter === f ? 'is-on' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'すべて' : phaseLabel[f]}
            <span class="muted"> {f === 'all' ? withPhase.length : withPhase.filter((e) => e.phase === f).length}</span>
          </button>
        ))}
      </div>

      {/* カード（カウントダウン付き） */}
      <div class="grid grid-cards">
        {shown
          .slice()
          .sort((a, b) => {
            const rank = { current: 0, upcoming: 1, ended: 2 } as const;
            if (rank[a.phase] !== rank[b.phase]) return rank[a.phase] - rank[b.phase];
            return (a.endMs ?? 0) - (b.endMs ?? 0);
          })
          .map((e) => {
            const leftMs = e.phase === 'current' && e.endMs != null ? e.endMs - now : e.phase === 'upcoming' && e.startMs != null ? e.startMs - now : 0;
            return (
              <a href={e.href} key={e.id} class="card card-pad card-link tl-card">
                <div class="row row-between" style={{ marginBottom: '4px' }}>
                  <span class="badge" style={cssVars({ '--hue': KIND[e.kind].hue }, { borderColor: 'var(--hue)', color: 'var(--hue)' })}>
                    {KIND[e.kind].label}
                  </span>
                  <span class="badge" style={{ background: 'transparent', color: phaseColor[e.phase] }}>{phaseLabel[e.phase]}</span>
                </div>
                <strong>{e.title}</strong>
                <p class="text-sm muted" style={{ margin: '4px 0' }}>{fmtDate(e.startMs)} 〜 {fmtDate(e.endMs)}</p>
                {e.phase !== 'ended' && (
                  <p class="text-sm">
                    <span class="muted">{e.phase === 'current' ? '終了まで' : '開始まで'} </span>
                    <strong class="tl-count" style={{ color: phaseColor[e.phase] }}>{fmtLeft(Math.max(0, leftMs))}</strong>
                  </p>
                )}
                {e.featured.length > 0 && (
                  <p class="text-sm muted" style={{ marginTop: '4px' }}>注目: {e.featured.join('・')}</p>
                )}
              </a>
            );
          })}
      </div>
      {shown.length === 0 && <p class="empty">該当するイベントがありません。</p>}

      <p class="hint">
        日付・開催状況は各イベントページの出典に基づきます（残り時間は JST 基準のライブ表示）。最新の開催情報はゲーム内告知が優先です。
      </p>
    </div>
  );
}
