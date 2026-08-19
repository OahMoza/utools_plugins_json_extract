// json5Parser.js — JSON5 容错解析 fallback
import JSON5 from 'json5'

/**
 * 先尝试 JSON.parse，失败则 fallback 到 JSON5.parse
 * @param {string} text
 * @returns {{ data: any, usedJSON5: boolean, error: string|null }}
 */
export function parseWithFallback(text) {
  if (!text || !text.trim()) {
    return { data: undefined, usedJSON5: false, error: '输入为空' }
  }
  try {
    const data = JSON.parse(text)
    return { data, usedJSON5: false, error: null }
  } catch (strictErr) {
    try {
      const data = JSON5.parse(text)
      return { data, usedJSON5: true, error: null }
    } catch (json5Err) {
      return { data: undefined, usedJSON5: false, error: json5Err.message || '解析失败' }
    }
  }
}
