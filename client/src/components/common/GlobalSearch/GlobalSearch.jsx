import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, CheckSquare, Target, Calendar } from 'lucide-react';
import api from '../../../services/api';
import './GlobalSearch.css';

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ tasks: [], goals: [], notes: [], events: [] });
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Handle Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    } else {
      setQuery('');
      setResults({ tasks: [], goals: [], notes: [], events: [] });
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 2) {
        setResults({ tasks: [], goals: [], notes: [], events: [] });
        return;
      }
      setIsLoading(true);
      try {
        const { data } = await api.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(data.data);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const navigateTo = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const totalResults = results.tasks.length + results.goals.length + results.notes.length + results.events.length;

  return (
    <div className="global-search-backdrop" onClick={() => setIsOpen(false)}>
      <div className="global-search-modal" onClick={e => e.stopPropagation()}>
        
        <div className="global-search-header">
          <Search size={20} className="text-secondary" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tasks, notes, goals... (Type at least 2 chars)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="esc-hint">ESC</kbd>
        </div>

        <div className="global-search-results">
          {isLoading && <div className="global-search-loading">Searching...</div>}
          
          {!isLoading && query.length >= 2 && totalResults === 0 && (
            <div className="global-search-empty">No results found for "{query}"</div>
          )}

          {!isLoading && results.tasks.length > 0 && (
            <div className="global-search-section">
              <h3><CheckSquare size={14} /> Tasks</h3>
              {results.tasks.map(t => (
                <div key={t._id} className="global-search-item" onClick={() => navigateTo('/tasks')}>
                  <span>{t.title}</span>
                  <span className="badge">{t.status}</span>
                </div>
              ))}
            </div>
          )}

          {!isLoading && results.goals.length > 0 && (
            <div className="global-search-section">
              <h3><Target size={14} /> Goals</h3>
              {results.goals.map(g => (
                <div key={g._id} className="global-search-item" onClick={() => navigateTo('/goals')}>
                  <span>{g.title}</span>
                  <span className="badge">{g.status}</span>
                </div>
              ))}
            </div>
          )}

          {!isLoading && results.notes.length > 0 && (
            <div className="global-search-section">
              <h3><FileText size={14} /> Notes</h3>
              {results.notes.map(n => (
                <div key={n._id} className="global-search-item" onClick={() => navigateTo('/notes')}>
                  <span>{n.title}</span>
                </div>
              ))}
            </div>
          )}

          {!isLoading && results.events.length > 0 && (
            <div className="global-search-section">
              <h3><Calendar size={14} /> Events</h3>
              {results.events.map(e => (
                <div key={e._id} className="global-search-item" onClick={() => navigateTo('/calendar')}>
                  <span>{e.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
