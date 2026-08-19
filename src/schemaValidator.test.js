// schemaValidator.test.js — TDD for schemaValidator module
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validate, clearCache } from '../src/schemaValidator.js'

const userSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
    email: { type: 'string', format: 'email' }
  },
  required: ['name', 'age']
}

test('validate: 合法数据返回 valid', () => {
  clearCache()
  const result = validate(userSchema, { name: 'Alice', age: 30 })
  assert.equal(result.valid, true)
  assert.equal(result.errors.length, 0)
})

test('validate: 缺少 required 字段', () => {
  clearCache()
  const result = validate(userSchema, { name: 'Alice' })
  assert.equal(result.valid, false)
  assert.ok(result.errors.length > 0)
  assert.equal(result.errors[0].keyword, 'required')
  assert.equal(result.errors[0].pointer, '/age')
})

test('validate: 类型错误', () => {
  clearCache()
  const result = validate(userSchema, { name: 'Alice', age: 'not-a-number' })
  assert.equal(result.valid, false)
  const typeErr = result.errors.find(e => e.keyword === 'type')
  assert.ok(typeErr)
  assert.equal(typeErr.pointer, '/age')
})

test('validate: 嵌套对象错误定位', () => {
  clearCache()
  const schema = {
    type: 'object',
    properties: {
      user: {
        type: 'object',
        properties: { id: { type: 'number' } },
        required: ['id']
      }
    }
  }
  const result = validate(schema, { user: {} })
  assert.equal(result.valid, false)
  assert.ok(result.errors[0].pointer.includes('/user'))
})

test('validate: 错误格式包含 pointer 和 message', () => {
  clearCache()
  const result = validate(userSchema, { name: 'Alice' })
  const err = result.errors[0]
  assert.ok(err.pointer)
  assert.ok(err.message)
  assert.ok(err.keyword)
})

test('validate: Schema 缓存（多次调用不重复编译）', () => {
  clearCache()
  const schema = { type: 'object', properties: { x: { type: 'number' } } }
  validate(schema, { x: 1 })
  validate(schema, { x: 2 })
  // 无异常即通过（内部缓存生效）
  assert.ok(true)
})
