import { test } from 'node:test'
import assert from 'node:assert/strict'
import { jsonToTree, getNodeValue, getNodeSummary, flattenTree, toggleNode } from '../src/tree.js'
import { generatePathFromKey, generatePathFromNode, suggestJmesPath, suggestJsonPath } from '../src/path.js'

test('jsonToTree 基本对象', () => {
  const node = jsonToTree({ a: 1, b: 'x' })
  assert.equal(node.type, 'object')
  assert.equal(node.childCount, 2)
  assert.ok(node.collapsed === false) // <=5 不折叠
  assert.equal(node.children[0].path, '$.a')
  assert.equal(node.children[1].path, '$.b')
})

test('jsonToTree 数组索引路径', () => {
  const node = jsonToTree([10, 20, 30])
  assert.equal(node.type, 'array')
  assert.equal(node.children[0].path, '$[0]')
  assert.equal(node.children[2].path, '$[2]')
})

test('jsonToTree 嵌套路径', () => {
  const node = jsonToTree({ users: [{ name: 'Alice' }] })
  const users = node.children[0]
  assert.equal(users.path, '$.users')
  const first = users.children[0]
  assert.equal(first.path, '$.users[0]')
  assert.equal(first.children[0].path, '$.users[0].name')
})

test('jsonToTree >5 子节点默认折叠', () => {
  const obj = {}
  for (let i = 0; i < 8; i++) obj[`k${i}`] = i
  const node = jsonToTree(obj)
  assert.equal(node.collapsed, true)
})

test('jsonToTree >50 子节点不生成 children', () => {
  const arr = new Array(60).fill(1)
  const node = jsonToTree(arr)
  assert.equal(node.childCount, 60)
  assert.equal(node.children, undefined)
})

test('jsonToTree 循环引用', () => {
  const a = { name: 'a' }
  a.ref = a
  const node = jsonToTree(a)
  assert.equal(node.children[1].circular, true)
  assert.equal(node.children[1].value, '[Circular]')
})

test('jsonToTree 最大深度截断', () => {
  let cur = {}
  const root = cur
  for (let i = 0; i < 25; i++) { cur.next = {}; cur = cur.next }
  const node = jsonToTree(root)
  // 截断在 depth > 20：最深数据节点在 depth 20，depth 21 为 [Max Depth] 标记
  let depth = 0
  let n = node
  while (n.children && n.children[0]) { depth++; n = n.children[0] }
  assert.ok(depth <= 21, `应被截断在 MAX_DEPTH 附近，实际 ${depth}`)
  assert.equal(n.value, '[Max Depth]')
})

test('getNodeValue', () => {
  assert.equal(getNodeValue({ type: 'string', value: 'hi' }), '"hi"')
  assert.equal(getNodeValue({ type: 'number', value: 42 }), '42')
  assert.equal(getNodeValue({ type: 'boolean', value: true }), 'true')
  assert.equal(getNodeValue({ type: 'null', value: null }), 'null')
})

test('getNodeSummary', () => {
  assert.equal(getNodeSummary({ type: 'array', childCount: 3 }), '[3]')
  assert.equal(getNodeSummary({ type: 'object', childCount: 2 }), '{2}')
  assert.equal(getNodeSummary({ type: 'string', value: 'x' }), '"x"')
})

test('flattenTree 尊重 collapsed', () => {
  const root = jsonToTree({ a: { b: 1, c: 2 } })
  // a 默认展开（<=5）
  const flat = flattenTree([root])
  // root + a + b + c = 4 个可见
  assert.equal(flat.length, 4)
  // 折叠 root 后只剩 root
  const collapsed = toggleNode(root)
  assert.equal(flattenTree([collapsed]).length, 1)
})

test('toggleNode 不可变', () => {
  const n = { collapsed: false }
  const r = toggleNode(n)
  assert.equal(n.collapsed, false)
  assert.equal(r.collapsed, true)
})

test('generatePathFromKey', () => {
  assert.equal(generatePathFromKey('a', '$', false), '$.a')
  assert.equal(generatePathFromKey(0, '$', true), '$[0]')
  assert.equal(generatePathFromKey('b', '$.a', false), '$.a.b')
  assert.equal(generatePathFromKey(2, '$.a', true), '$.a[2]')
})

test('generatePathFromNode 规范化', () => {
  assert.equal(generatePathFromNode('$.a.b'), '$.a.b')
  assert.equal(generatePathFromNode('a.b'), '$.a.b')
  assert.equal(generatePathFromNode(''), '$')
})

test('suggestJmesPath', () => {
  assert.equal(suggestJmesPath('$.users[0].name'), 'users[0].name')
  assert.equal(suggestJmesPath('$..price'), '..price')
  assert.equal(suggestJmesPath('$'), '')
})

test('suggestJsonPath', () => {
  assert.equal(suggestJsonPath('users[0].name'), '$.users[0].name')
  // 含 JMESPath 专属语法原样返回
  assert.equal(suggestJsonPath('items[?price > `100`].name'), 'items[?price > `100`].name')
  assert.equal(suggestJsonPath(''), '$')
})
