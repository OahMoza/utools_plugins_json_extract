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
