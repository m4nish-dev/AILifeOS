import { useCallback, useEffect, useState } from 'react'
import NotesSidebar from '../../components/notes/NotesSidebar/NotesSidebar'
import NoteEditor from '../../components/notes/NoteEditor/NoteEditor'
import NoteQuizModal from '../../components/notes/NoteQuizModal/NoteQuizModal'
import Skeleton from '../../components/common/Skeleton/Skeleton'
import EmptyState from '../../components/common/EmptyState/EmptyState'
import { noteService } from '../../services/noteService'
import { foldersData } from '../../data/mockNotes' // Keep folders local for now
import { useToast } from '../../context/ToastContext'
import { FileText } from 'lucide-react'
import './Notes.css'

export default function Notes() {
  const [folders, setFolders] = useState(foldersData)
  const [notes, setNotes] = useState([])
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [selectedNote, setSelectedNote] = useState(null)
  
  const [apiLoading, setApiLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState('saved') // 'saved' | 'saving' | 'error'
  const { showToast } = useToast()

  const [aiModal, setAiModal] = useState({ open: false, mode: 'summary', note: null })

  const fetchNotes = useCallback(async () => {
    try {
      setApiLoading(true)
      const data = await noteService.getNotes()
      setNotes(data)
      if (data.length > 0) setSelectedNote(data[0])
    } catch (err) {
      console.error('Failed to load notes:', err)
    } finally {
      setApiLoading(false)
    }
  }, [])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  const handleNewNote = async () => {
    try {
      setSaveStatus('saving')
      const newNote = await noteService.createNote({
        title: 'Untitled Note',
        content: '# New Note\n\nStart writing…',
        folderId: selectedFolder || folders[0].id,
        tags: [],
        pinned: false
      })
      setNotes([newNote, ...notes])
      setSelectedNote(newNote)
      setSaveStatus('saved')
      showToast('Note created', 'success')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create note', 'error')
      setSaveStatus('error')
    }
  }

  const handleNewFolder = () => {
    const name = prompt('Folder name?')
    if (!name) return
    setFolders([...folders, { id: `f${Date.now()}`, name, icon: '📁', color: 'green' }])
  }

  const handleSave = async (updatedNote) => {
    try {
      setSaveStatus('saving')
      const savedNote = await noteService.updateNote(updatedNote.id || updatedNote._id, updatedNote)
      setNotes(prev => prev.map(n => (n.id === savedNote.id || n._id === savedNote._id) ? savedNote : n))
      if (selectedNote && (selectedNote.id === savedNote.id || selectedNote._id === savedNote._id)) {
        setSelectedNote(savedNote)
      }
      setSaveStatus('saved')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save note', 'error')
      setSaveStatus('error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return
    try {
      await noteService.deleteNote(id)
      const remaining = notes.filter(n => n.id !== id && n._id !== id)
      setNotes(remaining)
      setSelectedNote(remaining[0] || null)
      showToast('Note deleted', 'success')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete note', 'error')
    }
  }

  if (apiLoading) {
    return (
      <div className="notes-page" style={{ display: 'flex' }}>
        <div style={{ width: 280, borderRight: '1px solid var(--border-subtle)', padding: 16 }}>
          <Skeleton variant="line" height={32} />
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton variant="line" height={24} count={3} />
          </div>
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton variant="card" height={80} count={4} />
          </div>
        </div>
        <div style={{ flex: 1, padding: 32 }}>
          <Skeleton variant="line" height={48} width="50%" />
          <Skeleton variant="line" height={24} count={10} />
        </div>
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className="notes-page">
        <NotesSidebar
          folders={folders} notes={notes} selectedFolder={selectedFolder} selectedNote={selectedNote}
          onSelectFolder={setSelectedFolder} onSelectNote={setSelectedNote} onNewNote={handleNewNote} onNewFolder={handleNewFolder}
        />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
          <EmptyState
            icon={FileText}
            title="Capture your first thought"
            description="Start building your knowledge base."
            actionLabel="Create Note"
            onAction={handleNewNote}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="notes-page">
      <NotesSidebar
        folders={folders}
        notes={notes}
        selectedFolder={selectedFolder}
        selectedNote={selectedNote}
        onSelectFolder={setSelectedFolder}
        onSelectNote={setSelectedNote}
        onNewNote={handleNewNote}
        onNewFolder={handleNewFolder}
      />
      <NoteEditor
        note={selectedNote}
        folders={folders}
        saveStatus={saveStatus}
        onSave={handleSave}
        onDelete={handleDelete}
        onSummarize={(note) => setAiModal({ open: true, mode: 'summary', note })}
        onQuiz={(note) => setAiModal({ open: true, mode: 'quiz', note })}
      />
      <NoteQuizModal
        open={aiModal.open}
        mode={aiModal.mode}
        note={aiModal.note}
        onClose={() => setAiModal({ open: false, mode: 'summary', note: null })}
      />
    </div>
  )
}
