// ResultPanel 的纯逻辑：代码搜索命中定位、数组去重
// 从 ResultPanel.jsx / App.jsx 提取，便于 node:test 直接验证

// 在文本中定位 query 的全部命中（大小写不敏感），返回每行的命中信息
export function findMatches (text, query) {
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
      matches.push({
        line: i + 1,
        lineOffset: idx,
        length: query.length,
        globalOffset: offset + idx
      })
      idx += q.length
    }
    offset += line.length + 1
  }
  return matches
}

// 数组去重：以 JSON.stringify 结果为 key，保留首次出现顺序
export function deduplicateArray (arr) {
  const seen = new Set()
  return arr.filter((item) => {
    const key = JSON.stringify(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
