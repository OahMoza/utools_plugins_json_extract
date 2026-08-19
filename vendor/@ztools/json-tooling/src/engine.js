// 双引擎 JSON 查询：jsonpath / jmespath
import { search } from 'jmespath'
import { JSONPath } from 'jsonpath-plus'

export class QueryError extends Error {
  constructor(message) {
    super(message)
    this.name = 'QueryError'
  }
}

/**
 * 统一双引擎查询
 * @param {any} json - 要查询的 JSON 数据
 * @param {string} expression - 查询表达式
 * @param {'jsonpath'|'jmespath'} engine - 引擎类型
 * @returns {{ data: any, count: number, error: string|null }}
 */
export function query(json, expression, engine) {
  if (!expression || !expression.trim()) {
    return { data: null, count: 0, error: null }
  }
  if (json === undefined || json === null) {
    return { data: null, count: 0, error: '请先输入 JSON 数据' }
  }
  // 引擎校验：无效输入直接抛出，不被下面的 try 吞掉
  if (engine !== 'jmespath' && engine !== 'jsonpath') {
    throw new QueryError(`未知引擎: ${engine}（仅支持 'jsonpath' / 'jmespath'）`)
  }
  try {
    let data
    if (engine === 'jmespath') {
      data = search(json, expression)
    } else {
      data = JSONPath({ path: expression, json, wrap: true })
    }
    const count = Array.isArray(data) ? data.length : (data === null || data === undefined ? 0 : 1)
    return { data, count, error: null }
  } catch (e) {
    return { data: null, count: 0, error: e.message || '查询表达式错误' }
  }
}

// 便捷函数
export const queryJmespath = (json, expression) => query(json, expression, 'jmespath')
export const queryJsonpath = (json, expression) => query(json, expression, 'jsonpath')
