import { useState } from 'react'
import ChatSidebar from '../../components/assistant/ChatSidebar/ChatSidebar'
import ChatMessages from '../../components/assistant/ChatMessages/ChatMessages'
import ChatInput from '../../components/assistant/ChatInput/ChatInput'
import SuggestionChips from '../../components/assistant/SuggestionChips/SuggestionChips'
import './AIAssistant.css'

const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const initialConvos = [
  { id: 'c1', title: 'Plan my Monday', preview: 'Given your calendar, here\'s…', messages: [
    { role: 'user', content: 'Plan my Monday', time: '9:00 AM' },
    { role: 'assistant', content: '## Monday Plan\n\n- **9:00–10:00** – Deep work: Finish React module\n- **10:00–10:30** – Team standup\n- **10:30–12:00** – Continue portfolio work\n- **12:00–13:00** – Lunch + light reading\n- **13:00–15:00** – DSA practice (2 problems)\n- **15:00–17:00** – Client meeting prep\n- **17:00–18:00** – Review & plan Tuesday\n\nWould you like me to add these to your calendar?', time: '9:00 AM' },
  ]},
  { id: 'c2', title: 'DSA study strategy', preview: 'Try the 3-2-1 method…', messages: [] },
  { id: 'c3', title: 'Weekly review help', preview: 'Let\'s reflect on…', messages: [] },
]

export default function AIAssistant() {
  const [conversations, setConversations] = useState(initialConvos)
  const [activeId, setActiveId] = useState('c1')
  const [loading, setLoading] = useState(false)
  const [editingValue, setEditingValue] = useState(null)

  const active = conversations.find(c => c.id === activeId)

  const send = async (text) => {
    const userMsg = { role: 'user', content: text, time: now() }

    const currentActive = conversations.find(c => c.id === activeId)
    const previousMessages = currentActive ? currentActive.messages : []
    const allMessages = [...previousMessages, userMsg]

    const withUser = conversations.map(c =>
      c.id === activeId ? { ...c, messages: allMessages } : c
    )
    setConversations(withUser)
    setLoading(true)

    try {
      const response = await fetch('http://localhost:5001/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages.map(m => ({ role: m.role, content: m.content })) })
      })

      const data = await response.json()

      if (data.success) {
        const reply = data.message
        setConversations(prev => prev.map(c =>
          c.id === activeId
            ? { ...c, messages: [...c.messages, { role: 'assistant', content: reply, time: now() }], preview: reply.slice(0, 60) }
            : c
        ))
      } else {
        const reply = '⚠️ ' + (data.error || data.message || 'Unknown error')
        setConversations(prev => prev.map(c =>
          c.id === activeId
            ? { ...c, messages: [...c.messages, { role: 'assistant', content: reply, time: now() }], preview: 'Error…' }
            : c
        ))
      }
    } catch {
      const reply = '⚠️ Could not reach the server. Make sure the backend is running on port 5001.'
      setConversations(prev => prev.map(c =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, { role: 'assistant', content: reply, time: now() }], preview: 'Error…' }
          : c
      ))
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (index, content) => {
    setEditingValue(content)
  }

  const newChat = () => {
    const id = `c${Date.now()}`
    setConversations([{ id, title: 'New Chat', preview: '', messages: [] }, ...conversations])
    setActiveId(id)
  }

  const deleteChat = (id) => {
    const remaining = conversations.filter(c => c.id !== id)
    setConversations(remaining)
    if (activeId === id) setActiveId(remaining[0]?.id)
  }

  return (
    <div className="ai-page">
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={newChat}
        onDelete={deleteChat}
      />
      <div className="ai-main">
        <div className="ai-main__chat">
          {!active || active.messages.length === 0 ? (
            <SuggestionChips onPick={send} />
          ) : (
            <ChatMessages messages={active.messages} loading={loading} onEdit={handleEdit} />
          )}
        </div>
        <div className="ai-main__input">
          <ChatInput onSend={send} disabled={loading} initialValue={editingValue} onEditConsumed={() => setEditingValue(null)} />
          <p className="ai-main__hint">AI can make mistakes. Verify important information.</p>
        </div>
      </div>
    </div>
  )
}
