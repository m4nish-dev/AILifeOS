import { useState } from 'react'
import { Plus, Search, FolderPlus, Pin, FileText } from 'lucide-react'
import './NotesSidebar.css'

export default function NotesSidebar({
  folders, notes, selectedFolder, selectedNote,
  onSelectFolder, onSelectNote, onNewNote, onNewFolder,
}) {
  const [search, setSearch] = useState('')

  const filteredNotes = notes.filter(n => {
    const matchFolder = !selectedFolder || n.folderId === selectedFolder
    const matchSearch = !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    return matchFolder && matchSearch
  })

  const pinnedNotes = filteredNotes.filter(n => n.pinned)
  const regularNotes = filteredNotes.filter(n => !n.pinned)

  return (
    <aside className="ns">
      <div className="ns__head">
        <div className="ns__search">
          <Search size={14} />
          <input placeholder="Search notes…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="ns__new" onClick={onNewNote}>
          <Plus size={14} strokeWidth={2.5} /> New Note
        </button>
      </div>

      <div className="ns__section">
        <div className="ns__section-head">
          <span>Folders</span>
          <button onClick={onNewFolder} aria-label="New folder"><FolderPlus size={13} /></button>
        </div>
        <div className="ns__folders">
          <button
            className={`ns__folder${!selectedFolder ? ' ns__folder--active' : ''}`}
            onClick={() => onSelectFolder(null)}
          >
            <span className="ns__folder-icon">📁</span>
            <span>All Notes</span>
            <span className="ns__folder-count">{notes.length}</span>
          </button>
          {folders.map(f => {
            const count = notes.filter(n => n.folderId === f.id).length
            return (
              <button
                key={f.id}
                className={`ns__folder${selectedFolder === f.id ? ' ns__folder--active' : ''}`}
                onClick={() => onSelectFolder(f.id)}
              >
                <span className="ns__folder-icon">{f.icon}</span>
                <span>{f.name}</span>
                <span className="ns__folder-count">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="ns__section ns__section--notes">
        <div className="ns__section-head">
          <span>{selectedFolder ? folders.find(f => f.id === selectedFolder)?.name : 'All Notes'}</span>
          <span className="ns__count">{filteredNotes.length}</span>
        </div>

        <div className="ns__notes">
          {pinnedNotes.length > 0 && (
            <div className="ns__group">
              <div className="ns__group-head">
                <Pin size={10} /> Pinned
              </div>
              {pinnedNotes.map(n => (
                <NoteItem key={n.id} note={n} active={selectedNote?.id === n.id} onClick={() => onSelectNote(n)} />
              ))}
            </div>
          )}
          {regularNotes.length > 0 && (
            <div className="ns__group">
              {pinnedNotes.length > 0 && <div className="ns__group-head">Notes</div>}
              {regularNotes.map(n => (
                <NoteItem key={n.id} note={n} active={selectedNote?.id === n.id} onClick={() => onSelectNote(n)} />
              ))}
            </div>
          )}
          {filteredNotes.length === 0 && (
            <div className="ns__empty">
              <FileText size={28} />
              <span>No notes here</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

function NoteItem({ note, active, onClick }) {
  const preview = note.content
    .replace(/^#+ .+$/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[*_`]/g, '')
    .trim().slice(0, 80)
  return (
    <button className={`ns__note${active ? ' ns__note--active' : ''}`} onClick={onClick}>
      <div className="ns__note-title">{note.title}</div>
      <div className="ns__note-preview">{preview}</div>
      <div className="ns__note-meta">
        <span>{new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        {note.pinned && <Pin size={10} />}
      </div>
    </button>
  )
}
