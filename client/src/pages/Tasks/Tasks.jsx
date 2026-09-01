import { useCallback, useEffect, useMemo, useState } from 'react'
import TasksHeader from '../../components/tasks/TasksHeader/TasksHeader'
import TaskStats from '../../components/tasks/TaskStats/TaskStats'
import TasksFilters from '../../components/tasks/TasksFilters/TasksFilters'
import TasksListView from '../../components/tasks/TasksListView/TasksListView'
import TasksKanbanView from '../../components/tasks/TasksKanbanView/TasksKanbanView'
import TaskModal from '../../components/tasks/TaskModal/TaskModal'
import EmptyState from '../../components/common/EmptyState/EmptyState'
import Skeleton from '../../components/common/Skeleton/Skeleton'
import { taskService } from '../../services/taskService'
import { useToast } from '../../context/ToastContext'
import { Sparkles } from 'lucide-react'
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
  const [isSaving, setIsSaving] = useState(false)
  const { showToast } = useToast()

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
    setIsSaving(true)
    try {
      if (isEdit) {
        const updated = await taskService.updateTask(taskData.id || taskData._id, taskData)
        setTasks(prev => prev.map(t => (t.id === updated.id || t._id === updated._id) ? updated : t))
        showToast('Task updated successfully', 'success')
      } else {
        const created = await taskService.createTask(taskData)
        setTasks(prev => [created, ...prev])
        showToast('Task created successfully', 'success')
      }
      closeModal()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save task', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return
    try {
      await taskService.deleteTask(id)
      setTasks(prev => prev.filter(t => t.id !== id && t._id !== id))
      showToast('Task deleted', 'success')
      closeModal()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete task', 'error')
    }
  }

  const handleToggleDone = async (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done'
    try {
      const updated = await taskService.updateTask(task.id || task._id, { status: newStatus })
      setTasks(prev => prev.map(t => (t.id === updated.id || t._id === updated._id) ? updated : t))
      showToast(`Task marked as ${newStatus}`, 'success')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update task', 'error')
    }
  }

  const handleStatusChange = async (task, newStatus) => {
    try {
      const updated = await taskService.updateTask(task.id || task._id, { status: newStatus })
      setTasks(prev => prev.map(t => (t.id === updated.id || t._id === updated._id) ? updated : t))
      showToast(`Task moved to ${newStatus}`, 'success')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to move task', 'error')
    }
  }

  const clearFilters = () => {
    setSearch(''); setFilterStatus('all'); setFilterPriority('all'); setFilterCategory('all')
  }

  // ── Loading / error states ────────────────────────────────
  if (apiLoading) {
    return (
      <div className="tasks">
        <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Skeleton variant="line" height={40} width="30%" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <Skeleton variant="card" height={100} count={4} />
          </div>
          <Skeleton variant="table-row" count={5} />
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
          icon={Sparkles}
          title={hasActiveFilters ? 'No tasks found' : 'Your task list is clear! ✨'}
          description={hasActiveFilters ? 'Try adjusting your filters or search query.' : 'Create your first task and let\'s make it happen.'}
          actionLabel={hasActiveFilters ? 'Clear Filters' : 'Create Task'}
          onAction={hasActiveFilters ? clearFilters : () => openCreate()}
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
        isSaving={isSaving}
        onClose={closeModal}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  )
}
