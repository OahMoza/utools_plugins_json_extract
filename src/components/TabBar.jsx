// TabBar —— 多页签，纯 React 状态，零平台依赖
// 移植自 ztools-plugins-json/src/components/TabBar.tsx，接入 ui-kit 设计令牌

export function createNewTab(index) {
  return {
    id: `tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: `解析 ${index + 1}`,
    jsonText: '',
    expression: '',
    engine: 'jsonpath'
  }
}

export default function TabBar({ tabs, activeTabId, onTabSelect, onTabAdd, onTabClose }) {
  return (
    <div className='json-tabbar'>
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={`json-tab${activeTabId === tab.id ? ' active' : ''}`}
          onClick={() => onTabSelect(tab.id)}
          title={tab.name}
        >
          <span className='json-tab-name'>{tab.name}</span>
          {tabs.length > 1 && (
            <button
              className='json-tab-close'
              onClick={(e) => { e.stopPropagation(); onTabClose(tab.id) }}
              title='关闭'
            >×</button>
          )}
        </div>
      ))}
      <button className='json-tab-add' onClick={onTabAdd} title='新建页签'>+</button>
    </div>
  )
}
