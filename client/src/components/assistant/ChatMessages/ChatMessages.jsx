import { useEffect, useRef, useState } from 'react'
import { Sparkles, User, Copy, ThumbsUp, ThumbsDown, Check, Pencil } from 'lucide-react'
import './ChatMessages.css'

export default function ChatMessages({ messages, loading, onEdit }) {
  const endRef = useRef(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  return (
    <div className="cm">
      {messages.map((m, i) => (
        <MessageBubble key={i} message={m} index={i} onEdit={onEdit} />
      ))}
      {loading && (
        <div className="cm__msg cm__msg--assistant">
          <div className="cm__avatar cm__avatar--ai">
            <Sparkles size={14} strokeWidth={2.4} />
          </div>
          <div className="cm__body">
            <div className="cm__meta">
              <span className="cm__author">AI Assistant</span>
            </div>
            <div className="cm__typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  )
}

function MessageBubble({ message: m, index, onEdit }) {
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState(null) // 'up' | 'down' | null
  const isAI = m.role === 'assistant'

  const time = m.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const handleCopy = () => {
    navigator.clipboard.writeText(m.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`cm__msg cm__msg--${m.role}`}>
      <div className={`cm__avatar ${isAI ? 'cm__avatar--ai' : 'cm__avatar--user'}`}>
        {isAI ? <Sparkles size={14} strokeWidth={2.4} /> : <User size={14} strokeWidth={2.4} />}
      </div>
      <div className="cm__body">
        <div className="cm__meta">
          <span className="cm__author">{isAI ? 'AI Assistant' : 'You'}</span>
          <span className="cm__time">{time}</span>
        </div>
        <div className={`cm__text ${isAI ? 'cm__text--ai' : 'cm__text--user'}`}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
        />
        <div className={`cm__actions ${isAI ? 'cm__actions--ai' : 'cm__actions--user'}`}>
          <button
            className="cm__action-btn"
            aria-label="Copy"
            onClick={handleCopy}
            title="Copy"
          >
            {copied ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          {!isAI && onEdit && (
            <button
              className="cm__action-btn"
              aria-label="Edit"
              onClick={() => onEdit(index, m.content)}
              title="Edit prompt"
            >
              <Pencil size={11} />
              <span>Edit</span>
            </button>
          )}
          {isAI && (
            <>
              <div className="cm__action-divider" />
              <button
                className={`cm__action-btn cm__action-btn--thumb ${feedback === 'up' ? 'cm__action-btn--active-up' : ''}`}
                aria-label="Helpful"
                onClick={() => setFeedback(prev => prev === 'up' ? null : 'up')}
                title="Helpful"
              >
                <ThumbsUp size={11} />
              </button>
              <button
                className={`cm__action-btn cm__action-btn--thumb ${feedback === 'down' ? 'cm__action-btn--active-down' : ''}`}
                aria-label="Not helpful"
                onClick={() => setFeedback(prev => prev === 'down' ? null : 'down')}
                title="Not helpful"
              >
                <ThumbsDown size={11} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function renderMarkdown(text) {
  if (!text) return ''

  let html = text
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Fenced code blocks (```lang\n...\n```)
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const langLabel = lang ? `<span class="cm__code-lang">${lang}</span>` : ''
    return `<div class="cm__code-block"><div class="cm__code-header">${langLabel}<button class="cm__code-copy" onclick="(function(b){navigator.clipboard.writeText(b.closest('.cm__code-block').querySelector('code').innerText);b.textContent='Copied!';setTimeout(()=>b.textContent='Copy',2000)})(this)">Copy</button></div><pre><code>${code.trim()}</code></pre></div>`
  })

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h4 class="cm__h4">$1</h4>')
  html = html.replace(/^## (.+)$/gm, '<h3 class="cm__h3">$1</h3>')
  html = html.replace(/^# (.+)$/gm, '<h2 class="cm__h2">$1</h2>')

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr class="cm__hr" />')

  // Bold & italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Inline code
  html = html.replace(/`([^`\n]+)`/g, '<code class="cm__inline-code">$1</code>')

  // Numbered lists
  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, (match) => {
    const items = match.trim().split('\n').map(line =>
      `<li>${line.replace(/^\d+\. /, '')}</li>`
    ).join('')
    return `<ol class="cm__ol">${items}</ol>`
  })

  // Unordered lists (- or *)
  html = html.replace(/((?:^[-*] .+\n?)+)/gm, (match) => {
    const items = match.trim().split('\n').map(line =>
      `<li>${line.replace(/^[-*] /, '')}</li>`
    ).join('')
    return `<ul class="cm__ul">${items}</ul>`
  })

  // Blockquote
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="cm__blockquote">$1</blockquote>')

  // Paragraphs — split by double newline, wrap non-block lines in <p>
  const blockTags = /^<(h[2-4]|ul|ol|pre|div|blockquote|hr)/
  html = html.split(/\n{2,}/).map(chunk => {
    chunk = chunk.trim()
    if (!chunk) return ''
    if (blockTags.test(chunk)) return chunk
    // Single newlines inside paragraphs become <br>
    return `<p>${chunk.replace(/\n/g, '<br />')}</p>`
  }).join('\n')

  return html
}
