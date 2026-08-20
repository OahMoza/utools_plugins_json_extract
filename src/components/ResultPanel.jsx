// ResultPanel —— 查询结果面板：工具栏 + 代码/树形/差异 三视图可切换（默认代码视图）
import { useState, useMemo, useRef, useCallback } from 'react'
import { highlightJson } from '@ztools/json-tooling'
import { diff as jsonDiff, diffUnordered, pointerToJsonPath } from '../jsonPatch.js'
import { filterTree, countMatches } from '../lib/treeViewLogic.js'
import TreeView from './TreeView'

// 内联 SVG
const Icon = ({ children, size = 14 }) => (
  <svg width={size} height={size} viewBox='0 0 24 24' fill='none' style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    {children}
  </svg>
)
const CopyIcon = () => <Icon><rect x='9' y='9' width='13' height='13' rx='2' stroke='currentColor' strokeWidth='2' /><path d='M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1' stroke='currentColor' strokeWidth='2' /></Icon>
const DownloadIcon = () => <Icon><path d='M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' /></Icon>
const FilterIcon = () => <Icon><polygon points='22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3' stroke='currentColor' strokeWidth='2' strokeLinejoin='round' /></Icon>
const SearchIcon = () => <Icon><circle cx='11' cy='11' r='8' stroke='currentColor' strokeWidth='2' /><path d='M21 21l-4.35-4.35' stroke='currentColor' strokeWidth='2' strokeLinecap='round' /></Icon>
const TreeIcon = () => <Icon><path d='M12 2v8M5 10l7 7 7-7M5 22h14' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' /></Icon>
const CodeIcon = () => <Icon><polyline points='16 18 22 12 16 6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' /><polyline points='8 6 2 12 8 18' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' /></Icon>
const DiffIcon = () => <Icon><path d='M12 3v18M3 12h18' stroke='currentColor' strokeWidth='2' strokeLinecap='round' /></Icon>
const XIcon = () => <Icon size={14}><path d='M18 6L6 18M6 6l12 12' stroke='currentColor' strokeWidth='2' strokeLinecap='round' /></Icon>

