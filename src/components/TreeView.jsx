// TreeView —— 可折叠 JSON 树，悬停显示「复制路径」按钮
// 移植自 ztools-plugins-json/src/components/JsonTreeView.tsx，接入 ui-kit 设计令牌
import { useState, useCallback, useMemo, useEffect } from 'react'
import { getNodeValue } from '@ztools/json-tooling'
import { generatePaths } from '../pathGenerator.js'
import { collectMatchPaths, computeInitialCollapsed, toggleInSet, filterTree } from '../lib/treeViewLogic.js'

const TYPE_TAG = {
  object: { label: 'OBJ', var: '--jl-bracket' },
  array: { label: 'ARR', var: '--jl-bracket' },
  string: { label: 'STR', var: '--jl-string' },
  number: { label: 'NUM', var: '--jl-number' },
  boolean: { label: 'BOOL', var: '--jl-boolean' },
  null: { label: 'NULL', var: '--jl-null' }
}

// 内联 SVG：避免引入 lucide-react（保持包纯净）
const Chevron = ({ collapsed }) => (
  <svg
    width='12' height='12' viewBox='0 0 24 24' fill='none'
    style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.15s' }}
  >
    <path d='M9 6l6 6-6 6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
  </svg>
)
const HashIcon = () => (
  <svg width='12' height='12' viewBox='0 0 24 24' fill='none'>
    <path d='M4 9h16M4 15h16M10 3L8 21M16 3l-2 18' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
  </svg>
)
const Braces = () => (
  <svg width='12' height='12' viewBox='0 0 24 24' fill='none'>
    <path
      d='M8 4a2 2 0 00-2 2v4a2 2 0 01-2 2 2 2 0 012 2v4a2 2 0 002 2M16 4a2 2 0 012 2v4a2 2 0 002 2 2 2 0 002-2v4a2 2 0 01-2 2'
      stroke='currentColor' strokeWidth='2' strokeLinecap='round' fill='none'
    />
  </svg>
)
const Brackets = () => (
  <svg width='12' height='12' viewBox='0 0 24 24' fill='none'>
    <path d='M7 4H4v16h3M17 4h3v16h-3' stroke='currentColor' strokeWidth='2' strokeLinecap='round' fill='none' />
  </svg>
)

function TypeTag ({ type }) {
  const c = TYPE_TAG[type] || TYPE_TAG.null
  return (
    <span className='tree-type-tag' style={{ color: `var(${c.var})` }}>
      {c.label}
    </span>
  )
}

