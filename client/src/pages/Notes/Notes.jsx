import { useCallback, useEffect, useState } from 'react'
import NotesSidebar from '../../components/notes/NotesSidebar/NotesSidebar'
import NoteEditor from '../../components/notes/NoteEditor/NoteEditor'
import NoteQuizModal from '../../components/notes/NoteQuizModal/NoteQuizModal'
import { noteService } from '../../services/noteService'
import { folderService } from '../../services/folderService'
import { useToast } from '../../context/ToastContext'
import './Notes.css'

export default function Notes() {
  const { showToast } = useToast()

  const [folders, setFolders] = useState([])
  const [notes, setNotes] = useState([])
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [selectedNote, setSelectedNote] = useState(null)

  const [apiLoading, setApiLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [saveStatus, setSaveStatus] = useState('saved') // 'saved' | 'saving' | 'error'

  const [aiModal, setAiModal] = useState({ open: false, mode: 'summary', note: null })

  const fetchData = useCallback(async () => {
    try {
      setApiLoading(true)
      setLoadError(null)
      // Folders and notes are independent — load them together.
      const [noteData, folderData] = await Promise.all([
        noteService.getNotes(),
        folderService.getFolders()
      ])
      setNotes(noteData)
      setFolders(folderData)
      if (noteData.length > 0) setSelectedNote(noteData[0])
    } catch (err) {
      console.error('Failed to load notes:', err)
      setLoadError(err.response?.data?.message || 'Could not load your notes. Please try again.')
    } finally {
      setApiLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleNewNote = async () => {
    try {
      setSaveStatus('saving')
      const newNote = await noteService.createNote({
        title: 'Untitled Note',
        content: '# New Note\n\nStart writing…',
        // null = unfiled; only send a folder when one is selected.
        folderId: selectedFolder || null,
        tags: [],
        pinned: false
      })
      setNotes([newNote, ...notes])
      setSelectedNote(newNote)
      setSaveStatus('saved')
    } catch (err) {
      console.error('Failed to create note', err)
      setSaveStatus('error')
      showToast(err.response?.data?.message || 'Failed to create note', 'error')
    }
  }

  const [newFolderModal, setNewFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [deleteModalId, setDeleteModalId] = useState(null)

  const [creatingFolder, setCreatingFolder] = useState(false)

  const handleNewFolderSubmit = async (e) => {
    e.preventDefault()
    if (!newFolderName.trim() || creatingFolder) return

    try {
      setCreatingFolder(true)
      const folder = await folderService.createFolder({ name: newFolderName.trim() })
      setFolders([...folders, folder])
      setNewFolderModal(false)
      setNewFolderName('')
      showToast('Folder created', 'success')
    } catch (err) {
      console.error('Failed to create folder', err)
      showToast(err.response?.data?.message || 'Failed to create folder', 'error')
    } finally {
      setCreatingFolder(false)
    }
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
      showToast(err.response?.data?.message || 'Failed to delete note', 'error')
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

  if (loadError) {
    return (
      <div className="notes-page" style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
        <span>{loadError}</span>
        <button className="sb-btn sb-btn-primary" onClick={fetchData}>Retry</button>
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
                className="ui-input"
              />
            </div>
            <div className="sb-modal-actions">
              <button type="button" className="sb-btn sb-btn-ghost" onClick={() => setNewFolderModal(false)}>Cancel</button>
              <button type="submit" className="sb-btn sb-btn-primary" disabled={creatingFolder || !newFolderName.trim()}>
                {creatingFolder ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteModalId && (
        <div className="sb-modal-overlay" onClick={() => setDeleteModalId(null)}>
          <div className="sb-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="sb-modal-title">Delete Note</h3>
            <p className="notes-confirm">
              Are you sure you want to delete this note? This action cannot be undone.
            </p>
            <div className="sb-modal-actions">
              <button type="button" className="sb-btn sb-btn-ghost" onClick={() => setDeleteModalId(null)}>Cancel</button>
              <button type="button" className="ui-btn ui-btn--danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
