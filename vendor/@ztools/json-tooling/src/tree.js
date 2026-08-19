// JSON → 树形结构（从 ztools-plugins-json/src/utils/jsonTree.ts 移植）
// 纯函数，供 TreeView 组件消费。

export function getType(value) {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

const MAX_DEPTH = 20

/**
 * 把任意 JSON 值递归转成 TreeNode。
 * @param {any} data
 * @param {string|number} key
 * @param {string} parentPath
 * @param {number} depth
 * @param {boolean} parentIsArray
 * @param {WeakSet<any>} seen - 循环引用检测
 */
export function jsonToTree(data, key = '$', parentPath = '$', depth = 0, parentIsArray = false, seen = new WeakSet()) {
  if (depth > MAX_DEPTH) {
    return { key, value: '[Max Depth]', type: 'string', path: parentPath }
  }

  const type = getType(data)
  const isArray = type === 'array'

  // 根节点 path 固定为 $
  let path
  if (key === '$') {
    path = '$'
  } else if (parentPath === '$') {
    path = parentIsArray ? `$[${key}]` : (typeof key === 'number' ? `$[${key}]` : `$.${key}`)
  } else {
    path = parentIsArray ? `${parentPath}[${key}]` : `${parentPath}.${key}`
  }

  if (type === 'object' || type === 'array') {
    if (seen.has(data)) {
      return { key, value: '[Circular]', type: 'string', path, circular: true }
    }
    seen.add(data)

    const entries = isArray
      ? data.map((item, i) => [i, item])
      : Object.entries(data)
    const childCount = entries.length
    // >50 子节点不生成 children（性能策略，与原版一致）
    const children = childCount <= 50
      ? entries.map(([k, v]) => jsonToTree(v, k, path, depth + 1, isArray, seen))
      : undefined

    return { key, value: data, type, path, childCount, children, collapsed: childCount > 5 }
  }

  return { key, value: data, type, path }
}

/** 切换节点折叠状态（返回新对象，不可变） */
export function toggleNode(node) {
  return { ...node, collapsed: !node.collapsed }
}

/** 叶子节点的显示值 */
export function getNodeValue(node) {
  switch (node.type) {
    case 'string': return `"${node.value}"`
    case 'null': return 'null'
    case 'boolean': return String(node.value)
    case 'number': return String(node.value)
    default: return ''
  }
}

/** 容器节点的摘要，如 [3] {2} */
export function getNodeSummary(node) {
  if (node.type === 'array') return `[${node.childCount ?? 0}]`
  if (node.type === 'object') return `{${node.childCount ?? 0}}`
  return getNodeValue(node)
}

/** 把树展平为可见节点列表（尊重 collapsed） */
export function flattenTree(nodes) {
  const result = []
  function walk(n) {
    result.push(n)
    if (n.children && !n.collapsed) {
      n.children.forEach(walk)
    }
  }
  nodes.forEach(walk)
  return result
}
