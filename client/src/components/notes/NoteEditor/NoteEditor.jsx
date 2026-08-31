import { useState, useEffect } from 'react'
import { Pin, Trash2, Sparkles, FileQuestion, BookOpen, Copy, Eye, EyeOff, Tag as TagIcon, X } from 'lucide-react'
import AINoteActions from '../AINoteActions/AINoteActions'
import './NoteEditor.css'

export default function NoteEditor({ note, folders, saveStatus, onSave, onDelete, onSummarize, onQuiz }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState([])
  const [newTag, setNewTag] = useState('')
  const [pinned, setPinned] = useState(false)
  const [folderId, setFolderId] = useState('')
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
      setTags(note.tags || [])
      setPinned(note.pinned || false)
      setFolderId(note.folderId)
    }
  }, [note])

  useEffect(() => {
    if (!note) return
    const timeout = setTimeout(() => {
      if (title !== note.title || content !== note.content || pinned !== note.pinned || folderId !== note.folderId || JSON.stringify(tags) !== JSON.stringify(note.tags)) {
        onSave({ ...note, title, content, tags, pinned, folderId })
      }
    }, 600)
    return () => clearTimeout(timeout)
  }, [title, content, tags, pinned, folderId])

  const addTag = () => {
    const t = newTag.trim().toLowerCase()
    if (!t || tags.includes(t)) return
    setTags([...tags, t]); setNewTag('')
  }

  if (!note) {
    return (
      <div className="ne ne--empty">
        <div className="ne__empty-icon">📝</div>
        <h3>Select a note to view</h3>
        <p>Or create a new one to get started</p>
      </div>
    )
  }

  return (
    <div className="ne">
      <div className="ne__toolbar">
        <div className="ne__toolbar-left">
          <select className="ne__folder-select" value={folderId} onChange={(e) => setFolderId(e.target.value)}>
            {folders.map(f => <option key={f.id} value={f.id}>{f.icon} {f.name}</option>)}
          </select>
          <span className="ne__saved" style={{ color: saveStatus === 'saving' ? 'var(--blue-500)' : saveStatus === 'error' ? 'var(--red-500)' : 'var(--text-tertiary)' }}>
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'error' ? 'Error saving' : `Saved · ${new Date(note.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          </span>
        </div>
        <div className="ne__toolbar-right">
          <button
            className={`ne__tool${pinned ? ' ne__tool--active' : ''}`}
            onClick={() => setPinned(!pinned)}
            aria-label="Pin"
          >
            <Pin size={14} />
          </button>
          <button
            className={`ne__tool${preview ? ' ne__tool--active' : ''}`}
            onClick={() => setPreview(!preview)}
            aria-label="Preview"
          >
            {preview ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button className="ne__tool ne__tool--danger" onClick={() => onDelete(note.id)} aria-label="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <AINoteActions onSummarize={() => onSummarize(note)} onQuiz={() => onQuiz(note)} />

      <input
        className="ne__title"
        placeholder="Untitled Note"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div className="ne__tags">
        {tags.map(t => (
          <span key={t} className="ne__tag">
            #{t}
            <button onClick={() => setTags(tags.filter(x => x !== t))}><X size={9} /></button>
          </span>
        ))}
        <div className="ne__tag-input">
          <TagIcon size={11} />
          <input
            placeholder="Add tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
          />
        </div>
      </div>

      {preview ? (
        <div className="ne__preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
      ) : (
        <textarea
          className="ne__editor"
          placeholder="Start writing…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      )}
    </div>
  )
}

function renderMarkdown(md) {
  return md
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^([^<].+)$/gm, '<p>$1</p>')
    .replace(/<p><(h[1-6]|ul|pre)/g, '<$1')
    .replace(/<\/(h[1-6]|ul|pre)><\/p>/g, '</$1>')
}
