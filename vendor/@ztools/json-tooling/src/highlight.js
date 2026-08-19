// JSON 语法高亮 / 格式化 / 压缩 / 错误定位（从 ztools-plugins-json/src/utils/syntaxHighlight.ts 移植）

export function getType(value) {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

export function getTypeClass(type) {
  return type
}

export function highlightJson(json) {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(?:[^"\\]|\\.)*")(\s*:)?/g,
      (_m, str, colon) => {
        if (colon) {
          return `<span class="syntax-key">${str}</span><span class="syntax-bracket">:</span>`
        }
        return `<span class="syntax-string">${str}</span>`
      }
    )
    .replace(/\b(true|false)\b/g, '<span class="syntax-boolean">$1</span>')
    .replace(/\bnull\b/g, '<span class="syntax-null">null</span>')
    .replace(
      /\b(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g,
      '<span class="syntax-number">$1</span>'
    )
    .replace(/([{}\[\]])/g, '<span class="syntax-bracket">$1</span>')
}

export function formatJson(json, indent = 2) {
  try {
    const parsed = JSON.parse(json)
    return JSON.stringify(parsed, null, indent)
  } catch {
    return json
  }
}

export function minifyJson(json) {
  try {
    const parsed = JSON.parse(json)
    return JSON.stringify(parsed)
  } catch {
    return json
  }
}

export function getJsonErrorPosition(json) {
  try {
    JSON.parse(json)
    return null
  } catch (e) {
    const msg = e.message || ''
    const posMatch = msg.match(/position\s+(\d+)/i)
    if (!posMatch) {
      const lineMatch = msg.match(/line\s+(\d+)/i)
      const colMatch = msg.match(/column\s+(\d+)/i)
      return {
        line: lineMatch ? parseInt(lineMatch[1]) : 1,
        column: colMatch ? parseInt(colMatch[1]) : 1,
        message: msg
      }
    }
    const pos = parseInt(posMatch[1])
    const before = json.substring(0, pos)
    const lines = before.split('\n')
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1,
      message: msg
    }
  }
}
