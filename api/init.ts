import type { VercelRequest, VercelResponse } from '@vercel/node'
import { initDb } from './_db'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: 'DATABASE_URL не задан' })
  }
  try {
    await initDb()
    return res.status(200).json({ ok: true, message: 'База данных инициализирована' })
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
}
