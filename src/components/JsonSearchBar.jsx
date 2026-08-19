// JsonSearchBar — 输入区搜索条（Ctrl+F 打开）
import { useState, useRef, useEffect } from 'react'

export default function JsonSearchBar({ text, onScrollTo, onClose }) {
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const [matches, setMatches] = useState([])
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!query || !text) {
      setMatches([])
      setActiveIdx(0)
      return
    }
    // 简单搜索：按行分割，找匹配
    const lines = text.split('\n')
    const found = []
    const q = query.toLowerCase()
    lines.forEach((line, i) => {
      let idx = 0
      while ((idx = line.toLowerCase().indexOf(q, idx)) !== -1) {
        found.push({ line: i + 1, column: idx })
        idx += q.length
      }
    })
    setMatches(found)
    setActiveIdx(0)
    if (found.length > 0) {
      onScrollTo?.(found[0])
    }
  }, [query, text, onScrollTo])

  const goTo = (dir) => {
    if (matches.length === 0) return
    const next = (activeIdx + dir + matches.length) % matches.length
    setActiveIdx(next)
    onScrollTo?.(matches[next])
  }

  return (
    <div className='json-search-bar'>
      <svg width='14' height='14' viewBox='0 0 24 24' fill='none'>
        <circle cx='11' cy='11' r='8' stroke='currentColor' strokeWidth='2'/>
        <path d='M21 21l-4.35-4.35' stroke='currentColor' strokeWidth='2' strokeLinecap='round'/>
      </svg>
      <input
        ref={inputRef}
        className='json-search-input'
        value={query}
        placeholder='搜索输入内容...'
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); goTo(e.shiftKey ? -1 : 1) }
          else if (e.key === 'Escape') { e.preventDefault(); onClose?.() }
        }}
      />
      <span className='json-search-meta'>
        {matches.length ? `${activeIdx + 1} / ${matches.length}` : '0 / 0'}
      </span>
      <button className='ui-btn ui-btn-sm' onClick={() => goTo(-1)} title='上一个'>↑</button>
      <button className='ui-btn ui-btn-sm' onClick={() => goTo(1)} title='下一个'>↓</button>
      <button className='ui-btn ui-btn-sm' onClick={onClose} title='关闭'>✕</button>
    </div>
  )
}
