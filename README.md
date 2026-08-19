# utools_plugins_json_extract

> JSON 双路径提取器 — uTools 插件

## 功能

- **双引擎查询**：同时支持 JSONPath 与 JMESPath 语法
- **树形视图**：可折叠 JSON 树，类型标签（OBJ/ARR/STR/NUM/BOOL/NULL），悬停复制路径
- **代码视图**：行号 + 语法高亮 + Ctrl+F 搜索（n/total 计数）
- **多 Tab**：支持多个 JSON 并行解析
- **查询历史**：最近 50 条表达式，支持收藏
- **MCP 工具**：暴露 `jsonpath_query` / `jmespath_query` 供 AI 客户端调用

## 技术栈

- React 19 + Vite 6
- 共享包：`@ztools/ui-kit`（设计系统）、`@ztools/json-tooling`（JSON 工具库）

## 开发

```bash
npm install
npm run dev    # 开发服务器 http://localhost:5173
npm run build  # 生产构建
npm test       # 运行测试（31 个）
```

## 安装到 uTools

1. `npm run build` 生成 `dist/`
2. 将 `dist/plugin.json` 拖入 uTools 开发者工具
3. 或在 uTools 开发者工具中指向 `dist/` 目录

## 使用

- 关键词 `json` / `JSON工具` / `json格式化` 打开主界面
- 选中文本以 `{` 或 `[` 开头可直接进入
- `*.json` 文件匹配可直接打开
