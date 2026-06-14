/** ツールをidで選んで描画するホスト。client:only で1つ読み込めば良いようにする。
 *  ツール内で例外が発生しても白画面化せず、再試行できるエラーバウンダリで包む。 */
import { useErrorBoundary } from 'preact/hooks';
import { getTool } from './registry';

export default function ToolHost({ id }: { id: string }) {
  const [error, resetError] = useErrorBoundary();

  if (error) {
    return (
      <div class="tool-error card card-pad" role="alert">
        <p style={{ fontWeight: 700, marginTop: 0 }}>ツールの読み込みでエラーが発生しました。</p>
        <p class="muted text-sm">
          一時的な問題の可能性があります。再試行しても直らない場合は、ページの再読み込みをお試しください。
        </p>
        <button type="button" class="btn btn-primary" onClick={() => resetError()}>
          再試行
        </button>
      </div>
    );
  }

  const tool = getTool(id);
  if (!tool) {
    return <p class="empty">ツールが見つかりませんでした。</p>;
  }
  const Tool = tool.Component;
  return <Tool />;
}
