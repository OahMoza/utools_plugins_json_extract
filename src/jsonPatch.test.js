// jsonPatch.test.js — TDD for jsonPatch module
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { diff, applyPatch, isEqual } from '../src/jsonPatch.js'

test('diff: 无变化返回空数组', () => {
  assert.deepEqual(diff({ a: 1 }, { a: 1 }), [])
  assert.deepEqual(diff([1, 2], [1, 2]), [])
})

test('diff: 修改值', () => {
  const patch = diff({ a: 1 }, { a: 2 })
  assert.equal(patch.length, 1)
  assert.equal(patch[0].op, 'replace')
  assert.equal(patch[0].path, '/a')
  assert.equal(patch[0].value, 2)
})

test('diff: 添加属性', () => {
  const patch = diff({ a: 1 }, { a: 1, b: 2 })
  assert.equal(patch.length, 1)
  assert.equal(patch[0].op, 'add')
  assert.equal(patch[0].path, '/b')
  assert.equal(patch[0].value, 2)
})

test('diff: 删除属性', () => {
  const patch = diff({ a: 1, b: 2 }, { a: 1 })
  assert.equal(patch.length, 1)
  assert.equal(patch[0].op, 'remove')
  assert.equal(patch[0].path, '/b')
})

test('diff: 数组元素变化', () => {
  const patch = diff([1, 2, 3], [1, 4, 3])
  assert.ok(patch.length >= 1)
  const replace = patch.find(p => p.path === '/1')
  assert.ok(replace)
  assert.equal(replace.value, 4)
})

test('diff: 嵌套对象', () => {
  const patch = diff({ user: { name: 'Alice' } }, { user: { name: 'Bob' } })
  assert.equal(patch.length, 1)
  assert.equal(patch[0].path, '/user/name')
  assert.equal(patch[0].value, 'Bob')
})

test('isEqual: 相同返回 true', () => {
  assert.equal(isEqual({ a: 1 }, { a: 1 }), true)
  assert.equal(isEqual([1, 2], [1, 2]), true)
})

test('isEqual: 不同返回 false', () => {
  assert.equal(isEqual({ a: 1 }, { a: 2 }), false)
  assert.equal(isEqual({ a: 1 }, { a: 1, b: 2 }), false)
})

test('applyPatch: 应用 patch 得到目标', () => {
  const a = { name: 'Alice', age: 30 }
  const b = { name: 'Bob', age: 30, city: 'NYC' }
  const patch = diff(a, b)
  const result = applyPatch(a, patch)
  assert.deepEqual(result, b)
})

test('applyPatch: round-trip 保持数据', () => {
  const original = { users: [{ id: 1, tags: ['a', 'b'] }] }
  const modified = { users: [{ id: 1, tags: ['a', 'c'] }] }
  const patch = diff(original, modified)
  const result = applyPatch(original, patch)
  assert.deepEqual(result, modified)
})

test('applyPatch: 不修改原对象', () => {
  const doc = { a: 1 }
  const patch = [{ op: 'replace', path: '/a', value: 2 }]
  applyPatch(doc, patch)
  assert.equal(doc.a, 1) // 原对象不变
})
