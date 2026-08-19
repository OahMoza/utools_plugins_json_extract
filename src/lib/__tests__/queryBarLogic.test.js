// QueryBar 过滤逻辑测试 —— 驱动 src/lib/queryBarLogic.js 的提取
// 覆盖：按 engine 过滤、按 expression 子串匹配、最多 8 条、空输入返回全部 engine 匹配
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filterHistory } from '../queryBarLogic.js'

function hist (expr, engine) {
  return { id: Math.random().toString(36).slice(2), expression: expr, engine, createdAt: 0 }
}

const history = [
  hist('$.users[*].name', 'jsonpath'),
  hist('$.users[*].age', 'jsonpath'),
  hist('users[*].name', 'jmespath'),
  hist('meta.total', 'jsonpath'),
  hist('$.a', 'jsonpath'),
  hist('$.b', 'jsonpath'),
  hist('$.c', 'jsonpath'),
  hist('$.d', 'jsonpath'),
  hist('$.e', 'jsonpath'),
  hist('$.f', 'jsonpath')
]

test('filterHistory：按 engine 过滤', () => {
  const out = filterHistory(history, 'jmespath', '')
  assert.ok(out.every(h => h.engine === 'jmespath'))
  assert.equal(out.length, 1)
})

test('filterHistory：按 expression 子串匹配', () => {
  const out = filterHistory(history, 'jsonpath', 'users')
  assert.ok(out.every(h => h.expression.includes('users')))
  assert.equal(out.length, 2)
})

test('filterHistory：最多返回 8 条', () => {
  // 10 条 jsonpath，空 expression 全匹配，应截断为 8
  const out = filterHistory(history, 'jsonpath', '')
  assert.equal(out.length, 8)
})

test('filterHistory：空 history 返回空', () => {
  assert.deepEqual(filterHistory([], 'jsonpath', ''), [])
})

test('filterHistory：大小写敏感（与组件 includes 一致）', () => {
  const out = filterHistory(history, 'jsonpath', 'USERS')
  assert.equal(out.length, 0, '组件使用 includes，大小写不一致应不匹配')
})

test('filterHistory：expression 为空字符串时匹配该 engine 全部', () => {
  const out = filterHistory(history, 'jsonpath', '')
  assert.ok(out.length > 0)
  assert.ok(out.every(h => h.engine === 'jsonpath'))
})
