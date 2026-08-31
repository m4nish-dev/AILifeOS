import { useCallback, useEffect, useMemo, useState } from 'react'
import TasksHeader from '../../components/tasks/TasksHeader/TasksHeader'
import TaskStats from '../../components/tasks/TaskStats/TaskStats'
import TasksFilters from '../../components/tasks/TasksFilters/TasksFilters'
import TasksListView from '../../components/tasks/TasksListView/TasksListView'
import TasksKanbanView from '../../components/tasks/TasksKanbanView/TasksKanbanView'
import TaskModal from '../../components/tasks/TaskModal/TaskModal'
import EmptyState from '../../components/tasks/EmptyState/EmptyState'
import { taskService } from '../../services/taskService'
import './Tasks.css'

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [apiLoading, setApiLoading] = useState(true)
  const [apiError, setApiError]     = useState('')

  // View
  const [view, setView] = useState('list')

  // Filters
  const [search, setSearch]               = useState('')
  const [filterStatus, setFilterStatus]   = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortBy, setSortBy]               = useState('dueDate')

  // Modal
  const [modalOpen, setModalOpen]       = useState(false)
  const [editingTask, setEditingTask]   = useState(null)
  const [initialStatus, setInitialStatus] = useState(null)

  // ── Fetch all tasks on mount ──────────────────────────────
  const fetchTasks = useCallback(async () => {
    try {
      setApiLoading(true)
      setApiError('')
      const data = await taskService.getTasks()
      setTasks(data)
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to load tasks.')
    } finally {
      setApiLoading(false)
    }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  // ── Client-side filter + sort (API already filtered by user) ──
  const hasActiveFilters =
    search !== '' || filterStatus !== 'all' ||
    filterPriority !== 'all' || filterCategory !== 'all'

  const filtered = useMemo(() => {
    let list = tasks
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.tags?.some(tag => tag.toLowerCase().includes(q))
      )
    }
    if (filterStatus   !== 'all') list = list.filter(t => t.status   === filterStatus)
    if (filterPriority !== 'all') list = list.filter(t => t.priority === filterPriority)
    if (filterCategory !== 'all') list = list.filter(t => t.category === filterCategory)

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'priority': return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
        case 'title':    return a.title.localeCompare(b.title)
        case 'created':  return new Date(b.createdAt) - new Date(a.createdAt)
        case 'dueDate':
        default:         return new Date(a.dueDate || 0) - new Date(b.dueDate || 0)
      }
    })
    return list
  }, [tasks, search, filterStatus, filterPriority, filterCategory, sortBy])

  // ── Handlers ─────────────────────────────────────────────
  const openCreate = (status = null) => {
    setEditingTask(null); setInitialStatus(status); setModalOpen(true)
  }
  const openEdit = (task) => {
    setEditingTask(task); setInitialStatus(null); setModalOpen(true)
  }
  const closeModal = () => {
    setModalOpen(false); setEditingTask(null); setInitialStatus(null)
  }

  const handleSave = async (taskData, isEdit) => {
    try {
      if (isEdit) {
        const updated = await taskService.updateTask(taskData.id || taskData._id, taskData)
        setTasks(prev => prev.map(t => (t.id === updated.id || t._id === updated._id) ? updated : t))
      } else {
        const created = await taskService.createTask(taskData)
        setTasks(prev => [created, ...prev])
      }
      closeModal()
    } catch (err) {
      console.error('Save task error:', err.response?.data?.message || err.message)
    }
  }

  const handleDelete = async (id) => {
    try {
      await taskService.deleteTask(id)
      setTasks(prev => prev.filter(t => t.id !== id && t._id !== id))
      closeModal()
    } catch (err) {
      console.error('Delete task error:', err.response?.data?.message || err.message)
    }
  }

  const handleToggleDone = async (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done'
    try {
      const updated = await taskService.updateTask(task.id || task._id, { status: newStatus })
      setTasks(prev => prev.map(t => (t.id === updated.id || t._id === updated._id) ? updated : t))
    } catch (err) {
      console.error('Toggle task error:', err.response?.data?.message || err.message)
    }
  }

  const handleStatusChange = async (task, newStatus) => {
    try {
      const updated = await taskService.updateTask(task.id || task._id, { status: newStatus })
      setTasks(prev => prev.map(t => (t.id === updated.id || t._id === updated._id) ? updated : t))
    } catch (err) {
      console.error('Status change error:', err.response?.data?.message || err.message)
    }
  }

  const clearFilters = () => {
    setSearch(''); setFilterStatus('all'); setFilterPriority('all'); setFilterCategory('all')
  }

  // ── Loading / error states ────────────────────────────────
  if (apiLoading) {
    return (
      <div className="tasks">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12, color: 'var(--text-tertiary)', fontSize: 14 }}>
          <div style={{ width: 18, height: 18, border: '2px solid var(--border-default)', borderTopColor: 'var(--green-600)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          Loading your tasks…
        </div>
      </div>
    )
  }

  if (apiError) {
    return (
      <div className="tasks">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
          <p style={{ color: 'var(--red-600)', fontSize: 14 }}>⚠️ {apiError}</p>
          <button onClick={fetchTasks} style={{ padding: '8px 16px', background: 'var(--green-600)', color: '#fff', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="tasks">
      <TasksHeader
        view={view}
        onViewChange={setView}
        search={search}
        onSearchChange={setSearch}
        onCreate={() => openCreate()}
        totalCount={tasks.length}
      />

      <TaskStats tasks={tasks} />

      <TasksFilters
        filterStatus={filterStatus}     setFilterStatus={setFilterStatus}
        filterPriority={filterPriority} setFilterPriority={setFilterPriority}
        filterCategory={filterCategory} setFilterCategory={setFilterCategory}
        sortBy={sortBy} setSortBy={setSortBy}
        hasActive={hasActiveFilters}
        onClear={clearFilters}
      />

      {filtered.length === 0 ? (
        <EmptyState
          onCreate={() => openCreate()}
          hasFilters={hasActiveFilters}
          onClear={clearFilters}
        />
      ) : view === 'list' ? (
        <TasksListView
          tasks={filtered}
          onEdit={openEdit}
          onToggleDone={handleToggleDone}
          onDelete={handleDelete}
        />
      ) : (
        <TasksKanbanView
          tasks={filtered}
          onEdit={openEdit}
          onStatusChange={handleStatusChange}
          onCreate={openCreate}
        />
      )}

      <TaskModal
        open={modalOpen}
        task={editingTask}
        initialStatus={initialStatus}
        onClose={closeModal}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  )
}
