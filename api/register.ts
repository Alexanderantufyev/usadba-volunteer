import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getDb } from './_db'
import { Resend } from 'resend'

function formatDateRu(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const months = ['января','февраля','марта','апреля','мая','июня',
                  'июля','августа','сентября','октября','ноября','декабря']
  const days = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота']
  const date = new Date(y, m - 1, d)
  return `${d} ${months[m - 1]} ${y} (${days[date.getDay()]})`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { task_id, name, phone, email, arrival_time } = req.body
  if (!task_id || !name?.trim() || !phone?.trim() || !email?.trim() || !arrival_time) {
    return res.status(400).json({ error: 'Заполните все поля' })
  }

  const sql = getDb()

  const [task] = await sql`SELECT * FROM vol_tasks WHERE id = ${task_id} AND is_active = true`
  if (!task) return res.status(404).json({ error: 'Задача не найдена' })

  const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM vol_registrations WHERE task_id = ${task_id}`
  if (n >= task.max_volunteers) return res.status(409).json({ error: 'Все места заняты' })

  const [dup] = await sql`
    SELECT id FROM vol_registrations WHERE task_id = ${task_id} AND email = ${email.trim()}`
  if (dup) return res.status(409).json({ error: 'Вы уже записаны на эту задачу' })

  await sql`
    INSERT INTO vol_registrations (task_id, name, phone, email, arrival_time)
    VALUES (${task_id}, ${name.trim()}, ${phone.trim()}, ${email.trim()}, ${arrival_time})`

  // Send email
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    try {
      const resend = new Resend(resendKey)
      const from = process.env.RESEND_FROM ?? 'onboarding@resend.dev'
      await resend.emails.send({
        from,
        to: email.trim(),
        subject: `Запись подтверждена — ${task.title}`,
        html: buildEmail({
          name: name.trim(),
          taskTitle: task.title,
          dateLabel: formatDateRu(task.task_date),
          location: task.location,
          arrivalTime: arrival_time,
          toolsInfo: task.tools_info,
        }),
      })
    } catch (e) {
      console.error('Email error:', e)
    }
  }

  return res.status(201).json({ ok: true })
}

function buildEmail(p: {
  name: string; taskTitle: string; dateLabel: string
  location: string; arrivalTime: string; toolsInfo: string
}) {
  return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:system-ui,sans-serif;">
<div style="max-width:540px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
  <div style="background:#0F3D31;padding:28px 32px;">
    <p style="margin:0;color:rgba(240,232,213,0.55);font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">Усадьба · Волонтёрство</p>
    <h1 style="margin:8px 0 0;color:#F0E8D5;font-size:22px;font-weight:700;">Вы записаны!</h1>
  </div>
  <div style="padding:28px 32px;">
    <p style="margin:0 0 20px;color:#1a1410;font-size:15px;">Здравствуйте, <strong>${p.name}</strong>!<br>Ваша запись подтверждена.</p>
    <div style="background:#E8F2EF;border-radius:10px;padding:18px 20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#1B6255;text-transform:uppercase;letter-spacing:1px;">Задача</p>
      <p style="margin:0 0 14px;font-size:17px;font-weight:700;color:#0F3D31;">${p.taskTitle}</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:3px 0;color:#6B6355;font-size:13px;width:110px;">📅 Дата</td><td style="padding:3px 0;color:#1a1410;font-size:13px;font-weight:500;">${p.dateLabel}</td></tr>
        ${p.location ? `<tr><td style="padding:3px 0;color:#6B6355;font-size:13px;">📍 Место</td><td style="padding:3px 0;color:#1a1410;font-size:13px;font-weight:500;">${p.location}</td></tr>` : ''}
        <tr><td style="padding:3px 0;color:#6B6355;font-size:13px;">🕐 Приду в</td><td style="padding:3px 0;color:#1a1410;font-size:13px;font-weight:500;">${p.arrivalTime}</td></tr>
        ${p.toolsInfo ? `<tr><td style="padding:3px 0;color:#6B6355;font-size:13px;vertical-align:top;">🔧 Взять с собой</td><td style="padding:3px 0;color:#1a1410;font-size:13px;font-weight:500;">${p.toolsInfo}</td></tr>` : ''}
      </table>
    </div>
    <p style="margin:0;color:#6B6355;font-size:13px;">Спасибо, что помогаете усадьбе! 🌿</p>
  </div>
  <div style="padding:14px 32px;border-top:1px solid #EDE5D0;background:#FAF6EE;">
    <p style="margin:0;color:#B0A892;font-size:11px;text-align:center;">Усадьба · Поморцы</p>
  </div>
</div>
</body></html>`
}
