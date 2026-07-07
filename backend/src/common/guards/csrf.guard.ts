import {CanActivate, type ExecutionContext, ForbiddenException, Injectable} from '@nestjs/common'
import type {Request} from 'express'
import {CSRF_COOKIE, CSRF_HEADER} from '@/common/auth-cookies'

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()
    const cookies = request.cookies as Record<string, string | undefined> | undefined
    const cookieToken = cookies?.[CSRF_COOKIE]
    const headerValue = request.headers[CSRF_HEADER]
    const headerToken = Array.isArray(headerValue) ? headerValue[0] : headerValue
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      throw new ForbiddenException('Invalid CSRF token.')
    }
    return true
  }
}
