// pathGenerator.js — 从树节点生成多格式路径

/**
 * 将 JSONPath 中的数组索引转为 JSON Pointer 段
 * @param {string} segment
 * @returns {string}
 */
function jsonPathSegmentToPointer(segment) {
  return segment.replace(/\[(\d+)\]/g, '$1')
}

/**
 * 将 JSONPath（如 $.users[0].name）转为 JSON Pointer（如 /users/0.name）
 * 注意：对象属性中的 . 在 Pointer 中保留，数组索引转为 /
 * @param {string} jsonPath
 * @returns {string}
 */
export function jsonPathToPointer(jsonPath) {
  if (!jsonPath || jsonPath === '$') return ''
  let path = jsonPath
  if (path.startsWith('.')) path = '$' + path
  if (!path.startsWith('$')) path = '$.' + path
  // 移除开头的 $.
  path = path.slice(2)
  if (!path) return ''
  // 分割：按 . 和 [...] 处理
  const parts = path.match(/[^.[\]]+|\[\d+\]/g) || []
  const pointerParts = parts.map(part => {
    if (part.startsWith('[')) {
      // 数组索引 [0] → 0
      return part.slice(1, -1)
    }
    // 属性名：应用 JSON Pointer 转义（~ → ~0, / → ~1）
    return escapePointerToken(part)
  })
  return '/' + pointerParts.join('/')
}

/**
 * 内部辅助：对 JSON Pointer 片段应用 RFC 6901 转义
 * @param {string} token
 * @returns {string}
 */
export function escapePointerToken(token) {
  return token.replace(/~/g, '~0').replace(/\//g, '~1')
}

/**
 * 内部辅助：反转义
 * @param {string} token
 * @returns {string}
 */
export function unescapePointerToken(token) {
  return token.replace(/~1/g, '/').replace(/~0/g, '~')
}

/**
 * 将内部 path（如 $.users[0].name 或 users[0].name）转为 JSON Pointer
 * @param {string} path
 * @returns {string}
 */
export function pathToPointer(path) {
  return jsonPathToPointer(path)
}

/**
 * 从树节点生成多种格式的路径
 * @param {{ key: string|number, path: string }} node - 树节点
 * @returns {{ jsonpath: string, jsonpointer: string }}
 */
export function generatePaths(node) {
  if (!node || !node.path) return { jsonpath: '$', jsonpointer: '' }
  const jsonpath = node.path
  const jsonpointer = pathToPointer(jsonpath)
  return { jsonpath, jsonpointer }
}
