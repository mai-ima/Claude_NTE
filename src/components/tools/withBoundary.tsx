/**
 * ツールをエラーバウンダリで包む HOC。
 *
 * `/tools/[id]` のツールは ToolHost が包んでいたが、専用ページを持つツール
 * （ティア表・チームビルダー・マップ・比較・カレンダー）は直接描画していたため、
 * 中で例外が出るとページが白くなっていた。両方をこれで揃える。
 *
 * 使い方: `export default withBoundary(TierList);`
 * ページ側のバンドルには対象ツールとこのファイルしか入らないので、
 * ToolHost（全ツールを読む）を専用ページで使うより軽い。
 */
import { useErrorBoundary } from 'preact/hooks';
import type { ComponentType } from 'preact';

export function ToolError({ onRetry }: { onRetry: () => void }) {
  return (
    <div class="tool-error card card-pad" role="alert">
      <p style={{ fontWeight: 700, marginTop: 0 }}>ツールの読み込みでエラーが発生しました。</p>
      <p class="muted text-sm">
        一時的な問題の可能性があります。再試行しても直らない場合は、ページの再読み込みをお試しください。
      </p>
      <button type="button" class="btn btn-primary" onClick={onRetry}>
        再試行
      </button>
    </div>
  );
}

export function withBoundary<P extends Record<string, unknown>>(Inner: ComponentType<P>) {
  return function Bounded(props: P) {
    const [error, resetError] = useErrorBoundary();
    if (error) return <ToolError onRetry={() => resetError()} />;
    return <Inner {...props} />;
  };
}
