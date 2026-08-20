// TreeView 的纯逻辑：搜索匹配路径、初始折叠集、不可变 toggle
// 从 TreeView.jsx 提取，便于 node:test 直接验证（无需 DOM）

// 收集 searchQuery 命中的节点路径（key 或 value 子串，大小写不敏感）
// 空查询返回空 Set
export function collectMatchPaths (nodes, searchQuery) {
  const set = new Set()
  if (!searchQuery || !searchQuery.trim()) return set
  const q = searchQuery.toLowerCase()
  const walk = (list) => list.forEach(n => {
    const keyStr = String(n.key).toLowerCase()
    const valStr = String(n.value).toLowerCase()
    if (keyStr.includes(q) || valStr.includes(q)) set.add(n.path)
    if (n.children) walk(n.children)
  })
  walk(nodes)
  return set
}

// 计算初始折叠路径集合
// - 默认模式（searchOpen=false）：按节点自身 collapsed 标记
// - 搜索模式（searchOpen=true）：全部容器折叠，再展开命中节点的祖先
export function computeInitialCollapsed (nodes, searchOpen, searchQuery) {
  const set = new Set()
  if (searchOpen && searchQuery && searchQuery.trim()) {
    const matchPaths = collectMatchPaths(nodes, searchQuery)
    // 全部容器先折叠
    const collapseAll = (list) => list.forEach(n => {
      if (n.children) { set.add(n.path); collapseAll(n.children) }
    })
    collapseAll(nodes)
    // 命中节点的祖先展开
    const expandAncestors = (list, ancestors = []) => list.forEach(n => {
      if (matchPaths.has(n.path)) ancestors.forEach(p => set.delete(p))
      if (n.children) expandAncestors(n.children, [...ancestors, n.path])
    })
    expandAncestors(nodes)
  } else {
    const walk = (list) => list.forEach(n => {
      if (n.collapsed) set.add(n.path)
      if (n.children) walk(n.children)
    })
    walk(nodes)
  }
  return set
}

// 不可变 toggle：返回新 Set，切换某 path 的折叠状态
export function toggleInSet (collapsedSet, path) {
  const next = new Set(collapsedSet)
  if (next.has(path)) next.delete(path)
  else next.add(path)
  return next
}

// 单个节点是否命中查询（key 或标量 value 子串，大小写不敏感）
// 容器（object/array）只匹配 key，避免 String(undefined) 误匹配
export function nodeMatches (node, query) {
  if (!query || !query.trim()) return false
  const q = query.toLowerCase()
  if (String(node.key ?? '').toLowerCase().includes(q)) return true
  const v = node.value
  if (v != null && typeof v !== 'object') {
    return String(v).toLowerCase().includes(q)
  }
  return false
}

// 过滤式提取：只保留命中节点及其祖先路径，返回新树。
// 未命中且无命中后代的节点被丢弃，从而让结果只呈现匹配项（祖先仅作路径上下文）。
export function filterTree (nodes, query) {
  if (!query || !query.trim()) return nodes
  const walk = (list) => {
    const out = []
    for (const node of list) {
      const selfMatch = nodeMatches(node, query)
      let children = []
      if (node.children) children = walk(node.children)
      if (selfMatch || children.length > 0) {
        const next = { ...node }
        if (node.children) next.children = children
        out.push(next)
      }
    }
    return out
  }
  return walk(nodes)
}

// 统计命中节点数（仅真正命中的节点，不含仅作上下文保留的祖先）
export function countMatches (nodes, query) {
  if (!query || !query.trim()) return 0
  let count = 0
  const walk = (list) => list.forEach(n => {
    if (nodeMatches(n, query)) count++
    if (n.children) walk(n.children)
  })
  walk(nodes)
  return count
}
