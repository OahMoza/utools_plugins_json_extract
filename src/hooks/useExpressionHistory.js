// useExpressionHistory —— 查询历史 + 收藏，持久化到 utools.dbStorage（localStorage 兜底）
// 移植自 ztools-plugins-json/src/hooks/useExpressionHistory.ts
import { useState, useEffect, useCallback } from 'react'

const MAX_HISTORY = 50
const KEY_H = 'json:history'
const KEY_F = 'json:favorites'

function load(key, fallback) {
  try {
    if (typeof window !== 'undefined' && window.utools?.dbStorage) {
      const v = window.utools.dbStorage.getItem(key)
      return v ? JSON.parse(v) : fallback
    }
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}

function save(key, value) {
  try {
    const json = JSON.stringify(value)
    if (typeof window !== 'undefined' && window.utools?.dbStorage) {
      window.utools.dbStorage.setItem(key, json)
    }
    localStorage.setItem(key, json)
  } catch {}
}

export default function useExpressionHistory() {
  const [history, setHistory] = useState(() => load(KEY_H, []))
  const [favorites, setFavorites] = useState(() => load(KEY_F, []))

  useEffect(() => { save(KEY_H, history) }, [history])
  useEffect(() => { save(KEY_F, favorites) }, [favorites])

  const addToHistory = useCallback((expression, engine) => {
    if (!expression.trim()) return
    const entry = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, expression, engine, createdAt: Date.now() }
    setHistory(prev => {
      const filtered = prev.filter(e => !(e.expression === expression && e.engine === engine))
      return [entry, ...filtered].slice(0, MAX_HISTORY)
    })
  }, [])

  const addToFavorites = useCallback((expression, engine, name) => {
    if (!expression.trim()) return
    const entry = { id: `fav-${Date.now()}`, expression, engine, name, createdAt: Date.now() }
    setFavorites(prev => {
      const filtered = prev.filter(e => !(e.expression === expression && e.engine === engine))
      return [entry, ...filtered]
    })
  }, [])

  const removeFromFavorites = useCallback((id) => {
    setFavorites(prev => prev.filter(e => e.id !== id))
  }, [])

  const clearHistory = useCallback(() => setHistory([]), [])

  return { history, favorites, addToHistory, addToFavorites, removeFromFavorites, clearHistory }
}
