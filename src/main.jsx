import React from 'react'
import ReactDOM from 'react-dom/client'
// 设计系统 S5：tokens + 组件样式（替代旧版 ui-kit/main.css）
import '@ztools/ui-kit/tokens.css'
import '@ztools/ui-kit/components/components.css'
import { initDarkMode } from '@ztools/ui-kit/init'
import App from './App.jsx'

// 根据 utools.isDarkColors() 给 <html> 加 .dark，驱动 tokens.css 暗色变量
initDarkMode()

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
