// ResultPanel —— 查询结果面板：工具栏 + 树形/代码双视图可切换
import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { highlightJson } from '@ztools/json-tooling'
import TreeView from './TreeView'

// 内联 SVG
const Icon = ({ children, size = 14 }) => (
  <svg width={size} height={size} viewBox='0 0 24 24' fill='none' style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    {children}
  </svg>
)
const CopyIcon = () => <Icon><rect x='9' y='9' width='13' height='13' rx='2' stroke='currentColor' strokeWidth='2'/><path d='M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1' stroke='currentColor' strokeWidth='2'/></Icon>
const DownloadIcon = () => <Icon><path d='M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'/></Icon>
const FilterIcon = () => <Icon><polygon points='22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3' stroke='currentColor' strokeWidth='2' strokeLinejoin='round'/></Icon>
const SearchIcon = () => <Icon><circle cx='11' cy='11' r='8' stroke='currentColor' strokeWidth='2'/><path d='M21 21l-4.35-4.35' stroke='currentColor' strokeWidth='2' strokeLinecap='round'/></Icon>
const TreeIcon = () => <Icon><path d='M12 2v8M5 10l7 7 7-7M5 22h14' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'/></Icon>
const CodeIcon = () => <Icon><polyline points='16 18 22 12 16 6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'/><polyline points='8 6 2 12 8 18' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'/></Icon>
const ChevUp = () => <Icon size={14}><polyline points='18 15 12 9 6 15' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'/></Icon>
const ChevDown = () => <Icon size={14}><polyline points='6 9 12 15 18 9' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'/></Icon>
const XIcon = () => <Icon size={14}><path d='M18 6L6 18M6 6l12 12' stroke='currentColor' strokeWidth='2' strokeLinecap='round'/></Icon>

function findMatches(text, query) {
  if (!query) return []
  const lines = text.split('\n')
  const matches = []
  let offset = 0
  const q = query.toLowerCase()
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lower = line.toLowerCase()
    let idx = 0
    while ((idx = lower.indexOf(q, idx)) !== -1) {
      matches.push({ line: i + 1, lineOffset: idx, length: query.length, globalOffset: offset + idx })
      idx += q.length
    }
    offset += line.length + 1
  }
  return matches
}

