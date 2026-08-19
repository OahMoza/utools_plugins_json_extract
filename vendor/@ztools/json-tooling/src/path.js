// 路径生成与双引擎路径互转（从 ztools-plugins-json/src/utils/pathGenerator.ts 移植）

/** 从父路径 + 子 key 生成 JSONPath 片段 */
export function generatePathFromKey(key, parentPath, isArray) {
  if (parentPath === '$') {
    if (typeof key === 'number') return `$[${key}]`
    return `$.${key}`
  }
  if (isArray) return `${parentPath}[${key}]`
  return `${parentPath}.${key}`
}

/**
 * 把内部树路径（如 $.data.users[0].name）规范化为标准 JSONPath。
 * 内部路径本身已是 JSONPath 子集，此处做兜底清洗。
 */
export function generatePathFromNode(nodePath) {
  if (!nodePath) return '$'
  if (nodePath.startsWith('$')) return nodePath
  return `$.${nodePath}`
}

/**
 * 把 JSONPath 转为等价的 JMESPath（简化版）。
 * 规则：
 *   $.a.b[0].c        →  a.b[0].c
 *   $..x              →  ..x（递归下降提示）
 *   $ 本身            →  空（表示根）
 */
export function suggestJmesPath(jsonPath) {
  if (!jsonPath || jsonPath === '$') return ''
  if (jsonPath.startsWith('$..')) return jsonPath.slice(1) // $..x → ..x
  if (jsonPath.startsWith('$.')) return jsonPath.slice(2)
  if (jsonPath.startsWith('$')) return jsonPath.slice(1)
  return jsonPath
}

/**
 * 把 JMESPath 转回 JSONPath（简化版）。
 * 含 JMESPath 专属语法（过滤 `[]`、管道 `|`、函数）则原样返回。
 */
export function suggestJsonPath(jmesPath) {
  if (!jmesPath) return '$'
  if (/[?|`(]/.test(jmesPath)) return jmesPath
  return `$.${jmesPath}`
}
