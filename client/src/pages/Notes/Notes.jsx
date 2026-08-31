import { useState } from 'react'
import NotesSidebar from '../../components/notes/NotesSidebar/NotesSidebar'
import NoteEditor from '../../components/notes/NoteEditor/NoteEditor'
import NoteQuizModal from '../../components/notes/NoteQuizModal/NoteQuizModal'
import { foldersData, notesData } from '../../data/mockNotes'
import './Notes.css'

export default function Notes() {
  const [folders, setFolders] = useState(foldersData)
  const [notes, setNotes] = useState(notesData)
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [selectedNote, setSelectedNote] = useState(notesData[0])
  const [aiModal, setAiModal] = useState({ open: false, mode: 'summary', note: null })

  const handleNewNote = () => {
    const newNote = {
      id: `n${Date.now()}`,
      folderId: selectedFolder || folders[0].id,
      title: 'Untitled Note',
      content: '# New Note\n\nStart writing…',
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
      tags: [],
      pinned: false,
    }
    setNotes([newNote, ...notes])
    setSelectedNote(newNote)
  }

  const handleNewFolder = () => {
    const name = prompt('Folder name?')
    if (!name) return
    setFolders([...folders, { id: `f${Date.now()}`, name, icon: '📁', color: 'green' }])
  }

  const handleSave = (updatedNote) => {
    setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n))
    setSelectedNote(updatedNote)
  }

  const handleDelete = (id) => {
    if (!confirm('Delete this note?')) return
    const remaining = notes.filter(n => n.id !== id)
    setNotes(remaining)
    setSelectedNote(remaining[0] || null)
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