export default function ResultPanel({
  nodes,
  content,
  count,
  elapsed,
  isArray = false,
  isDeduped,
  onToggleDedup,
  onCopy,
  onExport
}) {
  // 视图模式：'tree' | 'code'
  const [view, setView] = useState('tree')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const bodyRef = useRef(null)
  const searchRef = useRef(null)
  const lineRefs = useRef([])

  const lines = content.split('\n')
  const searchMatches = useMemo(() => findMatches(content, searchQuery), [content, searchQuery])
  const [activeIdx, setActiveIdx] = useState(0)
  const activeMatch = searchMatches[activeIdx] ?? null
  const activeLine = activeMatch?.line ?? null

  const openSearch = useCallback(() => setSearchOpen(true), [])
  const closeSearch = useCallback(() => { setSearchOpen(false); setSearchQuery(''); setActiveIdx(0) }, [])
  const goTo = useCallback((dir) => {
    if (!searchMatches.length) return
    setActiveIdx(prev => (prev + dir + searchMatches.length) % searchMatches.length)
  }, [searchMatches.length])

  useEffect(() => { setActiveIdx(0) }, [searchQuery])
  useEffect(() => {
    if (activeLine != null) lineRefs.current[activeLine - 1]?.scrollIntoView({ block: 'center' })
  }, [activeLine])

  const buildLineHtml = (line, lineNum) => {
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const lineMatches = searchMatches.filter(m => m.line === lineNum)
    if (lineMatches.length > 0) {
      let html = ''
      let last = 0
      lineMatches.forEach((m, i) => {
        html += esc(line.substring(last, m.lineOffset))
        const cls = (activeMatch && m.line === activeMatch.line && m.lineOffset === activeMatch.lineOffset)
          ? 'result-search-hit active' : 'result-search-hit'
        html += `<mark class="${cls}">${esc(line.substring(m.lineOffset, m.lineOffset + m.length))}</mark>`
        last = m.lineOffset + m.length
      })
      html += esc(line.substring(last))
      return html
    }
    return highlightJson(line) || '&nbsp;'
  }

  return (
    <div className='result-panel'>
      {/* 工具栏 */}
      <div className='result-toolbar'>
        <span className='result-count'>
          匹配 <strong style={{ color: 'var(--accent)' }}>{count}</strong> 项
          {elapsed != null && <span className='result-elapsed'>· {elapsed}ms</span>}
        </span>
        <div className='result-actions'>
          <button className={`ui-btn ui-btn-sm ${isDeduped ? 'ui-btn-accent' : ''}`}
            onClick={onToggleDedup} disabled={!isArray} title='数组去重'>
            <FilterIcon /> 去重
          </button>
          <button className='ui-btn ui-btn-sm' onClick={onCopy} title='复制结果'><CopyIcon /> 复制</button>
          <button className='ui-btn ui-btn-sm' onClick={onExport} title='导出文件'><DownloadIcon /> 导出</button>
          <button className='ui-btn ui-btn-sm' onClick={openSearch} title='搜索 (Ctrl+F)'><SearchIcon /></button>
          <span className='result-view-switch'>
            <button className={`ui-btn ui-btn-sm ${view === 'tree' ? 'ui-btn-accent' : ''}`}
              onClick={() => setView('tree')} title='树形视图'>
              <TreeIcon /> 树
            </button>
            <button className={`ui-btn ui-btn-sm ${view === 'code' ? 'ui-btn-accent' : ''}`}
              onClick={() => setView('code')} title='代码视图'>
              <CodeIcon /> 代码
            </button>
          </span>
        </div>
      </div>

      {/* 搜索条 */}
      {searchOpen && (
        <div className='result-search-bar'>
          <SearchIcon />
          <input
            ref={searchRef}
            className='result-search-input'
            value={searchQuery}
            placeholder={view === 'tree' ? '输入关键字过滤节点' : '搜索代码内容'}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); goTo(e.shiftKey ? -1 : 1) }
              else if (e.key === 'Escape') { e.preventDefault(); closeSearch() }
            }}
          />
          {view === 'code' && (
            <span className='result-search-meta'>
              {searchMatches.length ? `${activeIdx + 1} / ${searchMatches.length}` : '0 / 0'}
              {activeMatch ? ` · 第 ${activeMatch.line} 行` : ''}
            </span>
          )}
          {view === 'code' && (
            <>
              <button className='ui-btn ui-btn-sm' onClick={() => goTo(-1)} title='上一个'><ChevUp /></button>
              <button className='ui-btn ui-btn-sm' onClick={() => goTo(1)} title='下一个'><ChevDown /></button>
            </>
          )}
          <button className='ui-btn ui-btn-sm' onClick={closeSearch} title='关闭'><XIcon /></button>
        </div>
      )}

      {/* 视图区 */}
      {view === 'tree' ? (
        <div className='result-tree-wrap'>
          <TreeView nodes={nodes} searchQuery={searchQuery} searchOpen={searchOpen} />
        </div>
      ) : (
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
            {lines.map((_, i) => (
              <div key={i} className={`result-line-num${activeLine === i + 1 ? ' is-hit' : ''}`}>{i + 1}</div>
            ))}
          </div>
          <div className='result-body'>
            {lines.map((line, i) => (
              <div
                key={i}
                ref={(el) => { lineRefs.current[i] = el }}
                className={`result-line${activeLine === i + 1 ? ' is-hit' : ''}`}
              >
                <pre className='result-line-pre' dangerouslySetInnerHTML={{ __html: buildLineHtml(line, i + 1) }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
