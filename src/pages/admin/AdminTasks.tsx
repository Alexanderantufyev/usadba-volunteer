import { useEffect, useState } from 'react'
import { Plus, Trash2, Eye, EyeOff, Users, ChevronDown, ChevronUp, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface Task {
  id: string; title: string; description: string; task_date: string
  location: string; tools_info: string; max_volunteers: number
  is_active: boolean; reg_count: number
}
interface Reg { id: string; name: string; phone: string; email: string; arrival_time: string; created_at: string }

const EMPTY = { title: '', description: '', task_date: '', location: '', tools_info: '', max_volunteers: 10 }

export function AdminTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [regs, setRegs] = useState<Record<string, Reg[]>>({})

  const load = () => fetch('/api/tasks?admin=1').then(r => r.json()).then(d => setTasks(d.tasks ?? [])).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const set = (f: keyof typeof form, v: string | number) => setForm(p => ({ ...p, [f]: v }))

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.task_date) { toast.error('Введите название и дату'); return }
    setSaving(true)
    const r = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (r.ok) { toast.success('Задача создана'); setForm(EMPTY); setShowForm(false); load() }
    else toast.error('Ошибка')
    setSaving(false)
  }

  const toggle = async (task: Task) => {
    await fetch(`/api/tasks/${task.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !task.is_active }) })
    setTasks(ts => ts.map(t => t.id === task.id ? { ...t, is_active: !t.is_active } : t))
  }

  const remove = async (task: Task) => {
    if (!confirm(`Удалить «${task.title}»? Все регистрации тоже удалятся.`)) return
    await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
    setTasks(ts => ts.filter(t => t.id !== task.id))
    toast.success('Задача удалена')
  }

  const loadRegs = async (taskId: string) => {
    if (regs[taskId]) { setExpanded(expanded === taskId ? null : taskId); return }
    const r = await fetch(`/api/tasks/${taskId}`)
    const d = await r.json()
    setRegs(p => ({ ...p, [taskId]: d.registrations ?? [] }))
    setExpanded(taskId)
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1a1410' }}>Задачи</h1>
          <p className="text-sm mt-0.5" style={{ color: '#6B6355' }}>{tasks.length} всего</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#1B6255' }}>
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Отмена' : 'Добавить задачу'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={create} className="bg-white rounded-2xl border border-stone-200 p-5 mb-5 space-y-4">
          <h2 className="text-sm font-semibold" style={{ color: '#1a1410' }}>Новая задача</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium block mb-1" style={{ color: '#6B6355' }}>Название *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Уборка аллеи" className="input" required />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#6B6355' }}>Дата *</label>
              <input type="date" value={form.task_date} onChange={e => set('task_date', e.target.value)} className="input" required />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#6B6355' }}>Макс. волонтёров</label>
              <input type="number" value={form.max_volunteers} min={1} onChange={e => set('max_volunteers', +e.target.value)} className="input" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium block mb-1" style={{ color: '#6B6355' }}>Описание</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} className="input resize-none" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#6B6355' }}>Место</label>
              <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Берёзовая аллея" className="input" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#6B6355' }}>Взять с собой</label>
              <input value={form.tools_info} onChange={e => set('tools_info', e.target.value)} placeholder="Перчатки, грабли" className="input" />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-60"
            style={{ background: '#1B6255' }}>
            {saving ? 'Сохранение...' : 'Создать задачу'}
          </button>
        </form>
      )}

      {/* Task list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#1B6255', borderTopColor: 'transparent' }} />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 text-stone-400">Задач ещё нет</div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => {
            const dateLabel = format(new Date(task.task_date.slice(0, 10) + 'T12:00:00'), 'd MMMM yyyy, EEE', { locale: ru })
            const isOpen = expanded === task.id
            const taskRegs = regs[task.id] ?? []

            return (
              <div key={task.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${task.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-400'}`}>
                        {task.is_active ? 'Активна' : 'Скрыта'}
                      </span>
                      <span className="text-xs capitalize" style={{ color: '#9e9a92' }}>{dateLabel}</span>
                    </div>
                    <p className="text-sm font-semibold truncate" style={{ color: '#1a1410' }}>{task.title}</p>
                    {task.location && <p className="text-xs mt-0.5" style={{ color: '#9e9a92' }}>{task.location}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <button onClick={() => loadRegs(task.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{ background: '#F5F0E8', color: task.reg_count > 0 ? '#1B6255' : '#9e9a92' }}>
                      <Users size={12} /> {task.reg_count}/{task.max_volunteers}
                      {isOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                    <button onClick={() => toggle(task)} title={task.is_active ? 'Скрыть' : 'Показать'}
                      className="p-1.5 rounded-lg transition-colors hover:bg-stone-100" style={{ color: '#9e9a92' }}>
                      {task.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button onClick={() => remove(task)} title="Удалить"
                      className="p-1.5 rounded-lg transition-colors hover:bg-red-50" style={{ color: '#9e9a92' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Registrations */}
                {isOpen && (
                  <div className="border-t" style={{ borderColor: '#EDE5D0' }}>
                    {taskRegs.length === 0 ? (
                      <p className="px-4 py-3 text-sm" style={{ color: '#9e9a92' }}>Никто не записался</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ background: '#FAF6EE' }}>
                            {['Имя', 'Телефон', 'Email', 'Придёт в'].map(h => (
                              <th key={h} className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#9e9a92' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {taskRegs.map(r => (
                            <tr key={r.id} className="border-t" style={{ borderColor: '#EDE5D0' }}>
                              <td className="px-4 py-2.5 font-medium" style={{ color: '#1a1410' }}>{r.name}</td>
                              <td className="px-4 py-2.5" style={{ color: '#6B6355' }}>{r.phone}</td>
                              <td className="px-4 py-2.5" style={{ color: '#6B6355' }}>{r.email}</td>
                              <td className="px-4 py-2.5 font-medium" style={{ color: '#1B6255' }}>{r.arrival_time}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
