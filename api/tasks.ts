import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getDb } from './_db'
import { isAuthenticated } from './_auth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const sql = getDb()

  if (req.method === 'GET') {
    const { admin, date_from, date_to } = req.query as Record<string, string>
    if (admin === '1' && !isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' })

    let rows
    if (admin === '1') {
      rows = await sql`
        SELECT t.*, COUNT(r.id)::int AS reg_count
        FROM vol_tasks t
        LEFT JOIN vol_registrations r ON r.task_id = t.id
        GROUP BY t.id
        ORDER BY t.task_date ASC, t.created_at ASC`
    } else if (date_from && date_to) {
      rows = await sql`
        SELECT t.*, COUNT(r.id)::int AS reg_count
        FROM vol_tasks t
        LEFT JOIN vol_registrations r ON r.task_id = t.id
        WHERE t.is_active = true AND t.task_date >= ${date_from} AND t.task_date <= ${date_to}
        GROUP BY t.id
        ORDER BY t.task_date ASC, t.created_at ASC`
    } else {
      rows = await sql`
        SELECT t.*, COUNT(r.id)::int AS reg_count
        FROM vol_tasks t
        LEFT JOIN vol_registrations r ON r.task_id = t.id
        WHERE t.is_active = true
        GROUP BY t.id
        ORDER BY t.task_date ASC, t.created_at ASC`
    }

    return res.status(200).json({ tasks: rows })
  }

  if (req.method === 'POST') {
    if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' })
    const b = req.body
    if (!b.title?.trim() || !b.task_date) return res.status(400).json({ error: 'title и task_date обязательны' })
    const [row] = await sql`
      INSERT INTO vol_tasks (title, description, task_date, location, tools_info, max_volunteers)
      VALUES (${b.title.trim()}, ${b.description ?? ''}, ${b.task_date},
              ${b.location ?? ''}, ${b.tools_info ?? ''}, ${b.max_volunteers ?? 10})
      RETURNING *`
    return res.status(201).json({ task: row })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
