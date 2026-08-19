const fs = require('node:fs')
const path = require('node:path')

// 通过 window 对象向渲染进程注入 nodejs 能力（JSON 工具专用）
window.services = {
  // 读文件（打开 JSON 文件入口）
  readFile (file) {
    return fs.readFileSync(file, { encoding: 'utf-8' })
  },
  // 文本写入到下载目录（保存格式化 / 查询结果）
  writeTextFile (text, ext = 'json') {
    const filePath = path.join(
      window.utools.getPath('downloads'),
      Date.now().toString() + '.' + ext
    )
    fs.writeFileSync(filePath, text, { encoding: 'utf-8' })
    return filePath
  },
  // 图片写入到下载目录（保留兼容）
  writeImageFile (base64Url) {
    const matchs = /^data:image\/([a-z]{1,20});base64,/i.exec(base64Url)
    if (!matchs) return
    const filePath = path.join(window.utools.getPath('downloads'), Date.now().toString() + '.' + matchs[1])
    fs.writeFileSync(filePath, base64Url.substring(matchs[0].length), { encoding: 'base64' })
    return filePath
  }
}

// MCP 工具注册（供 AI 客户端通过 uTools 调用）
// 必须在 preload 顶层作用域注册（不可写在 onPluginEnter 内）
try {
  // AI Agent 基于 inputSchema 传入 { json, expression }，
  // 其中 json 是原始字符串，需先解析为对象再交给 query()
  const runQuery = ({ json, expression }, engine) => {
    if (!window.services?.__query) return { error: 'query 未就绪' }
    if (typeof json !== 'string' || !json.trim()) {
      return { error: '参数 json 为空或非字符串' }
    }
    let data
    try {
      data = JSON.parse(json)
    } catch (e) {
      return { error: 'json 参数不是合法 JSON: ' + e.message }
    }
    return window.services.__query(data, expression, engine)
  }

  window.utools.registerTool('jsonpath_query', (params) => runQuery(params, 'jsonpath'))
  window.utools.registerTool('jmespath_query', (params) => runQuery(params, 'jmespath'))
} catch (e) {
  // 非 uTools 环境或注册失败时静默
}
