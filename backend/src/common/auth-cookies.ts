import {randomBytes} from 'node:crypto'
import type {CookieOptions, Response} from 'express'
export const REFRESH_COOKIE = 'refresh_token'
export const CSRF_COOKIE = 'csrf_token'
export const CSRF_HEADER = 'x-csrf-token'
export const REFRESH_COOKIE_PATH = '/api/auth/jwt'

const DURATION_UNITS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000
}

export function durationToMs(value: string, fallbackMs = 7 * DURATION_UNITS.d): number {
  const match = /^(\d+)([smhd])?$/.exec(value.trim())
  if (!match) return fallbackMs
  const amount = Number(match[1])
  const unit = match[2] ?? 's'
  return amount * DURATION_UNITS[unit]
}

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex')
}

interface SetAuthCookiesParams {
  res: Response
  refreshToken: string
  csrfToken: string
  maxAgeMs: number
  secure: boolean
}

export function setAuthCookies({
  res,
  refreshToken,
  csrfToken,
  maxAgeMs,
  secure
}: SetAuthCookiesParams): void {
  const base: CookieOptions = {sameSite: 'lax', secure, maxAge: maxAgeMs}
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...base,
    httpOnly: true,
    path: REFRESH_COOKIE_PATH
  })
  res.cookie(CSRF_COOKIE, csrfToken, {
    ...base,
    httpOnly: false,
    path: '/'
  })
}

export function clearAuthCookies(res: Response, secure: boolean): void {
  const base: CookieOptions = {sameSite: 'lax', secure}
  res.clearCookie(REFRESH_COOKIE, {...base, httpOnly: true, path: REFRESH_COOKIE_PATH})
  res.clearCookie(CSRF_COOKIE, {...base, httpOnly: false, path: '/'})
}
