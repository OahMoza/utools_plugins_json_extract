// 历史 / 收藏的纯 reducer 逻辑（无 React、无副作用）
// 由 useExpressionHistory hook 与测试共同驱动
export const MAX_HISTORY = 50

// 按 expression+engine 去重，新条目前置，截断到 max
export function addHistory (prev, entry) {
  const filtered = prev.filter(
    e => !(e.expression === entry.expression && e.engine === entry.engine)
  )
  return [entry, ...filtered].slice(0, MAX_HISTORY)
}

// 收藏无上限，同样按 expression+engine 去重后前置
export function addFavorite (prev, entry) {
  const filtered = prev.filter(
    e => !(e.expression === entry.expression && e.engine === entry.engine)
  )
  return [entry, ...filtered]
}

// 按 id 移除收藏
export function removeFavorite (prev, id) {
  return prev.filter(e => e.id !== id)
}

// 清空历史
export function clearHistory () {
  return []
}
