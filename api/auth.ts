import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isAuthenticated, checkPassword, getCookieHeader, clearCookieHeader } from './_auth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.status(isAuthenticated(req) ? 200 : 401).json({ ok: isAuthenticated(req) })
  }

  if (req.method === 'POST') {
    const { password } = req.body as { password?: string }
    if (password && checkPassword(password)) {
      res.setHeader('Set-Cookie', getCookieHeader(password))
      return res.status(200).json({ ok: true })
    }
    return res.status(401).json({ ok: false, error: 'Неверный пароль' })
  }

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', clearCookieHeader())
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
