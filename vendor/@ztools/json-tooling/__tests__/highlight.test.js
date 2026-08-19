import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  highlightJson,
  formatJson,
  minifyJson,
  getJsonErrorPosition,
  getType,
  generatePathFromKey,
  suggestJmesPath
} from '../src/index.js'

test('getType 识别 JSON 类型', () => {
  assert.equal(getType(null), 'null')
  assert.equal(getType([]), 'array')
  assert.equal(getType({}), 'object')
  assert.equal(getType('s'), 'string')
  assert.equal(getType(1), 'number')
  assert.equal(getType(true), 'boolean')
})

test('highlightJson 对 key/string/number/boolean/null 着色', () => {
  const html = highlightJson('{"a":"str","b":1,"c":true,"d":null}')
  assert.ok(html.includes('syntax-key'), '应包含 key 样式')
  assert.ok(html.includes('syntax-string'), '应包含 string 样式')
  assert.ok(html.includes('syntax-number'), '应包含 number 样式')
  assert.ok(html.includes('syntax-boolean'), '应包含 boolean 样式')
  assert.ok(html.includes('syntax-null'), '应包含 null 样式')
  assert.ok(html.includes('syntax-bracket'), '应包含 bracket 样式')
})

test('highlightJson 转义 HTML 特殊字符', () => {
  const html = highlightJson('<script>')
  assert.ok(!html.includes('<script>'), '应转义 <')
  assert.ok(html.includes('&lt;'))
})

test('formatJson 格式化与 minifyJson 压缩', () => {
  const compact = '{"a":1,"b":2}'
  assert.equal(minifyJson(compact), '{"a":1,"b":2}')
  assert.ok(formatJson(compact).includes('\n'), '格式化应含换行')
  assert.doesNotThrow(() => JSON.parse(formatJson(compact)))
})

test('formatJson 对非法 JSON 原样返回', () => {
  assert.equal(formatJson('{非法'), '{非法')
})

test('getJsonErrorPosition 定位错误', () => {
  assert.equal(getJsonErrorPosition('{"a":1}'), null)
  const err = getJsonErrorPosition('{"a":,}')
  assert.ok(err, '应返回错误位置')
  assert.ok(err.line >= 1 && err.column >= 1)
})

test('generatePathFromKey 生成路径', () => {
  assert.equal(generatePathFromKey('name', '$', false), '$.name')
  assert.equal(generatePathFromKey(0, '$', true), '$[0]')
  assert.equal(generatePathFromKey('x', '$.a', false), '$.a.x')
  assert.equal(generatePathFromKey(1, '$.a', true), '$.a[1]')
})

test('suggestJmesPath 转换路径', () => {
  // $.users[0].name → JMESPath 字段访问用 . 不用 []
  assert.equal(suggestJmesPath('$.users[0].name'), 'users[0].name')
  assert.equal(suggestJmesPath('$.a.b'), 'a.b')
  assert.equal(suggestJmesPath('$..price'), '..price')
})
