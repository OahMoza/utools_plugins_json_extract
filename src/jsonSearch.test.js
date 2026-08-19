// jsonSearch.test.js — TDD for JSON search logic
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findMatches, getMatchAt } from './jsonSearch.js'

test('findMatches: 基础匹配', () => {
  const text = 'hello world\nhello foo\nbar'
  const matches = findMatches(text, 'hello')
  assert.equal(matches.length, 2)
  assert.deepEqual(matches[0], { line: 1, column: 0, length: 5 })
  assert.deepEqual(matches[1], { line: 2, column: 0, length: 5 })
})

test('findMatches: 大小写不敏感', () => {
  const text = 'Hello WORLD\nhello'
  const matches = findMatches(text, 'hello', { caseSensitive: false })
  assert.equal(matches.length, 2)
})

test('findMatches: 无匹配返回空', () => {
  const matches = findMatches('abc', 'xyz')
  assert.equal(matches.length, 0)
})

test('findMatches: 多行匹配', () => {
  const text = 'aaa\naaa\naaa'
  const matches = findMatches(text, 'aaa')
  assert.equal(matches.length, 3)
  assert.equal(matches[0].line, 1)
  assert.equal(matches[2].line, 3)
})

test('getMatchAt: 获取指定索引的匹配', () => {
  const text = 'foo bar foo'
  const matches = findMatches(text, 'foo')
  assert.deepEqual(getMatchAt(matches, 0), { line: 1, column: 0, length: 3 })
  assert.deepEqual(getMatchAt(matches, 1), { line: 1, column: 8, length: 3 })
})
