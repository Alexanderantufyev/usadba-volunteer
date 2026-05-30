import { createHash } from 'crypto'
import type { VercelRequest } from '@vercel/node'

const COOKIE = 'estate_auth'
export const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30 days

function makeToken(password: string): string {
  return createHash('sha256').update(`estate:${password}`).digest('hex')
}

export function getCookieHeader(password: string): string {
  const token = makeToken(password)
  return `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE}; Path=/`
}

export function clearCookieHeader(): string {
  return `${COOKIE}=; HttpOnly; SameSite=Strict; Max-Age=0; Path=/`
}

export function isAuthenticated(req: VercelRequest): boolean {
  const appPassword = process.env.APP_PASSWORD
  if (!appPassword) return true // no password configured — open access
  const raw = req.headers.cookie ?? ''
  const pair = raw.split(';').find((c) => c.trim().startsWith(`${COOKIE}=`))
  const token = pair ? pair.trim().slice(COOKIE.length + 1) : ''
  return token === makeToken(appPassword)
}

export function checkPassword(submitted: string): boolean {
  const appPassword = process.env.APP_PASSWORD
  if (!appPassword) return true
  return submitted === appPassword
}
