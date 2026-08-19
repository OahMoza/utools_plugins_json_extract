// StatusBar —— 底部状态条：合法性 / 解析耗时 / 查询耗时 / 大文件告警
// 移植自 ztools-plugins-json/src/components/StatusBar.tsx
export default function StatusBar({ valid, error, parseElapsed, queryElapsed, fileSize, isLargeFile }) {
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className='json-statusbar'>
      {valid ? (
        <span className='json-status-item json-status-ok'>✓ 合法 JSON</span>
      ) : error ? (
        <span className='json-status-item json-status-err' title={error.message}>
          ✗ 第 {error.line} 行 · {error.message}
        </span>
      ) : (
        <span className='json-status-item'>等待输入…</span>
      )}

      {valid && parseElapsed > 0 && (
        <span className='json-status-item'>解析 {parseElapsed}ms</span>
      )}
      {queryElapsed != null && queryElapsed > 0 && (
        <span className='json-status-item'>查询 {queryElapsed}ms</span>
      )}
      {isLargeFile && (
        <span className='json-status-item json-status-warn'>
          ⚠ 大文件（{formatSize(fileSize || 0)}）· 简化模式
        </span>
      )}
    </div>
  )
}