function TreeNodeItem ({ node, depth, collapsed, onToggle, onCopyPath, onNodeClick, collapsedSet, isMatch = false }) {
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)

  const hasChildren = node.children && node.children.length > 0
  const isContainer = node.type === 'object' || node.type === 'array'
  const isExpandable = hasChildren || isContainer

  const handleCopyPath = async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(node.path)
    } catch {
      window.utools?.copyText?.(node.path)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
    onCopyPath?.(node.path)
  }

  const valueColor = node.type === 'string'
    ? 'var(--jl-string)'
    : node.type === 'number'
      ? 'var(--jl-number)'
      : node.type === 'boolean'
        ? 'var(--jl-boolean)'
        : 'var(--jl-null)'

  return (
    <div>
      <div
        className='tree-row'
        style={{ paddingLeft: `${depth * 16 + 8}px`, background: hovered ? 'var(--bg-hover)' : (isMatch ? 'var(--search-active-bg)' : 'transparent') }}
        onClick={() => onNodeClick?.(node.path)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {isExpandable
          ? (
            <button
              className='tree-toggle'
              onClick={(e) => { e.stopPropagation(); onToggle(node.path) }}
              style={{ color: hovered ? 'var(--accent)' : 'var(--text-muted)' }}
            >
              <Chevron collapsed={collapsed} />
            </button>
            )
          : (
            <span className='tree-spacer' />
            )}

        {isContainer && (
          <span className='tree-container-icon' style={{ color: 'var(--jl-bracket)' }}>
            {node.type === 'object' ? <Braces /> : <Brackets />}
          </span>
        )}

        <span className='tree-key' style={{ color: isContainer ? 'var(--jl-bracket)' : 'var(--jl-key)' }}>
          {typeof node.key === 'number' ? `[${node.key}]` : node.key}
        </span>
        <span className='tree-colon'>:</span>

        {isContainer
          ? (
            <span className='tree-container-summary'>
              {collapsed
                ? (
                  <>
                    <span style={{ color: 'var(--jl-bracket)' }}>{node.type === 'object' ? '{' : '['}</span>
                    <span className='tree-count-badge'>{node.childCount ?? 0}</span>
                    <span style={{ color: 'var(--jl-bracket)' }}>{node.type === 'object' ? '}' : ']'}</span>
                  </>
                  )
                : (
                  <span style={{ color: 'var(--jl-bracket)' }}>{node.type === 'object' ? '{' : '['}</span>
                  )}
            </span>
            )
          : (
            <span className='tree-value' style={{ color: valueColor }}>
              {node.circular
                ? (
                  <span style={{ color: 'var(--warning)', fontStyle: 'italic' }}>[Circular]</span>
                  )
                : (
                  <>
                    {node.type === 'string' && <span className='tree-quote'>'</span>}
                    <span>{node.type === 'string' ? node.value : getNodeValue(node)}</span>
                    {node.type === 'string' && <span className='tree-quote'>'</span>}
                  </>
                  )}
            </span>
            )}

        <TypeTag type={node.type} />

        {hovered && (
          <button className='tree-path-btn' onClick={handleCopyPath} title='复制路径'>
            {copied ? <span style={{ color: 'var(--success)', fontSize: '11px' }}>✓</span> : <HashIcon />}
          </button>
        )}
      </div>

      {!collapsed && node.children && (
        <div>
          {node.children.map((child, i) => (
            <TreeNodeItem
              key={`${child.path}-${i}`}
              node={child}
              depth={depth + 1}
              collapsed={collapsedSet.has(child.path)}
              collapsedSet={collapsedSet}
              onToggle={onToggle}
              onCopyPath={onCopyPath}
              onNodeClick={onNodeClick}
              isMatch={isMatch}
            />
          ))}
          {isContainer && (
            <div className='tree-closing' style={{ paddingLeft: `${depth * 16 + 8}px` }}>
              <span className='tree-spacer' />
              <span style={{ color: 'var(--jl-bracket)' }}>{node.type === 'object' ? '}' : ']'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function TreeView ({
  nodes,
  onNodeClick,
  onCopyPath,
  onGeneratePath,
  searchQuery = '',
  searchOpen = false,
  filterMode = false
}) {
  // 过滤式提取：filterMode 下只保留命中节点及其祖先路径
  const filteredNodes = useMemo(() => {
    if (!filterMode) return nodes
    return filterTree(nodes, searchQuery)
  }, [nodes, searchQuery, filterMode])

  // 匹配路径集合（高亮用）：filterMode 下全部命中节点都高亮；
  // 非 filterMode（原搜索模式）按 collectMatchPaths 计算
  const matchPaths = useMemo(() => {
    if (filterMode) {
      if (!searchOpen || !searchQuery.trim()) return null
      // 提取模式下整棵子树都是匹配项，无需单独高亮
      return null
    }
    if (!searchOpen || !searchQuery.trim()) return null
    const set = collectMatchPaths(nodes, searchQuery)
    return set.size > 0 ? set : null
  }, [nodes, searchQuery, searchOpen, filterMode])

  // 折叠状态。filterMode 下强制全部展开（祖先必须可见，匹配项才看得见的）
  const [collapsed, setCollapsed] = useState(() =>
    filterMode ? new Set() : computeInitialCollapsed(nodes, searchOpen, searchQuery)
  )

  // 查询变化时，filterMode 下重置为全部展开
  useEffect(() => {
    if (filterMode) setCollapsed(new Set())
  }, [searchQuery, filterMode])

  const handleToggle = useCallback((path) => {
    setCollapsed(prev => toggleInSet(prev, path))
  }, [])

  if (!filteredNodes || filteredNodes.length === 0) {
    return (
      <div className='tree-empty'>{filterMode ? '没有匹配的节点' : '输入合法 JSON 后，树形视图将显示在这里'}</div>
    )
  }

  return (
    <div className='tree-view'>
      {filteredNodes.map((node, i) => (
        <TreeNodeItem
          key={`${node.path}-${i}`}
          node={node}
          depth={0}
          collapsed={collapsed.has(node.path)}
          collapsedSet={collapsed}
          onToggle={handleToggle}
          onCopyPath={onCopyPath}
          onNodeClick={(path) => {
            onNodeClick?.(path)
            if (onGeneratePath) {
              const paths = generatePaths(node)
              onGeneratePath(paths)
            }
          }}
          isMatch={matchPaths ? matchPaths.has(node.path) : false}
        />
      ))}
    </div>
  )
}
