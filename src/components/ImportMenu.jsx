// ImportMenu —— 导入 JSON：打开文件 / 剪贴板粘贴 / 拖拽文件
// 整合 ztools-plugins-json ImportMenu + JsonInput 的散落导入逻辑
// uTools 用浏览器原生文件 API（input[type=file] + FileReader），不依赖 ztools 对话框
import { useRef } from 'react'

function readFileAsync(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

export default function ImportMenu({ onImport }) {
  const fileRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return
    const text = await readFileAsync(file)
    onImport(text)
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) onImport(text)
    } catch {
      // 剪贴板权限拒绝时，提示用户手动粘贴到输入区
    }
  }

  return (
    <div className='json-import-menu'>
      <button className='ui-btn ui-btn-sm' onClick={() => fileRef.current?.click()}>
        📂 打开文件
      </button>
      <button className='ui-btn ui-btn-sm' onClick={handlePaste}>
        📋 从剪贴板粘贴
      </button>
      <input
        ref={fileRef}
        type='file'
        accept='.json,application/json'
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  )
}

/** 拖拽处理 hook：供 Pane 使用 */
export function useDropImport(onImport) {
  return {
    onDragOver: (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' },
    onDrop: async (e) => {
      e.preventDefault()
      const file = e.dataTransfer.files?.[0]
      if (!file) return
      const text = await readFileAsync(file)
      onImport(text)
    }
  }
}
