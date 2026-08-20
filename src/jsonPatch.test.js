// jsonPatch.test.js — TDD for jsonPatch module
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { diff, diffUnordered, applyPatch, isEqual, pointerToJsonPath } from '../src/jsonPatch.js'

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

// ===== pointerToJsonPath（RFC 6901 → JSONPath）=====

test('pointerToJsonPath: 根路径', () => {
  assert.equal(pointerToJsonPath(''), '$')
})

test('pointerToJsonPath: 单层属性', () => {
  assert.equal(pointerToJsonPath('/a'), '$.a')
})

test('pointerToJsonPath: 嵌套属性', () => {
  assert.equal(pointerToJsonPath('/users/1/age'), '$.users[1].age')
})

test('pointerToJsonPath: 数组数字索引', () => {
  assert.equal(pointerToJsonPath('/items/0/name'), '$.items[0].name')
})

test('pointerToJsonPath: 含连字符/特殊字符用括号表示法', () => {
  assert.equal(pointerToJsonPath('/foo-bar'), '$["foo-bar"]')
})

test('pointerToJsonPath: 转义 ~1 → /（RFC 6901）', () => {
  // 字段名含 /：JSON Pointer 中写作 ~1
  assert.equal(pointerToJsonPath('/a~1b'), '$["a/b"]')
})

test('pointerToJsonPath: 转义 ~0 → ~', () => {
  // 字段名含 ~：JSON Pointer 中写作 ~0
  assert.equal(pointerToJsonPath('/a~0b'), '$["a~b"]')
})

test('pointerToJsonPath: 空格键名', () => {
  assert.equal(pointerToJsonPath('/a b'), '$["a b"]')
})

test('pointerToJsonPath: 真实 diff 输出的路径', () => {
  const patch = diff({ user: { name: 'Alice' } }, { user: { name: 'Bob' } })
  assert.equal(pointerToJsonPath(patch[0].path), '$.user.name')
})

// ===== diffUnordered（内容/无序对比）=====

test('diffUnordered: 数组顺序不同视为一致', () => {
  // 有序 diff 会报 replace，无序 diff 应返回空
  const ordered = diff({ tags: ['a', 'b', 'c'] }, { tags: ['c', 'a', 'b'] })
  assert.ok(ordered.length > 0, '有序对比应检出顺序差异')
  const unordered = diffUnordered({ tags: ['a', 'b', 'c'] }, { tags: ['c', 'a', 'b'] })
  assert.equal(unordered.length, 0, '无序对比应视为一致')
})

test('diffUnordered: 真正的内容差异仍检出', () => {
  const patch = diffUnordered({ tags: ['a', 'b'] }, { tags: ['a', 'c'] })
  assert.ok(patch.length >= 1, '内容不同应检出差异')
})

test('diffUnordered: 嵌套数组顺序无关', () => {
  const a = { users: [{ name: 'Alice' }, { name: 'Bob' }] }
  const b = { users: [{ name: 'Bob' }, { name: 'Alice' }] }
  assert.equal(diffUnordered(a, b).length, 0, '嵌套数组重排应视为一致')
  assert.ok(diff(a, b).length > 0, '有序对比应检出嵌套数组顺序差异')
})

test('diffUnordered: 对象本身本就无序', () => {
  const patch = diffUnordered({ a: 1, b: 2 }, { b: 2, a: 1 })
  assert.equal(patch.length, 0)
})
