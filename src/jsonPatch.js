// jsonPatch.js — Diff / Patch / Apply（基于 fast-json-patch, RFC 6902）
import fastJsonPatch from 'fast-json-patch'

const { compare, applyPatch: applyOps, deepClone } = fastJsonPatch

/**
 * 比较两个 JSON 文档，返回差异 patch 数组
 * @param {any} a - 原始文档
 * @param {any} b - 目标文档
 * @returns {PatchOp[]} RFC 6902 操作数组
 */
export function diff(a, b) {
  return compare(a, b)
}

/**
 * 规范化：递归排序所有数组（以元素 JSON 字符串为键，稳定排序），
 * 使数组顺序不同的文档在有序 diff 下被视为一致。
 * 对象本身在 json-patch 中即无序，无需处理。
 * @param {any} value
 * @returns {any}
 */
function normalizeArrayOrder (value) {
  if (Array.isArray(value)) {
    const items = value.map(v => normalizeArrayOrder(v))
    items.sort((x, y) => {
      const a = JSON.stringify(x)
      const b = JSON.stringify(y)
      return a < b ? -1 : a > b ? 1 : 0
    })
    return items
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const out = {}
    for (const k of Object.keys(value)) out[k] = normalizeArrayOrder(value[k])
    return out
  }
  return value
}

/**
 * 内容（无序）对比：忽略数组顺序，只比较内容是否一致。
 * 实现：两侧文档递归排序数组后再做有序 diff。
 * @param {any} a
 * @param {any} b
 * @returns {PatchOp[]} RFC 6902 操作数组
 */
export function diffUnordered (a, b) {
  return compare(normalizeArrayOrder(a), normalizeArrayOrder(b))
}

/**
 * 应用 patch 到文档（返回新文档，不修改原文档）
 * @param {any} doc - 原始文档
 * @param {PatchOp[]} patch - patch 操作数组
 * @returns {any} - 应用后的新文档
 */
export function applyPatch(doc, patch) {
  const clone = deepClone(doc)
  applyOps(clone, patch)
  return clone
}

/**
 * 判断两个 JSON 文档是否深度相等
 * @param {any} a
 * @param {any} b
 * @returns {boolean}
 */
export function isEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}

/**
 * JSON Pointer（RFC 6901）→ JSONPath 转换
 * 例：/users/1/age → $.users[1].age
 * 规则：~0 → ~，~1 → /（先反转义）；数字段用 [n]，其余用 .field
 * @param {string} pointer
 * @returns {string}
 */
export function pointerToJsonPath (pointer) {
  if (pointer === '' || pointer === '$') return '$'
  const segments = pointer.split('/').slice(1)
  let path = '$'
  for (const seg of segments) {
    // RFC 6901 反转义：~1 → /，~0 → ~
    const field = seg.replace(/~1/g, '/').replace(/~0/g, '~')
    if (/^\d+$/.test(field)) {
      path += `[${field}]`
    } else if (/^[A-Za-z_$][\w$]*$/.test(field)) {
      path += `.${field}`
    } else {
      // 含特殊字符（含 /、空格、关键字等）：用括号表示法
      path += `[${JSON.stringify(field)}]`
    }
  }
  return path
}
