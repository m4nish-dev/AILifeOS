import { Plus, MessageSquare, Trash2, Search, MoreHorizontal, Edit2, Pin, PinOff, Archive, ArchiveRestore } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import './ChatSidebar.css'

export default function ChatSidebar({ conversations, activeId, onSelect, onNew, onDelete, onUpdate }) {
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(null)
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = conversations.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
  
  const pinned = filtered.filter(c => c.isPinned && !c.isArchived)
  const recent = filtered.filter(c => !c.isPinned && !c.isArchived)
  const archived = filtered.filter(c => c.isArchived)

  const handleAction = (e, id, action, data = {}) => {
    e.stopPropagation()
    setMenuOpen(null)
    
    if (action === 'delete') return onDelete(id)
    if (action === 'rename_start') {
      const c = conversations.find(c => c.id === id)
      setRenameValue(c ? c.title : '')
      setRenamingId(id)
      return
    }
    
    onUpdate(id, data)
  }

  const handleRenameSubmit = (e, id) => {
    e.preventDefault()
    e.stopPropagation()
    if (renameValue.trim()) {
      onUpdate(id, { title: renameValue.trim() })
    }
    setRenamingId(null)
  }

  const renderItem = (c) => {
    const isActive = activeId === c.id
    return (
      <div
        key={c.id}
        className={`cs__item${isActive ? ' cs__item--active' : ''}`}
        onClick={() => {
          if (renamingId !== c.id) onSelect(c.id)
        }}
        role="button"
        tabIndex={0}
      >
        <MessageSquare size={13} />
        <div className="cs__item-body">
          {renamingId === c.id ? (
            <form onSubmit={(e) => handleRenameSubmit(e, c.id)} onClick={(e) => e.stopPropagation()}>
              <input 
                autoFocus
                className="cs__rename-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={(e) => handleRenameSubmit(e, c.id)}
              />
            </form>
          ) : (
            <div className="cs__item-title">{c.title}</div>
          )}
          <div className="cs__item-preview">{c.preview}</div>
        </div>

        <div className="cs__actions" onClick={(e) => e.stopPropagation()}>
          <button 
            className="cs__menu-btn" 
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(menuOpen === c.id ? null : c.id)
            }}
          >
            <MoreHorizontal size={14} />
          </button>
          
          {menuOpen === c.id && (
            <div className="cs__menu" ref={menuRef}>
              <button onClick={(e) => handleAction(e, c.id, 'rename_start')}>
                <Edit2 size={13} /> Rename
              </button>
              <button onClick={(e) => handleAction(e, c.id, 'pin', { isPinned: !c.isPinned })}>
                {c.isPinned ? <PinOff size={13} /> : <Pin size={13} />} {c.isPinned ? 'Unpin' : 'Pin chat'}
              </button>
              <button onClick={(e) => handleAction(e, c.id, 'archive', { isArchived: !c.isArchived })}>
                {c.isArchived ? <ArchiveRestore size={13} /> : <Archive size={13} />} {c.isArchived ? 'Unarchive' : 'Archive'}
              </button>
              <div className="cs__menu-div"></div>
              <button className="cs__menu-del" onClick={(e) => handleAction(e, c.id, 'delete')}>
                <Trash2 size={13} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

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
        {pinned.length > 0 && (
          <div className="cs__section">
            <div className="cs__group-head">Pinned</div>
            {pinned.map(renderItem)}
          </div>
        )}

        {recent.length > 0 && (
          <div className="cs__section">
            <div className="cs__group-head">Recent</div>
            {recent.map(renderItem)}
          </div>
        )}

        {archived.length > 0 && (
          <div className="cs__section" style={{ marginTop: 12 }}>
            <div className="cs__group-head">Archived</div>
            {archived.map(renderItem)}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="cs__empty">No conversations found</div>
        )}
      </div>
    </aside>
  )
}
