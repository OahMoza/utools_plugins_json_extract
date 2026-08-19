import { test } from 'node:test'
import assert from 'node:assert/strict'
import { query, queryJmespath, queryJsonpath, QueryError } from '../src/index.js'

const sample = {
  users: [
    { name: 'Alice', age: 30, active: true },
    { name: 'Bob', age: 25, active: false }
  ],
  meta: { total: 2 }
}

test('jmespath 查询', () => {
  const r = queryJmespath(sample, 'users[0].name')
  assert.equal(r.error, null)
  assert.equal(r.data, 'Alice')
  assert.equal(r.count, 1)
})

test('jmespath 数组投影', () => {
  const r = queryJmespath(sample, 'users[*].name')
  assert.equal(r.error, null)
  assert.deepEqual(r.data, ['Alice', 'Bob'])
  assert.equal(r.count, 2)
})

test('jsonpath 查询', () => {
  const r = queryJsonpath(sample, '$.users[0].name')
  assert.equal(r.error, null)
  // jsonpath-plus wrap:true 返回数组
  assert.deepEqual(r.data, ['Alice'])
})

test('jsonpath 通配', () => {
  const r = queryJsonpath(sample, '$.users[*].name')
  assert.equal(r.error, null)
  assert.deepEqual(r.data, ['Alice', 'Bob'])
})

test('空表达式返回空', () => {
  const r = query(sample, '   ', 'jmespath')
  assert.equal(r.data, null)
  assert.equal(r.count, 0)
  assert.equal(r.error, null)
})

test('空数据返回错误提示', () => {
  const r = query(null, 'a.b', 'jsonpath')
  assert.equal(r.error, '请先输入 JSON 数据')
})

test('非法表达式返回错误不抛异常', () => {
  const r = query(sample, ':::invalid:::', 'jmespath')
  assert.ok(r.error, '应返回错误信息')
  assert.equal(r.data, null)
})

test('未知引擎抛 QueryError', () => {
  assert.throws(() => query(sample, 'a', 'unknown-engine'), QueryError)
})
