import { Outlet, NavLink, Link } from 'react-router-dom'
import { ListChecks, ExternalLink, LogOut } from 'lucide-react'

export function AdminLayout() {
  const logout = () => fetch('/api/auth', { method: 'DELETE' }).then(() => window.location.href = '/admin')

  return (
    <div className="min-h-screen flex" style={{ background: '#F5F0E8' }}>
      <aside className="w-52 shrink-0 h-screen sticky top-0 flex flex-col" style={{ background: '#0F3D31' }}>
        <div className="px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <span className="text-xl">🌿</span>
          <p className="text-white text-sm font-bold mt-1 leading-none">Усадьба</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(240,232,213,0.45)' }}>Волонтёрство · Админ</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavLink to="/admin/tasks"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white hover:bg-white/08'}`}>
            <ListChecks size={15} /> Задачи
          </NavLink>
        </nav>
        <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <Link to="/" target="_blank"
            className="flex items-center gap-2 px-3 py-2 text-sm text-white/50 hover:text-white/80 rounded-lg hover:bg-white/05 transition-colors mb-1">
            <ExternalLink size={13} /> Публичная страница
          </Link>
          <button onClick={logout}
            className="flex items-center gap-2 px-3 py-2 w-full text-sm text-white/50 hover:text-white/80 rounded-lg hover:bg-white/05 transition-colors">
            <LogOut size={13} /> Выйти
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
