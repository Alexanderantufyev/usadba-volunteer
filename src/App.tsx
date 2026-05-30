import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { WeekView } from './pages/WeekView'
import { DayView } from './pages/DayView'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminTasks } from './pages/admin/AdminTasks'
import { AuthGate } from './components/AuthGate'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<WeekView />} />
        <Route path="/day/:date" element={<DayView />} />
        <Route path="/admin" element={<AuthGate><AdminLayout /></AuthGate>}>
          <Route index element={<Navigate to="tasks" replace />} />
          <Route path="tasks" element={<AdminTasks />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="bottom-right" toastOptions={{ duration: 3000, style: { borderRadius: '10px', fontSize: '14px' } }} />
    </>
  )
}
