import { useState, useEffect } from 'react'
import { X, Sparkles, Book, FileText, Loader2 } from 'lucide-react'
import { noteService } from '../../../services/noteService'
import api from '../../../services/api'
import './CreateDeckModal.css'

export default function CreateDeckModal({ open, onClose, onSuccess }) {
  const [mode, setMode] = useState('manual') // manual or ai
  const [deckName, setDeckName] = useState('')
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [noteId, setNoteId] = useState('')
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && mode === 'ai' && notes.length === 0) {
      // Fetch notes for dropdown
      const fetchNotes = async () => {
        try {
          const res = await noteService.getNotes()
          setNotes(res.data?.notes || res)
        } catch (err) {
          console.error('Failed to load notes', err)
        }
      }
      fetchNotes()
    }
  }, [open, mode, notes.length])

  useEffect(() => {
    if (!open) {
      setDeckName(''); setFront(''); setBack(''); setNoteId(''); setError(''); setMode('manual');
    }
  }, [open])

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!deckName.trim()) return setError('Deck name is required')

    try {
      setLoading(true)
      if (mode === 'manual') {
        if (!front.trim() || !back.trim()) return setError('Front and back are required')
        await api.post('/study/flashcards', { deckName, front, back })
      } else {
        if (!noteId) return setError('Please select a note')
        await api.post(`/study/flashcards/generate/${noteId}`, { deckName })
      }
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create flashcard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
        <button className="modal-close" onClick={onClose}><X size={20} /></button>
        <h2 className="modal-title">Create Flashcard</h2>
        <p className="modal-subtitle">Add a single card or generate a full deck using AI.</p>

        <div className="modal-tabs" style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button 
            type="button"
            className={`modal-tab ${mode === 'manual' ? 'modal-tab--active' : ''}`}
            onClick={() => setMode('manual')}
            style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid var(--border-default)', background: mode === 'manual' ? 'var(--bg-hover)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}
          >
            <Book size={16} /> Manual
          </button>
          <button 
            type="button"
            className={`modal-tab ${mode === 'ai' ? 'modal-tab--active' : ''}`}
            onClick={() => setMode('ai')}
            style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid var(--border-default)', background: mode === 'ai' ? 'var(--bg-hover)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: mode === 'ai' ? 'var(--purple-500)' : 'inherit', cursor: 'pointer' }}
          >
            <Sparkles size={16} /> Generate with AI
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Deck Name</label>
            <input 
              autoFocus
              placeholder="e.g. System Design Basics"
              value={deckName}
              onChange={e => setDeckName(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-surface-alt)', color: 'var(--text-primary)' }}
            />
          </div>

          {mode === 'manual' ? (
            <>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Front (Question)</label>
                <textarea 
                  placeholder="What is CAP theorem?"
                  value={front}
                  onChange={e => setFront(e.target.value)}
                  required
                  rows={2}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-surface-alt)', color: 'var(--text-primary)', resize: 'vertical' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Back (Answer)</label>
                <textarea 
                  placeholder="Consistency, Availability, Partition tolerance..."
                  value={back}
                  onChange={e => setBack(e.target.value)}
                  required
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-surface-alt)', color: 'var(--text-primary)', resize: 'vertical' }}
                />
              </div>
            </>
          ) : (
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Select Note to Generate From</label>
              <div style={{ position: 'relative' }}>
                <FileText size={16} style={{ position: 'absolute', top: 12, left: 12, color: 'var(--text-tertiary)' }} />
                <select 
                  value={noteId}
                  onChange={e => setNoteId(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-surface-alt)', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  <option value="" disabled>Choose a note...</option>
                  {Array.isArray(notes) && notes.map(n => (
                    <option key={n._id || n.id} value={n._id || n.id}>{n.title}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {error && <p className="form-error" style={{ color: 'var(--red-500)', fontSize: 13, marginTop: 10 }}>{error}</p>}

          <div className="modal-actions" style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" className="btn btn--ghost" onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)' }}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8, background: mode === 'ai' ? 'var(--purple-500)' : 'var(--green-600)', color: '#fff', padding: '8px 16px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? <Loader2 size={16} className="spin" /> : null}
              {mode === 'manual' ? 'Add Flashcard' : 'Generate Deck'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