export default function ResultPanel ({
  nodes,
  content,
  count,
  elapsed,
  isArray = false,
  isDeduped,
  onToggleDedup,
  onCopy,
  onExport,
  diffTarget = null,
  tabs = [],
  activeTabId = null,
  onDiffTargetChange,
  filterable = true,
  diffMode = 'exact',
  onDiffModeChange
}) {
  // 视图模式：'code' | 'tree' | 'diff'，默认代码视图（与输入区一致的文本形态）
  const [view, setView] = useState('code')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const bodyRef = useRef(null)
  const searchRef = useRef(null)

  // 过滤式提取：仅 filterable（查询结果）模式下生效；预览模式始终展示全部
  const effectiveSearch = filterable && searchOpen && searchQuery.trim()
  const filteredNodes = useMemo(
    () => effectiveSearch ? filterTree(nodes, searchQuery) : nodes,
    [nodes, searchQuery, effectiveSearch]
  )
  const matchCount = useMemo(
    () => effectiveSearch ? countMatches(nodes, searchQuery) : 0,
    [nodes, searchQuery, effectiveSearch]
  )

  const allLines = content.split('\n')
  const filteredLines = useMemo(() => {
    if (!effectiveSearch) return null
    const q = searchQuery.toLowerCase()
    const out = []
    allLines.forEach((line, i) => {
      if (line.toLowerCase().includes(q)) out.push({ line: i + 1, text: line })
    })
    return out
  }, [allLines, searchQuery, effectiveSearch])

  // Diff 计算（对比其他 TAB 的内容），按 diffMode 选择有序/无序
  const diffResult = useMemo(() => {
    if (!diffTarget || !content) return null
    try {
      const a = JSON.parse(diffTarget)
      const b = JSON.parse(content)
      return diffMode === 'content' ? diffUnordered(a, b) : jsonDiff(a, b)
    } catch { return null }
  }, [content, diffTarget, diffMode])

  const openSearch = useCallback(() => setSearchOpen(true), [])
  const closeSearch = useCallback(() => { setSearchOpen(false); setSearchQuery('') }, [])

  const buildLineHtml = (line) => {
    return highlightJson(line) || '&nbsp;'
  }

  // 可供对比的其他 TAB（排除当前 TAB）
  const otherTabs = useMemo(
    () => tabs.filter(t => t.id !== activeTabId),
    [tabs, activeTabId]
  )

  return (
    <div className='result-panel'>
      {/* 工具栏 */}
      <div className='result-toolbar'>
        <span className='result-count'>
          匹配 <strong style={{ color: 'var(--accent)' }}>{count}</strong> 项
          {searchOpen && searchQuery.trim() && (
            <span className='result-elapsed'>· 提取 {matchCount} 项匹配</span>
          )}
          {elapsed != null && <span className='result-elapsed'>· {elapsed}ms</span>}
        </span>
        <div className='result-actions'>
          <button
            className={`ui-btn ui-btn-sm ${isDeduped ? 'ui-btn-accent' : ''}`}
            onClick={onToggleDedup} disabled={!isArray} title='数组去重'
          >
            <FilterIcon /> 去重
          </button>
          <button className='ui-btn ui-btn-sm' onClick={onCopy} title='复制结果'><CopyIcon /> 复制</button>
          <button className='ui-btn ui-btn-sm' onClick={onExport} title='导出文件'><DownloadIcon /> 导出</button>
          {filterable && (
            <button className='ui-btn ui-btn-sm' onClick={openSearch} title='搜索提取 (Ctrl+F)'><SearchIcon /></button>
          )}
          <span className='result-view-switch'>
            <button
              className={`ui-btn ui-btn-sm ${view === 'code' ? 'ui-btn-accent' : ''}`}
              onClick={() => setView('code')} title='代码视图（与输入一致）'
            >
              <CodeIcon /> 代码
            </button>
            <button
              className={`ui-btn ui-btn-sm ${view === 'tree' ? 'ui-btn-accent' : ''}`}
              onClick={() => setView('tree')} title='树形视图（备用）'
            >
              <TreeIcon /> 树
            </button>
            <button
              className={`ui-btn ui-btn-sm ${view === 'diff' ? 'ui-btn-accent' : ''}`}
              onClick={() => setView('diff')} title='与其他 TAB 差异对比'
            >
              <DiffIcon /> 差异
            </button>
          </span>
        </div>
      </div>

      {/* 搜索条 */}
      {filterable && searchOpen && (
        <div className='result-search-bar'>
          <SearchIcon />
          <input
            ref={searchRef}
            className='result-search-input'
            value={searchQuery}
            placeholder='输入关键字过滤提取…'
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); closeSearch() } }}
          />
          <span className='result-search-meta'>
            {searchQuery.trim()
              ? `提取 ${matchCount} / ${count} 项`
              : '输入关键字开始提取'}
          </span>
          <button className='ui-btn ui-btn-sm' onClick={() => setSearchQuery('')} title='清除'>清除</button>
          <button className='ui-btn ui-btn-sm' onClick={closeSearch} title='关闭'><XIcon /></button>
        </div>
      )}

      {/* 视图区 */}
      {view === 'diff' && (
        <div className='result-diff-wrap'>
          {!diffTarget
            ? (
              <div className='json-empty'>
                {otherTabs.length === 0
                  ? '暂无可对比的 TAB（新建一个 TAB 后再对比）'
                  : (
                    <div style={{ textAlign: 'left', width: '100%', maxWidth: 480 }}>
                      <div style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>选择要对比的 TAB：</div>
                      {otherTabs.map(t => (
                        <button
                          key={t.id}
                          className='ui-btn ui-btn-sm'
                          style={{ margin: 4 }}
                          onClick={() => onDiffTargetChange?.(t.id)}
                          title={t.name}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                    )}
              </div>
              )
            : diffResult === null
              ? (
                <div className='json-empty'>对比目标不是合法 JSON</div>
                )
              : (
                <>
                  {/* Header：无论结果是否为空，模式切换按钮始终显示 */}
                  <div
                    className='diff-header'
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span className='result-view-switch'>
                        <button
                          className={`ui-btn ui-btn-sm ${diffMode === 'exact' ? 'ui-btn-accent' : ''}`}
                          onClick={() => onDiffModeChange?.('exact')}
                          title='数组顺序不同也算差异'
                        >完全
                        </button>
                        <button
                          className={`ui-btn ui-btn-sm ${diffMode === 'content' ? 'ui-btn-accent' : ''}`}
                          onClick={() => onDiffModeChange?.('content')}
                          title='忽略数组顺序，只比较内容'
                        >内容
                        </button>
                      </span>
                      {diffResult.length === 0
                        ? (
                          <span>
                            {diffMode === 'content' ? '✓ 内容相同（忽略数组顺序）' : '✓ 完全相同'}
                          </span>
                          )
                        : (
                          <span>差异（{diffResult.length} 项操作）</span>
                          )}
                    </span>
                    <button className='ui-btn ui-btn-sm' onClick={() => onDiffTargetChange?.(null)}>清除对比</button>
                  </div>
                  {/* 结果列表 */}
                  {diffResult.length > 0 && (
                    <div className='diff-list'>
                      {diffResult.map((op, i) => (
                        <div key={i} className={`diff-item diff-${op.op}`}>
                          <span className='diff-op'>{op.op}</span>
                          <span className='diff-path'>{pointerToJsonPath(op.path)}</span>
                          {op.value !== undefined && <span className='diff-value'>{JSON.stringify(op.value)}</span>}
                          {op.from && <span className='diff-from'>← {pointerToJsonPath(op.from)}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </>
                )}
        </div>
      )}

      {view === 'tree' && (
        <div className='result-tree-wrap'>
          <TreeView
            nodes={filteredNodes}
            searchQuery={searchQuery}
            searchOpen={searchOpen}
            filterMode
          />
        </div>
      )}

      {view === 'code' && (
        <div
          ref={bodyRef}
          className='result-code'
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
              e.preventDefault(); openSearch()
            }
          }}
        >
          <div className='result-gutter'>
            {(filteredLines ?? allLines.map((_, i) => ({ line: i + 1, text: allLines[i] }))).map((l, i) => (
              <div key={i} className='result-line-num'>{l.line}</div>
            ))}
          </div>
          <div className='result-body'>
            {(filteredLines ?? allLines.map((_, i) => ({ line: i + 1, text: allLines[i] }))).map((l, i) => (
              <div key={i} className='result-line'>
                <pre className='result-line-pre' dangerouslySetInnerHTML={{ __html: buildLineHtml(l.text) }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
