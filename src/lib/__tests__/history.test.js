// 纯历史 reducer 测试 —— 驱动 src/lib/history.js 的提取
// 覆盖：addHistory 去重/前置/上限；addFavorite 去重/前置；removeFavorite；clearHistory
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  MAX_HISTORY,
  addHistory,
  addFavorite,
  removeFavorite,
  clearHistory
} from '../history.js'

// 辅助：构造一条历史条目（id 由调用方生成，与 hook 行为一致）
function entry (expression, engine = 'jsonpath', id = Math.random().toString(36).slice(2)) {
  return { id, expression, engine, createdAt: Date.now() }
}

test('MAX_HISTORY 为 50', () => {
  assert.equal(MAX_HISTORY, 50)
})

test('addHistory：新条目前置到头部', () => {
  const prev = [entry('a'), entry('b')]
  const next = addHistory(prev, entry('c'))
  assert.equal(next[0].expression, 'c')
  assert.equal(next.length, 3)
})

test('addHistory：按 expression+engine 去重（同 expression 同 engine 覆盖）', () => {
  const e1 = entry('$.a', 'jsonpath', 'id-1')
  const e2 = entry('$.b', 'jsonpath', 'id-2')
  const prev = [e1, e2]
  // 同 expression 同 engine，新 id 应覆盖旧的，且移到头部
  const next = addHistory(prev, entry('$.a', 'jsonpath', 'id-new'))
  assert.equal(next.length, 2)
  assert.equal(next[0].id, 'id-new')
  assert.ok(!next.find(e => e.id === 'id-1'), '旧条目应被移除')
})

test('addHistory：expression 相同但 engine 不同视为不同条目', () => {
  const prev = [entry('users', 'jsonpath')]
  const next = addHistory(prev, entry('users', 'jmespath'))
  assert.equal(next.length, 2)
})

test('addHistory：超过 MAX_HISTORY 截断头部最新的 MAX_HISTORY 条', () => {
  const prev = []
  for (let i = 0; i < 60; i++) prev.push(entry(`$.${i}`))
  // 当前实现：每次 add 都 slice(0, 50)，所以 60 条输入需要先截断为 50
  // 直接验证 addHistory 的 slice 行为：从 50 条加到 51，再截回 50
  const fifty = prev.slice(0, 50)
  const next = addHistory(fifty, entry('$.new'))
  assert.equal(next.length, MAX_HISTORY)
  assert.equal(next[0].expression, '$.new')
})

test('addHistory：不修改原数组（不可变）', () => {
  const prev = [entry('a')]
  const snapshot = prev.slice()
  addHistory(prev, entry('b'))
  assert.deepEqual(prev, snapshot)
})

test('addFavorite：新收藏前置', () => {
  const prev = [{ id: 'f1', expression: '$.a', engine: 'jsonpath' }]
  const next = addFavorite(prev, { id: 'f2', expression: '$.b', engine: 'jmespath' })
  assert.equal(next[0].expression, '$.b')
  assert.equal(next.length, 2)
})

test('addFavorite：同 expression+engine 去重', () => {
  const prev = [{ id: 'f1', expression: '$.a', engine: 'jsonpath' }]
  const next = addFavorite(prev, { id: 'f2', expression: '$.a', engine: 'jsonpath' })
  assert.equal(next.length, 1)
  assert.equal(next[0].id, 'f2')
})

test('removeFavorite：按 id 移除', () => {
  const prev = [
    { id: 'f1', expression: '$.a' },
    { id: 'f2', expression: '$.b' },
    { id: 'f3', expression: '$.c' }
  ]
  const next = removeFavorite(prev, 'f2')
  assert.equal(next.length, 2)
  assert.deepEqual(next.map(e => e.id), ['f1', 'f3'])
})

test('removeFavorite：id 不存在时原样返回同等长度', () => {
  const prev = [{ id: 'f1' }]
  const next = removeFavorite(prev, 'nope')
  assert.equal(next.length, 1)
})

test('clearHistory 返回空数组', () => {
  assert.deepEqual(clearHistory(), [])
})
