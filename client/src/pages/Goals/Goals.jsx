import { useCallback, useEffect, useMemo, useState } from 'react'
import GoalsHeader from '../../components/goals/GoalsHeader/GoalsHeader'
import GoalStats from '../../components/goals/GoalStats/GoalStats'
import GoalCard from '../../components/goals/GoalCard/GoalCard'
import GoalModal from '../../components/goals/GoalModal/GoalModal'
import AIRoadmapModal from '../../components/goals/AIRoadmapModal/AIRoadmapModal'
import { goalService } from '../../services/goalService'
import './Goals.css'

export default function Goals() {
  const [goals, setGoals] = useState([])
  const [apiLoading, setApiLoading] = useState(true)
  const [apiError, setApiError] = useState('')

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [aiOpen, setAiOpen] = useState(false)

  // ── Fetch all goals on mount ──────────────────────────────
  const fetchGoals = useCallback(async () => {
    try {
      setApiLoading(true)
      setApiError('')
      const data = await goalService.getGoals()
      setGoals(data)
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to load goals.')
    } finally {
      setApiLoading(false)
    }
  }, [])

  useEffect(() => { fetchGoals() }, [fetchGoals])

  const filtered = useMemo(() => {
    let list = goals
    if (search) list = list.filter(g => g.title.toLowerCase().includes(search.toLowerCase()))
    if (filter !== 'all') list = list.filter(g => g.status === filter || (filter === 'active' && (g.status === 'active' || g.status === 'on-track')))
    return list
  }, [goals, search, filter])

  const openCreate = () => { setEditingGoal(null); setModalOpen(true) }
  const openEdit = (goal) => { setEditingGoal(goal); setModalOpen(true) }
  
  const handleSave = async (goalData, isEdit) => {
    try {
      if (isEdit) {
        const updated = await goalService.updateGoal(goalData.id || goalData._id, goalData)
        setGoals(prev => prev.map(g => (g.id === updated.id || g._id === updated._id) ? updated : g))
      } else {
        const created = await goalService.createGoal(goalData)
        setGoals(prev => [created, ...prev])
      }
      setModalOpen(false); setEditingGoal(null)
    } catch (err) {
      console.error('Save goal error:', err.response?.data?.message || err.message)
    }
  }

  const handleDelete = async (id) => {
    try {
      await goalService.deleteGoal(id)
      setGoals(prev => prev.filter(g => g.id !== id && g._id !== id))
      setModalOpen(false); setEditingGoal(null)
    } catch (err) {
      console.error('Delete goal error:', err.response?.data?.message || err.message)
    }
  }
  
  const handleAIGenerate = async (goalData) => {
    try {
      const created = await goalService.createGoal(goalData)
      setGoals(prev => [created, ...prev])
    } catch (err) {
      console.error('AI generate error:', err.response?.data?.message || err.message)
    }
  }

  // ── Loading / error states ────────────────────────────────
  if (apiLoading) {
    return (
      <div className="goals-page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12, color: 'var(--text-tertiary)', fontSize: 14 }}>
          <div style={{ width: 18, height: 18, border: '2px solid var(--border-default)', borderTopColor: 'var(--green-600)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          Loading your goals…
        </div>
      </div>
    )
  }

  if (apiError) {
    return (
      <div className="goals-page">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
          <p style={{ color: 'var(--red-600)', fontSize: 14 }}>⚠️ {apiError}</p>
          <button onClick={fetchGoals} style={{ padding: '8px 16px', background: 'var(--green-600)', color: '#fff', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="goals-page">
      <GoalsHeader
        search={search} onSearch={setSearch}
        onCreate={openCreate}
        onAIGenerate={() => setAiOpen(true)}
        count={goals.length}
        filter={filter} onFilterChange={setFilter}
      />
      <GoalStats goals={goals} />

      {filtered.length === 0 ? (
        <div className="goals-empty">
          <div className="goals-empty__icon">🎯</div>
          <h3>No goals yet</h3>
          <p>Start with a big vision and let AI break it down.</p>
        </div>
      ) : (
        <div className="goals-grid">
          {filtered.map(goal => (
            <GoalCard key={goal.id || goal._id} goal={goal} onClick={() => openEdit(goal)} />
          ))}
        </div>
      )}

      <GoalModal
        open={modalOpen} goal={editingGoal}
        onClose={() => { setModalOpen(false); setEditingGoal(null) }}
        onSave={handleSave} onDelete={handleDelete}
      />
      <AIRoadmapModal
        open={aiOpen} onClose={() => setAiOpen(false)}
        onGenerate={handleAIGenerate}
      />
    </div>
  )
}
