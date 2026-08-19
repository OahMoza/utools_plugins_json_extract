import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import {
  formatJson,
  minifyJson,
  highlightJson,
  getJsonErrorPosition,
  getType,
  query,
  jsonToTree
} from '@ztools/json-tooling'
import { parseWithFallback } from './json5Parser.js'
import { validate } from './schemaValidator.js'
import { Button, Textarea, Toolbar, Pane } from '@ztools/ui-kit'
import TreeView from './components/TreeView'
import ResultPanel from './components/ResultPanel'
import QueryBar from './components/QueryBar'
import StatusBar from './components/StatusBar'
import TabBar, { createNewTab } from './components/TabBar'
import useExpressionHistory from './hooks/useExpressionHistory'
import { deduplicateArray } from './lib/resultPanelLogic.js'
import ImportMenu, { useDropImport } from './components/ImportMenu'
import './App.css'

// 把查询能力暴露给 preload 注册的 MCP 工具（jsonpath_query / jmespath_query）
if (typeof window !== 'undefined') {
  window.services = window.services || {}
  window.services.__query = query
}

const SAMPLE = JSON.stringify(
  {
    users: [
      { name: 'Alice', age: 30, active: true },
      { name: 'Bob', age: 25, active: false }
    ],
    meta: { total: 2, tags: ['admin', 'user'] }
  },
  null,
  2
)

