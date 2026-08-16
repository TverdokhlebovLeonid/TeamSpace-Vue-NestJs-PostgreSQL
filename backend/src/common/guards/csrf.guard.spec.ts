import {type ExecutionContext, ForbiddenException} from '@nestjs/common'
import {CSRF_COOKIE, CSRF_HEADER} from '@/common/auth-cookies'
import {CsrfGuard} from '@/common/guards/csrf.guard'

function createContext(cookie?: string, header?: string | string[]): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        cookies: cookie === undefined ? {} : {[CSRF_COOKIE]: cookie},
        headers: header === undefined ? {} : {[CSRF_HEADER]: header}
      })
    })
  } as ExecutionContext
}

describe('CsrfGuard', () => {
  const guard = new CsrfGuard()

  it('allows when cookie matches header', () => {
    expect(guard.canActivate(createContext('token-a', 'token-a'))).toBe(true)
  })

  it('rejects when cookie is missing', () => {
    expect(() => guard.canActivate(createContext(undefined, 'token-a'))).toThrow(ForbiddenException)
  })

  it('rejects when header is missing', () => {
    expect(() => guard.canActivate(createContext('token-a'))).toThrow(ForbiddenException)
  })

  it('rejects when cookie and header mismatch', () => {
    expect(() => guard.canActivate(createContext('token-a', 'token-b'))).toThrow(ForbiddenException)
  })
})
