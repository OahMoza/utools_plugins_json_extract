// TreeView 纯逻辑测试 —— 驱动 src/lib/treeViewLogic.js 的提取
// 覆盖：搜索匹配路径集合、初始折叠集（默认模式 / 搜索模式自动展开祖先）、不可变 toggle
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  collectMatchPaths,
  computeInitialCollapsed,
  toggleInSet,
  nodeMatches,
  filterTree,
  countMatches
} from '../treeViewLogic.js'

// 构造一个简单树（与 @ztools/json-tooling 的 jsonToTree 输出同形状）
function buildTree () {
  return [
    {
      path: '$',
      key: '$',
      type: 'object',
      collapsed: false,
      childCount: 2,
      value: undefined,
      children: [
        {
          path: '$.users',
          key: 'users',
          type: 'array',
          collapsed: false,
          childCount: 2,
          value: undefined,
          children: [
            {
              path: '$.users[0]',
              key: 0,
              type: 'object',
              collapsed: false,
              childCount: 2,
              value: undefined,
              children: [
                { path: '$.users[0].name', key: 'name', type: 'string', value: 'Alice' },
                { path: '$.users[0].age', key: 'age', type: 'number', value: 30 }
              ]
            },
            {
              path: '$.users[1]',
              key: 1,
              type: 'object',
              collapsed: false,
              childCount: 1,
              value: undefined,
              children: [
                { path: '$.users[1].name', key: 'name', type: 'string', value: 'Bob' }
              ]
            }
          ]
        },
        {
          path: '$.meta',
          key: 'meta',
          type: 'object',
          collapsed: false,
          childCount: 1,
          value: undefined,
          children: [
            { path: '$.meta.total', key: 'total', type: 'number', value: 2 }
          ]
        }
      ]
    }
  ]
}

test('collectMatchPaths：空查询返回空集合', () => {
  const set = collectMatchPaths(buildTree(), '')
  assert.equal(set.size, 0)
})

test('collectMatchPaths：按 key 子串匹配（大小写不敏感）', () => {
  const set = collectMatchPaths(buildTree(), 'NAME')
  assert.ok(set.has('$.users[0].name'))
  assert.ok(set.has('$.users[1].name'))
  assert.ok(!set.has('$.users[0].age'))
})

test('collectMatchPaths：按 value 子串匹配', () => {
  const set = collectMatchPaths(buildTree(), 'bob')
  assert.ok(set.has('$.users[1].name'))
})

test('collectMatchPaths：无匹配返回空集合', () => {
  const set = collectMatchPaths(buildTree(), 'zzz')
  assert.equal(set.size, 0)
})

test('computeInitialCollapsed：默认模式按节点自身 collapsed 标记折叠', () => {
  const tree = buildTree()
  tree[0].children[0].collapsed = true // $.users 标记默认折叠
  const set = computeInitialCollapsed(tree, false, '')
  assert.ok(set.has('$.users'))
  assert.ok(!set.has('$.meta'))
})

test('computeInitialCollapsed：搜索模式折叠全部容器，再展开匹配节点的祖先', () => {
  // 搜索 "Alice" 只匹配 $.users[0].name；其祖先 $.users[0] / $.users / $ 应被展开（不在 set 中）
  const tree = buildTree()
  const set = computeInitialCollapsed(tree, true, 'Alice')
  // 非祖先容器仍保持折叠
  assert.ok(set.has('$.meta'), '与匹配无关的容器应折叠')
  assert.ok(set.has('$.users[1]'), '与匹配无关的子树应折叠')
  // 祖先被展开
  assert.ok(!set.has('$.users'), '匹配节点的祖先 $.users 应展开')
  assert.ok(!set.has('$.users[0]'), '匹配节点的祖先 $.users[0] 应展开')
  assert.ok(!set.has('$'), '匹配节点的根祖先 $ 应展开')
  // 叶子节点（无 children）不在折叠集中
  assert.ok(!set.has('$.users[0].name'))
})

test('computeInitialCollapsed：搜索模式无匹配时全部容器折叠', () => {
  const set = computeInitialCollapsed(buildTree(), true, 'zzz')
  assert.ok(set.has('$'))
  assert.ok(set.has('$.users'))
  assert.ok(set.has('$.users[0]'))
})

test('toggleInSet：折叠 → 展开（不可变）', () => {
  const original = new Set(['$.users'])
  const next = toggleInSet(original, '$.users')
  assert.ok(!next.has('$.users'))
  assert.ok(original.has('$.users'), '原集合不可变')
  assert.notEqual(original, next)
})

test('toggleInSet：展开 → 折叠', () => {
  const original = new Set()
  const next = toggleInSet(original, '$.meta')
  assert.ok(next.has('$.meta'))
  assert.ok(!original.has('$.meta'))
})

// ===== filterTree / countMatches（过滤式提取）=====

test('filterTree：空查询返回原树', () => {
  const tree = buildTree()
  assert.equal(filterTree(tree, ''), tree)
  assert.equal(filterTree(tree, '   '), tree)
})

test('filterTree：只保留命中节点及其祖先路径', () => {
  const tree = buildTree()
  const filtered = filterTree(tree, 'Alice')
  // 根仍在，users 仍在（祖先），users[0] 仍在（祖先），name=Alice 命中
  assert.ok(filtered[0].key === '$')
  const users = filtered[0].children.find(c => c.key === 'users')
  assert.ok(users, '祖先 users 应保留')
  const u0 = users.children.find(c => c.key === 0)
  assert.ok(u0, '祖先 users[0] 应保留')
  const name = u0.children.find(c => c.key === 'name')
  assert.ok(name && name.value === 'Alice', '命中节点保留')
  // 非祖先分支（users[1]、meta）应被丢弃
  assert.ok(!users.children.find(c => c.key === 1), '非祖先分支 users[1] 应丢弃')
})

test('filterTree：按 value 命中', () => {
  const tree = buildTree()
  const filtered = filterTree(tree, 'Bob')
  const users = filtered[0].children.find(c => c.key === 'users')
  // 只有 users[1]（含 Bob）这条分支保留
  assert.equal(users.children.length, 1)
  assert.equal(users.children[0].key, 1)
})

test('filterTree：无匹配返回空数组', () => {
  const filtered = filterTree(buildTree(), 'zzz')
  assert.equal(filtered.length, 0)
})

test('filterTree：容器只匹配 key，不匹配 String(undefined) value', () => {
  // 查询 "undefined" 不应命中任何容器节点（value 为 undefined）
  const filtered = filterTree(buildTree(), 'undefined')
  assert.equal(filtered.length, 0)
})

test('countMatches：统计真正命中的节点数', () => {
  assert.equal(countMatches(buildTree(), 'name'), 2) // 两个 name 节点
  assert.equal(countMatches(buildTree(), 'Alice'), 1)
  assert.equal(countMatches(buildTree(), 'zzz'), 0)
  assert.equal(countMatches(buildTree(), ''), 0)
})

test('nodeMatches：大小写不敏感 key 匹配', () => {
  const node = { key: 'UserName', type: 'string', value: 'x' }
  assert.ok(nodeMatches(node, 'user'))
  assert.ok(nodeMatches(node, 'USER'))
})

test('nodeMatches：标量 value 匹配', () => {
  const node = { key: 'k', type: 'string', value: 'Alice' }
  assert.ok(nodeMatches(node, 'lic'))
})

test('nodeMatches：容器（object）不匹配自身 value', () => {
  const node = { key: 'data', type: 'object', value: undefined }
  assert.ok(!nodeMatches(node, 'undefined'))
})
