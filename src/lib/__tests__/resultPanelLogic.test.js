// ResultPanel 纯逻辑测试 —— 驱动 src/lib/resultPanelLogic.js 的提取
// 覆盖：findMatches 多行/多命中/大小写/转义；deduplicateArray 去重
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findMatches, deduplicateArray } from '../resultPanelLogic.js'

test('findMatches：空查询返回空', () => {
  assert.deepEqual(findMatches('a\nb', ''), [])
})

test('findMatches：单行单命中，行号与偏移正确', () => {
  const matches = findMatches('hello world', 'world')
  assert.equal(matches.length, 1)
  assert.deepEqual(matches[0], { line: 1, lineOffset: 6, length: 5, globalOffset: 6 })
})

test('findMatches：大小写不敏感', () => {
  const matches = findMatches('Hello World', 'hello')
  assert.equal(matches.length, 1)
  assert.equal(matches[0].lineOffset, 0)
})

test('findMatches：同行多命中（命中后按 query 长度推进）', () => {
  // 'aaa aaa aaa' 中找 'aa'：命中 0，推进 +2 → 从 2 起找到 4，推进 +2 → 从 6 起找到 8
  const matches = findMatches('aaa aaa aaa', 'aa')
  assert.equal(matches.length, 3)
  assert.deepEqual(matches.map(m => m.lineOffset), [0, 4, 8])
})

test('findMatches：跨行命中，globalOffset 累加换行', () => {
  const matches = findMatches('foo\nbar\nbaz', 'bar')
  assert.equal(matches.length, 1)
  assert.equal(matches[0].line, 2)
  assert.equal(matches[0].lineOffset, 0)
  assert.equal(matches[0].globalOffset, 4) // 'foo\n' = 4
})

test('findMatches：无匹配返回空', () => {
  assert.deepEqual(findMatches('abc', 'zzz'), [])
})

test('deduplicateArray：按 JSON.stringify 去重，保留首次出现顺序', () => {
  const out = deduplicateArray([{ a: 1 }, { a: 2 }, { a: 1 }, { a: 2 }, { a: 3 }])
  assert.equal(out.length, 3)
  assert.deepEqual(out, [{ a: 1 }, { a: 2 }, { a: 3 }])
})

test('deduplicateArray：基本类型按值去重', () => {
  const out = deduplicateArray([1, 2, 1, 3, 2])
  assert.deepEqual(out, [1, 2, 3])
})

test('deduplicateArray：空数组原样返回', () => {
  assert.deepEqual(deduplicateArray([]), [])
})

test('deduplicateArray：不修改原数组', () => {
  const src = [{ a: 1 }, { a: 1 }]
  const snapshot = JSON.parse(JSON.stringify(src))
  deduplicateArray(src)
  assert.deepEqual(src, snapshot)
})