export default function App () {
  const [tabs, setTabs] = useState(() => [createNewTab(0)])
  const [activeTabId, setActiveTabId] = useState(tabs[0].id)
  const [action, setAction] = useState(null)
  const { history, addToHistory } = useExpressionHistory()
  const dropHandlers = useDropImport((text) => {
    updateTab(activeTabId, { jsonText: formatJson(text) })
  })

  // 每 Tab 的查询结果缓存：tabId -> { data, count, elapsed, error, deduped }
  const queryCacheRef = useRef(new Map())

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0]
  const { jsonText, expression, engine } = activeTab

  const updateTab = useCallback((id, updates) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }, [])

  // 解析结果
  // 解析结果（支持 JSON5 容错 fallback）
  const parseState = useMemo(() => {
    if (!jsonText.trim()) {
      return { ok: false, error: null, html: '', data: null, elapsed: 0, usedJSON5: false }
    }
    const t0 = performance.now()
    const result = parseWithFallback(jsonText)
    const elapsed = Math.round(performance.now() - t0)
    if (result.error || result.data === undefined) {
      return { ok: false, error: { message: result.error }, html: highlightJson(escapeRaw(jsonText)), data: null, elapsed, usedJSON5: false }
    }
    const formatted = formatJson(jsonText)
    return { ok: true, error: null, html: highlightJson(formatted), data: result.data, elapsed, usedJSON5: result.usedJSON5 }
  }, [jsonText])

  // 树（无表达式时展示）
  const tree = useMemo(() => {
    if (!parseState.ok || !parseState.data) return []
    return [jsonToTree(parseState.data)]
  }, [parseState.ok, parseState.data])

  // 自动查询：表达式/引擎/数据变化时触发
  useEffect(() => {
    if (!parseState.ok || !expression.trim()) {
      queryCacheRef.current.delete(activeTabId)
      return
    }
    const t0 = performance.now()
    const r = query(parseState.data, expression, engine)
    const elapsed = Math.round(performance.now() - t0)
    const prev = queryCacheRef.current.get(activeTabId)
    queryCacheRef.current.set(activeTabId, { ...r, elapsed, deduped: prev?.deduped || false })
    // 触发重渲染
    setTabs(prev => [...prev])
  }, [expression, engine, parseState.data, parseState.ok, activeTabId])

  const queryState = queryCacheRef.current.get(activeTabId) || null
  const hasExpr = expression.trim().length > 0

  // 展示数据
  const displayData = useMemo(() => {
    if (hasExpr && queryState && queryState.data != null) {
      return queryState.deduped && Array.isArray(queryState.data) ? deduplicateArray(queryState.data) : queryState.data
    }
    return parseState.data
  }, [hasExpr, queryState, parseState.data])

  const displayJson = useMemo(() => {
    if (displayData == null) return ''
    return JSON.stringify(displayData, null, 2)
  }, [displayData])

  // 查询结果的树节点（ResultPanel 用树形展示）
  const resultTree = useMemo(() => {
    if (displayData == null) return []
    return [jsonToTree(displayData, '$', '$', 0, false, new WeakSet())]
  }, [displayData])

  // 插件进入：文本/文件 → 新建 Tab 打开
  useEffect(() => {
    window.utools?.onPluginEnter?.((act) => {
      setAction(act)
      const isText = act?.type === 'over' && act.payload
      const isFile = act?.type === 'files' && act.payload?.[0]?.path
      if (!isText && !isFile) return

      const newTab = createNewTab(tabs.length)
      if (isText) {
        newTab.jsonText = String(act.payload)
        newTab.name = '选中内容'
      } else {
        try {
          newTab.jsonText = window.services.readFile(act.payload[0].path)
          newTab.name = act.payload[0].name || '文件'
        } catch (e) {
          newTab.jsonText = '// 读文件失败: ' + e.message
          newTab.name = '文件'
        }
      }
      setTabs(prev => [...prev, newTab])
      setActiveTabId(newTab.id)
    })
    return () => window.utools?.onPluginOut?.(() => true)
  }, [tabs.length])

  const handleCopy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      window.utools?.copyText?.(text)
    }
  }, [])

  const handleCopyResult = useCallback(async () => {
    await handleCopy(displayJson)
  }, [displayJson, handleCopy])

  const handleExport = useCallback(async () => {
    const blob = new Blob([displayJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'result.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }, [displayJson])

  const handleToggleDedup = useCallback(() => {
    const cur = queryCacheRef.current.get(activeTabId)
    if (cur) {
      queryCacheRef.current.set(activeTabId, { ...cur, deduped: !cur.deduped })
      setTabs(prev => [...prev])
    }
  }, [activeTabId])

  // 路径生成器：点击树节点 → 填入查询框 + 复制 Pointer
  const handleGeneratePath = useCallback(({ jsonpath, jsonpointer }) => {
    updateTab(activeTabId, { expression: jsonpath })
    // 复制 JSON Pointer 到剪贴板
    const textToCopy = jsonpointer || jsonpath
    navigator.clipboard?.writeText(textToCopy).catch(() => {
      window.utools?.copyText?.(textToCopy)
    })
  }, [activeTabId, updateTab])

  // Diff 对比
  const handleCompareClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      updateTab(activeTabId, { diffTarget: text })
    } catch { /* 剪贴板不可用 */ }
  }, [activeTabId, updateTab])

  const handleClearDiff = useCallback(() => {
    updateTab(activeTabId, { diffTarget: null })
  }, [activeTabId, updateTab])

  // Tab 操作
  const handleTabAdd = useCallback(() => {
    const t = createNewTab(tabs.length)
    setTabs(prev => [...prev, t])
    setActiveTabId(t.id)
  }, [tabs.length])

  const handleTabClose = useCallback((id) => {
    if (tabs.length <= 1) return
    setTabs(prev => {
      const next = prev.filter(t => t.id !== id)
      if (id === activeTabId && next.length > 0) setActiveTabId(next[next.length - 1].id)
      return next
    })
    queryCacheRef.current.delete(id)
  }, [tabs.length, activeTabId])

  const stats = useMemo(() => {
    if (!parseState.ok) return null
    const text = formatJson(jsonText)
    return { chars: text.length, lines: text.split('\n').length, type: getType(parseState.data) }
  }, [jsonText, parseState])

  const isLargeFile = jsonText.length > 10 * 1024 * 1024

  return (
    <div className='json-app'>
      <Toolbar className='json-toolbar'>
        <Button variant='accent' onClick={() => updateTab(activeTabId, { jsonText: formatJson(jsonText) })} disabled={!parseState.ok}>格式化</Button>
        <Button onClick={() => updateTab(activeTabId, { jsonText: minifyJson(jsonText) })} disabled={!parseState.ok}>压缩</Button>
        <Button onClick={() => updateTab(activeTabId, { jsonText: '', expression: '' })}>清空</Button>
        <Button onClick={() => handleCopy(formatJson(jsonText))} disabled={!parseState.ok}>复制结果</Button>
        <Button onClick={() => updateTab(activeTabId, { jsonText: SAMPLE })}>示例</Button>
        <ImportMenu onImport={(text) => updateTab(activeTabId, { jsonText: formatJson(text) })} />
        {stats && <span className='json-stats'>{stats.type} · {stats.lines} 行 · {stats.chars} 字符</span>}
      </Toolbar>

      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabSelect={setActiveTabId}
        onTabAdd={handleTabAdd}
        onTabClose={handleTabClose}
      />

      <div className='json-panes'>
        <Pane title='输入' className='json-pane' {...dropHandlers}>
          <Textarea
            className='json-input'
            value={jsonText}
            placeholder='在此粘贴 JSON，或通过 uTools 选中文本/文件进入'
            onChange={(e) => updateTab(activeTabId, { jsonText: e.target.value })}
          />
        </Pane>

        <Pane
          title={hasExpr ? `查询结果 (${queryState?.count ?? 0} 项)` : '树形视图'}
          className='json-pane'
        >
          {hasExpr ? (
            !queryState ? (
              <div className='json-empty'>查询中…</div>
            ) : queryState.error ? (
              <div className='json-result-error'>
                <span className='ui-badge ui-badge-error'>{queryState.error}</span>
              </div>
            ) : displayData == null ? (
              <div className='json-empty'>未匹配到结果</div>
            ) : (
              <ResultPanel
                nodes={resultTree}
                content={displayJson}
                count={queryState.count}
                elapsed={queryState.elapsed}
                isArray={Array.isArray(queryState.data)}
                isDeduped={queryState.deduped}
                onToggleDedup={handleToggleDedup}
                onCopy={handleCopyResult}
                onExport={handleExport}
                diffTarget={activeTab.diffTarget}
              />
            )
          ) : parseState.ok ? (
            <TreeView nodes={tree} onGeneratePath={handleGeneratePath} />
          ) : (
            <div className='json-empty'>输入合法 JSON 后，树形视图将显示在这里</div>
          )}
        </Pane>
      </div>

      <QueryBar
        engine={engine}
        expression={expression}
        onEngineChange={(eng) => updateTab(activeTabId, { engine: eng })}
        onExpressionChange={(exp) => updateTab(activeTabId, { expression: exp })}
        history={history}
        onSelectHistory={addToHistory}
      />

      <StatusBar
        valid={parseState.ok}
        error={parseState.error}
        parseElapsed={parseState.elapsed}
        queryElapsed={queryState?.elapsed}
        fileSize={jsonText.length}
        isLargeFile={isLargeFile}
        usedJSON5={parseState.usedJSON5}
      />
    </div>
  )
}

// 非法 JSON 预览时仅做 HTML 转义，避免注入
function escapeRaw (json) {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
