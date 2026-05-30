import { neon } from '@neondatabase/serverless'

export function getDb() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL не задан')
  return neon(url)
}

export async function initDb() {
  const sql = getDb()

  await sql`
    CREATE TABLE IF NOT EXISTS vol_tasks (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title           TEXT NOT NULL,
      description     TEXT NOT NULL DEFAULT '',
      task_date       DATE NOT NULL,
      location        TEXT NOT NULL DEFAULT '',
      tools_info      TEXT NOT NULL DEFAULT '',
      max_volunteers  INTEGER NOT NULL DEFAULT 10,
      is_active       BOOLEAN NOT NULL DEFAULT true,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS vol_registrations (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      task_id       UUID NOT NULL REFERENCES vol_tasks(id) ON DELETE CASCADE,
      name          TEXT NOT NULL,
      phone         TEXT NOT NULL,
      email         TEXT NOT NULL,
      arrival_time  TEXT NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`CREATE INDEX IF NOT EXISTS idx_vtasks_date  ON vol_tasks(task_date)`
  await sql`CREATE INDEX IF NOT EXISTS idx_vreg_task    ON vol_registrations(task_id)`
}
