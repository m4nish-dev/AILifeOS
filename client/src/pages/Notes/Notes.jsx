import { useCallback, useEffect, useState } from 'react'
import NotesSidebar from '../../components/notes/NotesSidebar/NotesSidebar'
import NoteEditor from '../../components/notes/NoteEditor/NoteEditor'
import NoteQuizModal from '../../components/notes/NoteQuizModal/NoteQuizModal'
import { noteService } from '../../services/noteService'
import { foldersData } from '../../data/mockNotes' // Keep folders local for now
import './Notes.css'

export default function Notes() {
  const [folders, setFolders] = useState(foldersData)
  const [notes, setNotes] = useState([])
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [selectedNote, setSelectedNote] = useState(null)
  
  const [apiLoading, setApiLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState('saved') // 'saved' | 'saving' | 'error'

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
    } catch (err) {
      console.error('Failed to create note', err)
      setSaveStatus('error')
    }
  }

  const [newFolderModal, setNewFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [deleteModalId, setDeleteModalId] = useState(null)

  const handleNewFolderSubmit = (e) => {
    e.preventDefault()
    if (!newFolderName.trim()) return
    setFolders([...folders, { id: `f${Date.now()}`, name: newFolderName.trim(), icon: '📁', color: 'green' }])
    setNewFolderModal(false)
    setNewFolderName('')
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
      console.error('Failed to save note', err)
      setSaveStatus('error')
    }
  }

  const confirmDelete = async () => {
    if (!deleteModalId) return
    try {
      await noteService.deleteNote(deleteModalId)
      const remaining = notes.filter(n => n.id !== deleteModalId && n._id !== deleteModalId)
      setNotes(remaining)
      setSelectedNote(remaining[0] || null)
    } catch (err) {
      console.error('Failed to delete note', err)
    } finally {
      setDeleteModalId(null)
    }
  }

  if (apiLoading) {
    return (
      <div className="notes-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
        Loading notes...
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
        onNewFolder={() => setNewFolderModal(true)}
      />
      <NoteEditor
        note={selectedNote}
        folders={folders}
        saveStatus={saveStatus}
        onSave={handleSave}
        onDelete={(id) => setDeleteModalId(id)}
        onSummarize={(note) => setAiModal({ open: true, mode: 'summary', note })}
        onQuiz={(note) => setAiModal({ open: true, mode: 'quiz', note })}
      />
      <NoteQuizModal
        open={aiModal.open}
        mode={aiModal.mode}
        note={aiModal.note}
        onClose={() => setAiModal({ open: false, mode: 'summary', note: null })}
      />

      {newFolderModal && (
        <div className="sb-modal-overlay" onClick={() => setNewFolderModal(false)}>
          <form className="sb-modal-content" onClick={(e) => e.stopPropagation()} onSubmit={handleNewFolderSubmit}>
            <h3 className="sb-modal-title">New Folder</h3>
            <div className="sb-modal-body">
              <input 
                autoFocus
                placeholder="Folder name" 
                value={newFolderName} 
                onChange={e => setNewFolderName(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
            <div className="sb-modal-actions">
              <button type="button" className="sb-btn sb-btn-ghost" onClick={() => setNewFolderModal(false)}>Cancel</button>
              <button type="submit" className="sb-btn sb-btn-primary">Create</button>
            </div>
          </form>
        </div>
      )}

      {deleteModalId && (
        <div className="sb-modal-overlay" onClick={() => setDeleteModalId(null)}>
          <div className="sb-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="sb-modal-title">Delete Note</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', marginBottom: 'var(--sp-4)' }}>
              Are you sure you want to delete this note? This action cannot be undone.
            </p>
            <div className="sb-modal-actions">
              <button type="button" className="sb-btn sb-btn-ghost" onClick={() => setDeleteModalId(null)}>Cancel</button>
              <button type="button" className="sb-btn sb-btn-primary" style={{ background: 'var(--red-600)' }} onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
