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
      console.error('Failed to save note', err)
      setSaveStatus('error')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this note?')) return
    try {
      await noteService.deleteNote(id)
      const remaining = notes.filter(n => n.id !== id && n._id !== id)
      setNotes(remaining)
      setSelectedNote(remaining[0] || null)
    } catch (err) {
      console.error('Failed to delete note', err)
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
