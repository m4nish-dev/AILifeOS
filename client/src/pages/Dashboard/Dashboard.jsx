import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { 
  CheckSquare, Calendar, Target, FileText, Sparkles, Flame, Loader2, AlertCircle, 
  Clock, Zap, Plus, Play, MoreHorizontal, ChevronRight, MessageSquare, Briefcase, Code2, GraduationCap
} from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts'
import { dashboardService } from '../../services/dashboardService'
import './Dashboard.css'

const mockProductivityData = [
  { time: '8am', score: 40, baseline: 30 }, { time: '10am', score: 65, baseline: 45 },
  { time: '12pm', score: 85, baseline: 50 }, { time: '2pm', score: 55, baseline: 60 },
  { time: '4pm', score: 90, baseline: 55 }, { time: '6pm', score: 75, baseline: 40 }
]

const recentActivityMock = [
  { id: 1, title: 'Completed "Q3 Review"', time: '2h ago', color: 'var(--green-500)' },
  { id: 2, title: 'Added 2 new goals', time: '4h ago', color: 'var(--blue-500)' },
  { id: 3, title: 'Studied Spanish', time: 'Yesterday', color: 'var(--amber-500)' },
]

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [planTab, setPlanTab] = useState('work')
  const prefersReducedMotion = useReducedMotion()
  const navigate = useNavigate()

  const fetchData = async () => {
    try {
      const summary = await dashboardService.getDashboardSummary()
      setData(summary)
      setError(null)
    } catch (err) {
      console.error(err)
      setError('Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !data) {
    return (
      <div className="dash-loading">
        <Loader2 size={32} className="an-spin" color="var(--green-500)" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="dash-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <AlertCircle size={48} color="var(--red-500)" />
        <h2>{error}</h2>
        <button onClick={fetchData} className="an-btn-primary" style={{ marginTop: 16 }}>Retry</button>
      </div>
    )
  }

  const { user, stats, todayFocus, upcomingEvents, activeGoalsList, recentNotes, streakDays, productivityScore, aiInsight } = data
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  
  const filteredFocus = todayFocus.filter(task => {
    if (planTab === 'work') return task.category !== 'personal'
    return task.category === 'personal'
  })

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: prefersReducedMotion ? 0 : 0.06 }
    }
  }
  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  return (
    <motion.div 
      className="dash-page"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="dash-layout">
        
        {/* MAIN COLUMN */}
        <div className="dash-main">
          
          {/* Hero Row */}
          <motion.div className="dash-hero" variants={itemVariants}>
            <div>
              <h1 className="dash-hero__title">
                {user.greeting}, <span className="text-gradient">{user.name.split(' ')[0]}</span> 👋
              </h1>
              <p className="dash-hero__subtitle">Here's what's happening today.</p>
            </div>
            <div className="dash-hero__date">
              <Calendar size={14} />
              {todayStr}
            </div>
          </motion.div>

          {/* Stats Row */}
          <motion.div className="dash-stats" variants={itemVariants}>
            <div className="dash-stat-card" data-accent="green">
              <div className="dash-stat__header">
                <div className="dash-stat__icon"><CheckSquare size={18} /></div>
                Tasks Done
              </div>
              <div className="dash-stat__value">{stats.tasksDone} / {stats.tasksTotal}</div>
              <div className="dash-stat__trend text-green-500">↑ 12% vs last week</div>
              <div className="dash-stat__glow"></div>
            </div>
            
            <div className="dash-stat-card" data-accent="blue">
              <div className="dash-stat__header">
                <div className="dash-stat__icon"><Target size={18} /></div>
                Active Goals
              </div>
              <div className="dash-stat__value">{stats.activeGoals}</div>
              <div className="dash-stat__trend text-blue-500">On track</div>
              <div className="dash-stat__glow"></div>
            </div>

            <div className="dash-stat-card" data-accent="amber">
              <div className="dash-stat__header">
                <div className="dash-stat__icon"><Flame size={18} /></div>
                Study Streak
              </div>
              <div className="dash-stat__value" style={{ color: streakDays >= 7 ? 'var(--amber-500)' : 'inherit' }}>
                {streakDays} <span style={{fontSize: 14, fontWeight: 'normal', color: 'var(--text-tertiary)'}}>days</span>
              </div>
              <div className="dash-stat__trend text-amber-500">Keep it up! 🔥</div>
              <div className="dash-stat__glow"></div>
            </div>

            <div className="dash-stat-card" data-accent="purple">
              <div className="dash-stat__header">
                <div className="dash-stat__icon"><Zap size={18} /></div>
                Productivity Score
              </div>
              <div className="dash-stat__value">{productivityScore}<span style={{fontSize: 14, fontWeight: 'normal', color: 'var(--text-tertiary)'}}>/100</span></div>
              <div className="dash-stat__trend text-purple-500">Top 5% this month</div>
              <div className="dash-stat__glow"></div>
            </div>
          </motion.div>

          {/* Today's Plan */}
          <motion.div className="dash-section" variants={itemVariants}>
            <div className="dash-section__header">
              <div className="dash-section__title">
                <div className="dash-section__icon-bg"><CheckSquare size={16} /></div>
                Today's Plan
              </div>
              <div className="dash-section__actions">
                <div className="dash-tabs">
                  <button className={`dash-tab ${planTab === 'work' ? 'dash-tab--active' : ''}`} onClick={() => setPlanTab('work')}>Work</button>
                  <button className={`dash-tab ${planTab === 'personal' ? 'dash-tab--active' : ''}`} onClick={() => setPlanTab('personal')}>Personal</button>
                </div>
                <button className="dash-btn-primary" onClick={() => navigate('/tasks')}>
                  <Plus size={16} /> Add Task
                </button>
              </div>
            </div>
            <div className="dash-task-list">
              {filteredFocus.length > 0 ? filteredFocus.map((task, i) => (
                <div className="dash-task-row" key={task._id || i}>
                  <div className={`dash-task-bar dash-task-bar--${task.priority?.toLowerCase() || 'medium'}`}></div>
                  <div className="dash-task-checkbox"></div>
                  <div className="dash-task-content">
                    <div className="dash-task-title">{task.title}</div>
                    <div className="dash-task-meta">{task.time || '10:00 AM'} · {task.duration || 45}m</div>
                  </div>
                  <div className="dash-task-right">
                    <span className={`dash-badge dash-badge--${task.priority?.toLowerCase() || 'medium'}`}>{task.priority || 'medium'}</span>
                    <button className="dash-icon-btn"><Play size={14} /></button>
                  </div>
                </div>
              )) : (
                <div className="dash-empty">
                  <CheckSquare size={32} color="var(--text-tertiary)" />
                  <p>No {planTab} tasks yet</p>
                  <button className="dash-btn-primary" style={{marginTop: 8}} onClick={() => navigate('/tasks')}>Create one</button>
                </div>
              )}
            </div>
          </motion.div>

          {/* AI Insight */}
          <motion.div className="dash-insight-card" variants={itemVariants}>
            <div className="dash-insight__icon"><Sparkles size={18} /></div>
            <div className="dash-insight__content">
              <p>{aiInsight}</p>
              <div className="dash-insight__actions">
                <button className="dash-btn-ghost">Dismiss</button>
                <button className="dash-btn-ghost" style={{color: 'var(--green-500)'}}>Apply</button>
              </div>
            </div>
          </motion.div>

          {/* Triple Row */}
          <motion.div className="dash-triple-grid" variants={itemVariants}>
            
            <div className="dash-card dash-card--chart">
              <div className="dash-card__header">Productivity Overview</div>
              <div className="dash-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockProductivityData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--green-500)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--green-500)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--coffee-500)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--coffee-500)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip 
                      contentStyle={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', borderRadius: '8px' }} 
                      itemStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Area type="monotone" dataKey="baseline" stroke="var(--coffee-500)" strokeWidth={2} fillOpacity={1} fill="url(#colorBase)" />
                    <Area type="monotone" dataKey="score" stroke="var(--green-500)" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="dash-card dash-card--actions">
              <div className="dash-card__header">Quick Actions</div>
              <div className="dash-quick-actions">
                <button className="dash-qa-btn" style={{ '--qa-color': 'var(--blue-500)', '--qa-bg': 'var(--blue-50)' }} onClick={() => navigate('/notes')}><FileText size={20} /><span>New Note</span></button>
                <button className="dash-qa-btn" style={{ '--qa-color': 'var(--green-500)', '--qa-bg': 'var(--green-50)' }} onClick={() => navigate('/tasks')}><CheckSquare size={20} /><span>Add Task</span></button>
                <button className="dash-qa-btn" style={{ '--qa-color': 'var(--purple-500)', '--qa-bg': 'var(--purple-50)' }} onClick={() => navigate('/ai-assistant')}><Sparkles size={20} /><span>Ask AI</span></button>
                <button className="dash-qa-btn" style={{ '--qa-color': 'var(--amber-500)', '--qa-bg': 'var(--amber-50)' }} onClick={() => navigate('/goals')}><Target size={20} /><span>Log Goal</span></button>
              </div>
            </div>

            <div className="dash-card dash-card--recent">
              <div className="dash-card__header">Recent Activity</div>
              <div className="dash-timeline">
                {recentActivityMock.map(item => (
                  <div className="dash-tl-item" key={item.id}>
                    <div className="dash-tl-dot" style={{ background: item.color }}></div>
                    <div className="dash-tl-content">
                      <div className="dash-tl-title">{item.title}</div>
                      <div className="dash-tl-time">{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>

        </div>

        {/* RIGHT ASIDE */}
        <div className="dash-aside">
          
          <motion.div className="dash-card dash-card--cal" variants={itemVariants}>
            <div className="dash-cal-header">
              <span>September 2026</span>
              <div className="dash-cal-nav">
                <button><ChevronRight size={14} style={{transform:'rotate(180deg)'}}/></button>
                <button><ChevronRight size={14} /></button>
              </div>
            </div>
            <div className="dash-cal-grid">
              {['S','M','T','W','T','F','S'].map((d,i) => <div key={i} className="dash-cal-day-head">{d}</div>)}
              {Array.from({length: 30}).map((_, i) => (
                <div key={i} className={`dash-cal-day ${i === 13 ? 'dash-cal-day--today' : ''} ${i % 5 === 0 ? 'dash-cal-day--has-task' : ''}`}>
                  {i + 1}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div className="dash-card dash-card--focus" variants={itemVariants}>
            <div className="dash-card__header" style={{marginBottom: 0}}>Daily Focus</div>
            <div className="dash-focus-ring-container">
              <svg viewBox="0 0 100 100" className="dash-focus-svg">
                <circle cx="50" cy="50" r="40" className="dash-focus-bg" />
                <motion.circle 
                  cx="50" cy="50" r="40" className="dash-focus-stroke" 
                  initial={{ strokeDashoffset: 251 }} 
                  animate={{ strokeDashoffset: 75 }} 
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                />
              </svg>
              <div className="dash-focus-center">
                <span className="dash-focus-val">4h 20m</span>
                <span className="dash-focus-lbl">Focus</span>
              </div>
            </div>
          </motion.div>

          <motion.div className="dash-card dash-card--goals" variants={itemVariants}>
            <div className="dash-card__header">Active Goals</div>
            <div className="dash-aside-goals">
              {activeGoalsList.map(g => (
                <div className="dash-ag-item" key={g._id}>
                  <div className="dash-ag-head">
                    <span className="dash-ag-title">{g.title}</span>
                    <span className="dash-ag-pct">{g.progress}%</span>
                  </div>
                  <div className="dash-ag-bar">
                    <motion.div 
                      className="dash-ag-fill" 
                      style={{ background: g.color || 'var(--green-500)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${g.progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div className="dash-assistant-mini" variants={itemVariants}>
            <div className="dash-am-orb"></div>
            <div className="dash-am-content">
              <span>Ready to assist.</span>
              <MessageSquare size={14} />
            </div>
          </motion.div>

        </div>

      </div>
    </motion.div>
  )
}
