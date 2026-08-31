import { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, Mic } from 'lucide-react'
import './ChatInput.css'

export default function ChatInput({ onSend, disabled, initialValue, onEditConsumed }) {
  const [value, setValue] = useState('')
  const textareaRef = useRef(null)

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
    if (!value.trim() || disabled) return
    onSend(value.trim())
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  return (
    <div className="ci">
      <button className="ci__tool" aria-label="Attach"><Paperclip size={14} /></button>
      <textarea
        ref={textareaRef}
        className="ci__input"
        placeholder="Ask AI anything about your tasks, goals, or life…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
        }}
        rows={1}
      />
      <button className="ci__tool" aria-label="Voice"><Mic size={14} /></button>
      <button className="ci__send" onClick={submit} disabled={!value.trim() || disabled}>
        <Send size={14} strokeWidth={2.4} />
      </button>
    </div>
  )
}
