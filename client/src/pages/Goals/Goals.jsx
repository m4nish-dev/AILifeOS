import { useCallback, useEffect, useMemo, useState } from 'react'
import GoalsHeader from '../../components/goals/GoalsHeader/GoalsHeader'
import GoalStats from '../../components/goals/GoalStats/GoalStats'
import GoalCard from '../../components/goals/GoalCard/GoalCard'
import GoalModal from '../../components/goals/GoalModal/GoalModal'
import AIRoadmapModal from '../../components/goals/AIRoadmapModal/AIRoadmapModal'
import Skeleton from '../../components/common/Skeleton/Skeleton'
import EmptyState from '../../components/common/EmptyState/EmptyState'
import { goalService } from '../../services/goalService'
import { useToast } from '../../context/ToastContext'
import { Target } from 'lucide-react'
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
  const [isSaving, setIsSaving] = useState(false)
  const { showToast } = useToast()

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
    setIsSaving(true)
    try {
      if (isEdit) {
        const updated = await goalService.updateGoal(goalData.id || goalData._id, goalData)
        setGoals(prev => prev.map(g => (g.id === updated.id || g._id === updated._id) ? updated : g))
        showToast('Goal updated successfully', 'success')
      } else {
        const created = await goalService.createGoal(goalData)
        setGoals(prev => [created, ...prev])
        showToast('Goal created successfully', 'success')
      }
      setModalOpen(false); setEditingGoal(null)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save goal', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return
    try {
      await goalService.deleteGoal(id)
      setGoals(prev => prev.filter(g => g.id !== id && g._id !== id))
      showToast('Goal deleted', 'success')
      setModalOpen(false); setEditingGoal(null)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete goal', 'error')
    }
  }
  
  const handleAIGenerate = async (goalData) => {
    try {
      const created = await goalService.createGoal(goalData)
      setGoals(prev => [created, ...prev])
      showToast('Goal generated with AI', 'success')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to generate goal', 'error')
    }
  }

  // ── Loading / error states ────────────────────────────────
  if (apiLoading) {
    return (
      <div className="goals-page">
        <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Skeleton variant="line" height={40} width="40%" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            <Skeleton variant="card" height={220} count={3} />
          </div>
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
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Start with a big vision and let AI break it down into actionable milestones."
          actionLabel="Create Goal"
          onAction={openCreate}
        />
      ) : (
        <div className="goals-grid">
          {filtered.map(goal => (
            <GoalCard key={goal.id || goal._id} goal={goal} onClick={() => openEdit(goal)} />
          ))}
        </div>
      )}

      <GoalModal
        open={modalOpen} goal={editingGoal}
        isSaving={isSaving}
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
