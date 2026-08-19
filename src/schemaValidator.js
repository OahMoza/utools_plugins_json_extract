// schemaValidator.js — JSON Schema 校验 + 错误定位
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)

const schemaCache = new Map()

/**
 * 校验数据是否符合 JSON Schema
 * @param {object} schema - JSON Schema
 * @param {any} data - 待校验数据
 * @returns {{ valid: boolean, errors: ValidationError[] }}
 */
export function validate(schema, data) {
  let validateFn = schemaCache.get(schema)
  if (!validateFn) {
    validateFn = ajv.compile(schema)
    schemaCache.set(schema, validateFn)
  }
  const valid = validateFn(data)
  const errors = (validateFn.errors || []).map(err => {
    let pointer = err.instancePath || ''
    // required 错误：instancePath 指向父对象，需拼接缺失字段
    if (err.keyword === 'required' && err.params?.missingProperty) {
      pointer = pointer + '/' + err.params.missingProperty
    }
    if (!pointer) pointer = '/'
    return {
      pointer,
      message: err.message || '',
      keyword: err.keyword || ''
    }
  })
  return { valid, errors }
}

/**
 * Schema 缓存（供外部测试/重置用）
 */
export function clearCache() {
  schemaCache.clear()
}
