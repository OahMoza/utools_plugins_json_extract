// pathGenerator.test.js — TDD for pathGenerator module
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generatePaths, pathToPointer, jsonPathToPointer } from '../src/pathGenerator.js'

// 树节点结构（与 TreeView 一致）
const makeNode = (key, path, type = 'string', value = 'x') => ({ key, path, type, value })

test('generatePaths: 根节点', () => {
  const node = makeNode('$', '$')
  const paths = generatePaths(node)
  assert.equal(paths.jsonpath, '$')
  assert.equal(paths.jsonpointer, '')
})

test('generatePaths: 简单对象属性', () => {
  const node = makeNode('name', '$.name')
  const paths = generatePaths(node)
  assert.equal(paths.jsonpath, '$.name')
  assert.equal(paths.jsonpointer, '/name')
})

test('generatePaths: 嵌套对象', () => {
  const node = makeNode('city', '$.address.city')
  const paths = generatePaths(node)
  assert.equal(paths.jsonpath, '$.address.city')
  assert.equal(paths.jsonpointer, '/address/city')
})

test('generatePaths: 数组索引', () => {
  const node = makeNode(0, '$.items[0]')
  const paths = generatePaths(node)
  assert.equal(paths.jsonpath, '$.items[0]')
  assert.equal(paths.jsonpointer, '/items/0')
})

test('generatePaths: 混合嵌套', () => {
  const node = makeNode('name', '$.users[0].name')
  const paths = generatePaths(node)
  assert.equal(paths.jsonpath, '$.users[0].name')
  assert.equal(paths.jsonpointer, '/users/0/name')
})

test('pathToPointer: 简单路径', () => {
  assert.equal(pathToPointer('$.foo'), '/foo')
  assert.equal(pathToPointer('$.foo.bar'), '/foo/bar')
})

test('pathToPointer: 数组索引', () => {
  assert.equal(pathToPointer('$.items[0]'), '/items/0')
  assert.equal(pathToPointer('$.a[0].b[1]'), '/a/0/b/1')
})

test('pathToPointer: 特殊字符（含 ~ 和 /）', () => {
  // JSON Pointer 转义: ~ → ~0, / → ~1 (RFC 6901)
  assert.equal(pathToPointer('$.a~b'), '/a~0b')
  assert.equal(pathToPointer('$.a/b'), '/a~1b')
})

test('pathToPointer: 根路径', () => {
  assert.equal(pathToPointer('$'), '')
})

test('jsonPathToPointer: 从 JSONPath 表达式转换', () => {
  assert.equal(jsonPathToPointer('$.data.users[0].name'), '/data/users/0/name')
  assert.equal(jsonPathToPointer('$'), '')
})
