import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { format, parse, isValid } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ArrowLeft, MapPin, Users, Wrench, CheckCircle, Loader2 } from 'lucide-react'

interface Task {
  id: string; title: string; description: string; task_date: string
  location: string; tools_info: string; max_volunteers: number; reg_count: number
}

export function DayView() {
  const { date } = useParams<{ date: string }>()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTask, setActiveTask] = useState<string | null>(null)

  const parsed = date ? parse(date, 'yyyy-MM-dd', new Date()) : null
  const valid = parsed && isValid(parsed)

  useEffect(() => {
    if (!date) return
    fetch(`/api/tasks?date_from=${date}&date_to=${date}`)
      .then(r => r.json())
      .then(d => setTasks(d.tasks ?? []))
      .finally(() => setLoading(false))
  }, [date])

  const dateLabel = valid
    ? format(parsed!, 'd MMMM yyyy, EEEE', { locale: ru })
    : ''

  return (
    <div className="min-h-screen" style={{ background: '#F5F0E8' }}>
      <header style={{ background: '#0F3D31' }} className="px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link to="/" className="p-1.5 rounded-lg transition-colors hover:bg-white/10">
            <ArrowLeft size={18} color="rgba(240,232,213,0.7)" />
          </Link>
          <div>
            <p className="text-white font-bold text-sm leading-none capitalize">{dateLabel}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(240,232,213,0.5)' }}>Усадьба · Волонтёрские работы</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#1B6255', borderTopColor: 'transparent' }} />
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed p-12 text-center" style={{ borderColor: '#D9CCAF' }}>
            <p className="text-stone-400">На этот день задач нет</p>
            <Link to="/" className="mt-3 inline-block text-sm underline" style={{ color: '#1B6255' }}>
              Выбрать другой день
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm" style={{ color: '#6B6355' }}>
              {tasks.length} задач{tasks.length === 1 ? 'а' : tasks.length < 5 ? 'и' : ''} — выберите одну и запишитесь
            </p>
            {tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                isActive={activeTask === task.id}
                onSelect={() => setActiveTask(activeTask === task.id ? null : task.id)}
                onRegistered={() => {
                  setTasks(ts => ts.map(t => t.id === task.id ? { ...t, reg_count: t.reg_count + 1 } : t))
                  setActiveTask(null)
                }}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function TaskCard({ task, isActive, onSelect, onRegistered }: {
  task: Task; isActive: boolean; onSelect: () => void; onRegistered: () => void
}) {
  const spots = task.max_volunteers - task.reg_count
  const full = spots <= 0
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({ arrival_time: '', name: '', phone: '', email: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (f: keyof typeof form, v: string) => setForm(p => ({ ...p, [f]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.arrival_time || !form.name.trim() || !form.phone.trim() || !form.email.trim()) {
      setErr('Пожалуйста, заполните все поля'); return
    }
    setBusy(true); setErr('')
    try {
      const r = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: task.id, ...form }),
      })
      const d = await r.json()
      if (r.ok) { setDone(true); setTimeout(onRegistered, 1500) }
      else setErr(d.error ?? 'Ошибка при записи')
    } catch { setErr('Нет связи с сервером') }
    finally { setBusy(false) }
  }

  return (
    <div className="rounded-2xl border-2 overflow-hidden transition-all"
      style={{ borderColor: isActive ? '#1B6255' : '#D9CCAF', background: 'white' }}>

      {/* Header */}
      <button onClick={!full ? onSelect : undefined}
        className={`w-full text-left p-5 ${!full ? 'cursor-pointer' : ''}`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="text-base font-bold" style={{ color: '#1a1410' }}>{task.title}</h2>
          <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${full ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {full ? 'Мест нет' : `Мест: ${spots}`}
          </span>
        </div>
        {task.description && (
          <p className="text-sm mb-3 leading-relaxed" style={{ color: '#6B6355' }}>{task.description}</p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: '#9e9a92' }}>
          {task.location && <span className="flex items-center gap-1"><MapPin size={11} />{task.location}</span>}
          <span className="flex items-center gap-1"><Users size={11} />{task.reg_count} / {task.max_volunteers}</span>
          {task.tools_info && <span className="flex items-center gap-1"><Wrench size={11} />{task.tools_info}</span>}
        </div>
        {!full && !isActive && (
          <p className="text-xs font-semibold mt-3" style={{ color: '#1B6255' }}>Нажмите чтобы записаться →</p>
        )}
      </button>

      {/* Form */}
      {isActive && !full && (
        <div className="border-t px-5 py-4" style={{ borderColor: '#EDE5D0', background: '#FAF6EE' }}>
          {done ? (
            <div className="flex items-center gap-3 py-2">
              <CheckCircle size={20} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#1a1410' }}>Вы записаны!</p>
                <p className="text-xs mt-0.5" style={{ color: '#6B6355' }}>Тех задание отправлено на вашу почту</p>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#1B6255' }}>Запись</p>
              <F label="Во сколько сможете прийти?">
                <input type="time" value={form.arrival_time} onChange={e => set('arrival_time', e.target.value)} className="input" required />
              </F>
              <F label="Имя и фамилия">
                <input type="text" value={form.name} placeholder="Иванова Мария" onChange={e => set('name', e.target.value)} className="input" required />
              </F>
              <F label="Телефон">
                <input type="tel" value={form.phone} placeholder="+7 900 000-00-00" onChange={e => set('phone', e.target.value)} className="input" required />
              </F>
              <F label="Электронная почта">
                <input type="email" value={form.email} placeholder="mail@example.ru" onChange={e => set('email', e.target.value)} className="input" required />
                <p className="text-[11px] mt-0.5" style={{ color: '#9e9a92' }}>Туда придёт тех задание и памятка</p>
              </F>
              {err && <p className="text-sm text-red-500">{err}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onSelect}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium" style={{ background: '#EDE5D0', color: '#6B6355' }}>
                  Отмена
                </button>
                <button type="submit" disabled={busy}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: '#1B6255' }}>
                  {busy && <Loader2 size={14} className="animate-spin" />}
                  {busy ? 'Отправляем...' : 'Зарегистрироваться'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1" style={{ color: '#6B6355' }}>{label}</label>
      {children}
    </div>
  )
}
