'use client'
import { useState, useEffect } from 'react'

type Status = 'loading' | 'ok' | 'no'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/auth').then(r => r.json()).then(d => setStatus(d.ok ? 'ok' : 'no')).catch(() => setStatus('no'))
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('')
    const r = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) })
    if (r.ok) setStatus('ok')
    else { setErr('Неверный пароль'); setPw('') }
    setBusy(false)
  }

  if (status === 'loading') return <Spinner />

  if (status === 'no') return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F5F0E8' }}>
      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🌿</div>
          <h1 className="text-xl font-bold text-stone-800">Усадьба</h1>
          <p className="text-sm text-stone-500 mt-1">Волонтёрские работы · Админ</p>
        </div>
        <form onSubmit={submit} className="bg-white rounded-2xl p-6 shadow-lg border border-stone-200 space-y-4">
          <div>
            <label className="text-xs font-medium text-stone-500 mb-1 block">Пароль</label>
            <input type="password" value={pw} autoFocus placeholder="••••"
              onChange={e => { setPw(e.target.value); setErr('') }}
              className="input" />
            {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
          </div>
          <button type="submit" disabled={busy || !pw}
            className="w-full py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50 transition-colors"
            style={{ background: '#1B6255' }}>
            {busy ? 'Проверка...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )

  return <>{children}</>
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F0E8' }}>
      <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#1B6255', borderTopColor: 'transparent' }} />
    </div>
  )
}
