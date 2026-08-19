// jsonSearch.js — JSON 文本搜索逻辑

/**
 * 在文本中查找所有匹配
 * @param {string} text
 * @param {string} query
 * @param {{ caseSensitive?: boolean }} options
 * @returns {{ line: number, column: number, length: number }[]}
 */
export function findMatches(text, query, options = {}) {
  if (!query || !text) return []
  const { caseSensitive = true } = options
  const matches = []
  const searchText = caseSensitive ? text : text.toLowerCase()
  const searchQuery = caseSensitive ? query : query.toLowerCase()

  let lineStart = 0
  let lineNum = 1
  let idx = 0

  while ((idx = searchText.indexOf(searchQuery, idx)) !== -1) {
    // 计算行号和列号
    while (lineStart < idx && lineStart < text.length) {
      const nl = text.indexOf('\n', lineStart)
      if (nl === -1 || nl >= idx) break
      lineNum++
      lineStart = nl + 1
    }
    matches.push({ line: lineNum, column: idx - lineStart, length: query.length })
    idx += searchQuery.length
    // 重置行计数（简化：每次重新计算）
    lineNum = 1
    lineStart = 0
  }

  return matches
}

/**
 * 获取指定索引的匹配
 * @param {Array} matches
 * @param {number} index
 * @returns {object|undefined}
 */
export function getMatchAt(matches, index) {
  if (matches.length === 0) return undefined
  const i = ((index % matches.length) + matches.length) % matches.length
  return matches[i]
}
