// QueryBar 的纯逻辑：历史下拉过滤
// 从 QueryBar.jsx 提取，便于 node:test 直接验证

// 按 engine 精确匹配 + expression 子串匹配过滤历史，最多返回 limit 条
export function filterHistory (history, engine, expression, limit = 8) {
  const needle = (expression || '').trim()
  return history
    .filter(h => h.engine === engine && h.expression.includes(needle))
    .slice(0, limit)
}
