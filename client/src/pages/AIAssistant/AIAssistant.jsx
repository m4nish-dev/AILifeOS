import { useState, useEffect } from 'react'
import ChatSidebar from '../../components/assistant/ChatSidebar/ChatSidebar'
import ChatMessages from '../../components/assistant/ChatMessages/ChatMessages'
import ChatInput from '../../components/assistant/ChatInput/ChatInput'
import SuggestionChips from '../../components/assistant/SuggestionChips/SuggestionChips'
import { aiService } from '../../services/aiService'
import './AIAssistant.css'

export default function AIAssistant() {
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [activeMessages, setActiveMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingValue, setEditingValue] = useState(null)

  // Fetch sidebar conversations
  const fetchConversations = async () => {
    try {
      const data = await aiService.getConversations()
      setConversations(data)
      if (data.length > 0 && !activeId) setActiveId(data[0]._id)
    } catch (err) {
      console.error('Failed to load conversations', err)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [])

  // Fetch full conversation when activeId changes
  useEffect(() => {
    if (!activeId) {
      setActiveMessages([])
      return
    }
    // If it's a temp ID for a new chat, just clear messages
    if (activeId.startsWith('new_')) {
      setActiveMessages([])
      return
    }

    const loadChat = async () => {
      try {
        const data = await aiService.getConversation(activeId)
        setActiveMessages(data.messages || [])
      } catch (err) {
        console.error('Failed to load chat', err)
      }
    }
    loadChat()
  }, [activeId])

  const send = async (text) => {
    const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() }
    const updatedMessages = [...activeMessages, userMsg]
    setActiveMessages(updatedMessages)
    setLoading(true)

    try {
      // If it's a "new_" ID, pass null so backend creates a new conversation
      const convIdToPass = activeId?.startsWith('new_') ? null : activeId
      const response = await aiService.chatWithAI(updatedMessages.map(m => ({ role: m.role, content: m.content })), convIdToPass)
      
      const aiMsg = { role: 'assistant', content: response.message, timestamp: new Date().toISOString() }
      setActiveMessages([...updatedMessages, aiMsg])
      
      // If this was a new conversation, the backend will return the new conversationId
      if (response.conversationId && response.conversationId !== activeId) {
        setActiveId(response.conversationId)
      }
      
      // Refresh sidebar
      fetchConversations()
    } catch (err) {
      setActiveMessages([...updatedMessages, { role: 'assistant', content: '⚠️ Error: ' + err.message }])
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (index, content) => {
    setEditingValue(content)
  }

  const newChat = () => {
    const tempId = `new_${Date.now()}`
    setConversations([{ _id: tempId, title: 'New Chat', preview: '' }, ...conversations])
    setActiveId(tempId)
  }

  const deleteChat = async (id) => {
    if (id.startsWith('new_')) {
      const remaining = conversations.filter(c => c._id !== id)
      setConversations(remaining)
      setActiveId(remaining[0]?._id)
      return
    }

    if (!confirm('Delete this conversation?')) return
    try {
      await aiService.deleteConversation(id)
      const remaining = conversations.filter(c => c._id !== id)
      setConversations(remaining)
      if (activeId === id) setActiveId(remaining[0]?._id || null)
    } catch (err) {
      console.error('Failed to delete', err)
    }
  }

  return (
    <div className="ai-page">
      <ChatSidebar
        conversations={conversations.map(c => ({ id: c._id, title: c.title, preview: c.preview }))}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={newChat}
        onDelete={deleteChat}
      />
      <div className="ai-main">
        <div className="ai-main__chat">
          {!activeMessages.length ? (
            <SuggestionChips onPick={send} />
          ) : (
            <ChatMessages messages={activeMessages.map(m => ({ ...m, time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }))} loading={loading} onEdit={handleEdit} />
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
