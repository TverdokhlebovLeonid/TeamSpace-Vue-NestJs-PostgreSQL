import type {Response} from 'express'
import {
  CSRF_COOKIE,
  REFRESH_COOKIE,
  REFRESH_COOKIE_PATH,
  clearAuthCookies,
  durationToMs,
  setAuthCookies
} from '@/common/auth-cookies'

describe('auth-cookies', () => {
  it('parses duration strings to milliseconds', () => {
    expect(durationToMs('15m')).toBe(15 * 60_000)
    expect(durationToMs('7d')).toBe(7 * 86_400_000)
  })

  it('returns fallback for an invalid duration', () => {
    const fallback = 1234
    expect(durationToMs('nope', fallback)).toBe(fallback)
  })

  it('sets refresh as httpOnly and csrf as readable', () => {
    const cookie = jest.fn()
    const res = {cookie} as unknown as Response
    setAuthCookies({
      res,
      refreshToken: 'refresh-jwt',
      csrfToken: 'csrf-value',
      maxAgeMs: 1000,
      secure: false
    })
    expect(cookie).toHaveBeenCalledWith(
      REFRESH_COOKIE,
      'refresh-jwt',
      expect.objectContaining({httpOnly: true, path: REFRESH_COOKIE_PATH, sameSite: 'lax'})
    )
    expect(cookie).toHaveBeenCalledWith(
      CSRF_COOKIE,
      'csrf-value',
      expect.objectContaining({httpOnly: false, path: '/'})
    )
  })

  it('clears both auth cookies', () => {
    const clearCookie = jest.fn()
    const res = {clearCookie} as unknown as Response
    clearAuthCookies(res, false)
    expect(clearCookie).toHaveBeenCalledWith(
      REFRESH_COOKIE,
      expect.objectContaining({httpOnly: true, path: REFRESH_COOKIE_PATH})
    )
    expect(clearCookie).toHaveBeenCalledWith(
      CSRF_COOKIE,
      expect.objectContaining({httpOnly: false, path: '/'})
    )
  })
})
