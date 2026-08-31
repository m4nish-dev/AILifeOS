import { Plus, MessageSquare, Trash2, Search } from 'lucide-react'
import { useState } from 'react'
import './ChatSidebar.css'

export default function ChatSidebar({ conversations, activeId, onSelect, onNew, onDelete }) {
  const [search, setSearch] = useState('')
  const filtered = conversations.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <aside className="cs">
      <button className="cs__new" onClick={onNew}>
        <Plus size={14} strokeWidth={2.5} /> New Chat
      </button>

      <div className="cs__search">
        <Search size={13} />
        <input placeholder="Search chats…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="cs__list">
        <div className="cs__group-head">Recent</div>
        {filtered.map(c => (
          <div
            key={c.id}
            className={`cs__item${activeId === c.id ? ' cs__item--active' : ''}`}
            onClick={() => onSelect(c.id)}
            role="button"
            tabIndex={0}
          >
            <MessageSquare size={13} />
            <div className="cs__item-body">
              <div className="cs__item-title">{c.title}</div>
              <div className="cs__item-preview">{c.preview}</div>
            </div>
            <button className="cs__del" onClick={(e) => { e.stopPropagation(); onDelete(c.id) }}>
              <Trash2 size={11} />
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="cs__empty">No conversations found</div>
        )}
      </div>
    </aside>
  )
}
