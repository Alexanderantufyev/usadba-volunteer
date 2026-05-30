import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { addDays, startOfWeek, format, isToday } from 'date-fns'
import { ru } from 'date-fns/locale'

interface Task { id: string; title: string; task_date: string; reg_count: number; max_volunteers: number }

const DAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export function WeekView() {
  const [tasksByDate, setTasksByDate] = useState<Record<string, Task[]>>({})
  const [loading, setLoading] = useState(true)

  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const from = format(days[0], 'yyyy-MM-dd')
  const to = format(days[6], 'yyyy-MM-dd')

  useEffect(() => {
    fetch(`/api/tasks?date_from=${from}&date_to=${to}`)
      .then(r => r.json())
      .then(d => {
        const map: Record<string, Task[]> = {}
        for (const t of d.tasks ?? []) {
          map[t.task_date] = [...(map[t.task_date] ?? []), t]
        }
        setTasksByDate(map)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen" style={{ background: '#F5F0E8' }}>
      {/* Header */}
      <header style={{ background: '#0F3D31' }} className="px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌿</span>
            <div>
              <p className="text-white font-bold text-sm leading-none">Усадьба</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(240,232,213,0.5)' }}>Волонтёрские работы</p>
            </div>
          </div>
          <Link to="/admin" className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
            style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(240,232,213,0.6)' }}>
            Администратор
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold mb-1" style={{ color: '#0F3D31' }}>
          {format(days[0], 'd MMM', { locale: ru })} — {format(days[6], 'd MMM yyyy', { locale: ru })}
        </h1>
        <p className="text-sm mb-6" style={{ color: '#6B6355' }}>Выберите день и запишитесь на работы</p>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#1B6255', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {days.map((day, i) => {
              const key = format(day, 'yyyy-MM-dd')
              const tasks = tasksByDate[key] ?? []
              const current = isToday(day)
              const past = day < today && !current

              return (
                <Link key={key} to={`/day/${key}`}
                  className={`block rounded-2xl border-2 p-4 transition-all ${past ? 'opacity-40 pointer-events-none' : 'hover:shadow-lg hover:-translate-y-0.5'}`}
                  style={{
                    borderColor: current ? '#1B6255' : '#D9CCAF',
                    background: current ? '#E8F2EF' : 'white',
                  }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: current ? '#1B6255' : '#9e9a92' }}>
                        {DAY_SHORT[i]}
                      </p>
                      <p className="text-3xl font-bold" style={{ color: '#1a1410' }}>
                        {format(day, 'd')}
                      </p>
                      <p className="text-xs capitalize" style={{ color: '#9e9a92' }}>
                        {format(day, 'LLLL', { locale: ru })}
                      </p>
                    </div>
                    {tasks.length > 0 && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ background: '#1B6255' }}>
                        {tasks.length}
                      </span>
                    )}
                  </div>

                  {tasks.length === 0 ? (
                    <p className="text-xs" style={{ color: '#9e9a92' }}>Задач нет</p>
                  ) : (
                    <div className="space-y-1.5">
                      {tasks.slice(0, 3).map(t => (
                        <div key={t.id} className="text-xs px-2 py-1.5 rounded-lg font-medium truncate"
                          style={{ background: '#F5F0E8', color: '#0F3D31' }}>
                          {t.title}
                        </div>
                      ))}
                      {tasks.length > 3 && (
                        <p className="text-xs" style={{ color: '#9e9a92' }}>+ещё {tasks.length - 3}</p>
                      )}
                    </div>
                  )}

                  {current && (
                    <p className="text-[10px] font-semibold mt-2 uppercase tracking-wider" style={{ color: '#1B6255' }}>
                      Сегодня
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
