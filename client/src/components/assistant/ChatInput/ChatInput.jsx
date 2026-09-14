import { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, Mic, MicOff, Loader2 } from 'lucide-react'
import { aiService } from '../../../services/aiService'
import './ChatInput.css'

export default function ChatInput({ onSend, disabled, initialValue, onEditConsumed }) {
  const [value, setValue] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const recognitionRef = useRef(null)

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = true
        
        recognitionRef.current.onresult = (event) => {
          let currentTranscript = ''
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript
          }
          setValue(prev => {
            // Very simple approach: if it's a final result, append cleanly, else just replace the whole thing if we are live transcribing.
            // But since continuous is false, we can just set it.
            return currentTranscript
          })
        }

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error', event.error)
          setIsListening(false)
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }
    }
  }, [])

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.')
      return
    }
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  // When parent signals an edit, pre-fill the input
  useEffect(() => {
    if (initialValue !== null && initialValue !== undefined) {
      setValue(initialValue)
      textareaRef.current?.focus()
      onEditConsumed?.()
    }
  }, [initialValue])

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 180) + 'px'
  }, [value])

  const submit = () => {
    if (!value.trim() || disabled || isUploading) return
    onSend(value.trim())
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file.')
      return
    }

    try {
      setIsUploading(true)
      const data = await aiService.uploadPdf(file)
      if (data.success && data.text) {
        // Send a message on behalf of user referencing the attached PDF
        const docMsg = `I have attached a document named "${file.name}". Please read it and summarize it, or answer my questions about it. Here is the document text:\n\n[DOCUMENT CONTENT START]\n${data.text}\n[DOCUMENT CONTENT END]`
        if (value.trim()) {
          onSend(`${value.trim()}\n\n${docMsg}`)
          setValue('')
        } else {
          onSend(docMsg)
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload and parse PDF')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="ci">
      <input 
        type="file" 
        accept="application/pdf" 
        style={{ display: 'none' }} 
        ref={fileInputRef} 
        onChange={handleFileUpload}
      />
      <button 
        className="ci__tool" 
        aria-label="Attach"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? <Loader2 size={14} className="spin" /> : <Paperclip size={14} />}
      </button>
      <textarea
        ref={textareaRef}
        className="ci__input"
        placeholder={isListening ? "Listening..." : "Ask AI anything about your tasks, goals, or life…"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
        }}
        rows={1}
      />
      <button 
        className={`ci__tool ${isListening ? 'ci__tool--active' : ''}`} 
        aria-label="Voice" 
        onClick={toggleMic}
        style={{ color: isListening ? 'var(--red-500)' : 'inherit' }}
      >
        {isListening ? <MicOff size={14} /> : <Mic size={14} />}
      </button>
      <button className="ci__send" onClick={submit} disabled={!value.trim() || disabled || isUploading}>
        <Send size={14} strokeWidth={2.4} />
      </button>
    </div>
  )
}
