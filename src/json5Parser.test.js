// json5Parser.test.js — TDD for json5Parser module
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseWithFallback } from '../src/json5Parser.js'

test('parseWithFallback: 严格 JSON 成功', () => {
  const result = parseWithFallback('{"a":1,"b":2}')
  assert.equal(result.error, null)
  assert.deepEqual(result.data, { a: 1, b: 2 })
  assert.equal(result.usedJSON5, false)
})

test('parseWithFallback: JSON5 单行注释', () => {
  const result = parseWithFallback('{"a":1,//comment\n"b":2}')
  assert.equal(result.error, null)
  assert.deepEqual(result.data, { a: 1, b: 2 })
  assert.equal(result.usedJSON5, true)
})

test('parseWithFallback: JSON5 多行注释', () => {
  const result = parseWithFallback('{"a":1,/* comment */"b":2}')
  assert.equal(result.error, null)
  assert.deepEqual(result.data, { a: 1, b: 2 })
  assert.equal(result.usedJSON5, true)
})

test('parseWithFallback: JSON5 尾逗号', () => {
  const result = parseWithFallback('{"a":1,"b":2,}')
  assert.equal(result.error, null)
  assert.deepEqual(result.data, { a: 1, b: 2 })
  assert.equal(result.usedJSON5, true)
})

test('parseWithFallback: JSON5 无引号键', () => {
  const result = parseWithFallback('{a:1,b:2}')
  assert.equal(result.error, null)
  assert.deepEqual(result.data, { a: 1, b: 2 })
  assert.equal(result.usedJSON5, true)
})

test('parseWithFallback: JSON5 单引号字符串', () => {
  const result = parseWithFallback("{'a':'hello'}")
  assert.equal(result.error, null)
  assert.deepEqual(result.data, { a: 'hello' })
  assert.equal(result.usedJSON5, true)
})

test('parseWithFallback: 非法格式返回错误', () => {
  const result = parseWithFallback('{invalid json}')
  assert.ok(result.error)
  assert.equal(result.data, undefined)
})

test('parseWithFallback: 空字符串返回错误', () => {
  const result = parseWithFallback('')
  assert.ok(result.error)
})
