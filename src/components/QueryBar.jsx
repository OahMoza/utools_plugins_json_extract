// QueryBar —— 引擎切换 + 表达式输入 + 历史下拉
// 移植自 ztools-plugins-json/src/components/QueryBar.tsx
import { useState, useRef, useEffect } from 'react'
import { filterHistory } from '../lib/queryBarLogic.js'

export default function QueryBar({ engine, expression, onEngineChange, onExpressionChange, history = [], onSelectHistory }) {
  const [focused, setFocused] = useState(false)
  const containerRef = useRef(null)

  // 点击外部关闭历史下拉
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setFocused(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = focused && history.length > 0
    ? filterHistory(history, engine, expression)
    : []

  return (
    <div className='json-query' ref={containerRef}>
      <div className='json-query-bar'>
        <button
          className={`json-engine-btn ${engine === 'jsonpath' ? 'active' : ''}`}
          onClick={() => onEngineChange('jsonpath')}
        >JSONPath</button>
        <button
          className={`json-engine-btn ${engine === 'jmespath' ? 'active' : ''}`}
          onClick={() => onEngineChange('jmespath')}
        >JMESPath</button>
      </div>
      <div className='json-expr-wrap'>
        <input
          className='json-expr'
          value={expression}
          placeholder={engine === 'jsonpath' ? '$.users[*].name' : 'users[*].name'}
          onChange={(e) => onExpressionChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && expression.trim() && onSelectHistory) {
              // 回车把当前表达式加入历史
              onSelectHistory(expression, engine)
            }
          }}
          spellCheck={false}
        />
        {filtered.length > 0 && (
          <div className='json-history-dropdown'>
            {filtered.map((h, i) => (
              <div
                key={h.id || i}
                className='json-history-item'
                onMouseDown={(e) => {
                  // mousedown 在 input blur 之前触发，优先
                  e.preventDefault()
                  onExpressionChange(h.expression)
                  onSelectHistory?.(h.expression, h.engine)
                  setFocused(false)
                }}
              >
                <span className='json-history-expr'>{h.expression}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
