import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getDb } from '../_db'
import { isAuthenticated } from '../_auth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' })
  const sql = getDb()
  const { id } = req.query as { id: string }

  if (req.method === 'PUT') {
    const b = req.body
    const [row] = await sql`
      UPDATE vol_tasks SET
        title = ${b.title}, description = ${b.description ?? ''},
        task_date = ${b.task_date}, location = ${b.location ?? ''},
        tools_info = ${b.tools_info ?? ''}, max_volunteers = ${b.max_volunteers ?? 10},
        is_active = ${b.is_active ?? true}, updated_at = NOW()
      WHERE id = ${id} RETURNING *`
    return res.status(200).json({ task: row })
  }

  if (req.method === 'PATCH') {
    const b = req.body
    const [row] = await sql`
      UPDATE vol_tasks SET is_active = ${b.is_active}, updated_at = NOW()
      WHERE id = ${id} RETURNING *`
    return res.status(200).json({ task: row })
  }

  if (req.method === 'DELETE') {
    await sql`DELETE FROM vol_tasks WHERE id = ${id}`
    return res.status(200).json({ ok: true })
  }

  if (req.method === 'GET') {
    const [task] = await sql`SELECT * FROM vol_tasks WHERE id = ${id}`
    const regs = await sql`SELECT * FROM vol_registrations WHERE task_id = ${id} ORDER BY created_at`
    return res.status(200).json({ task, registrations: regs })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
