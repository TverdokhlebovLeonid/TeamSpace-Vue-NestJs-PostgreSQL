import {createParamDecorator, type ExecutionContext} from '@nestjs/common'
import type {AuthenticatedRequest, JwtPayload} from '@/common/types/authenticated-request'
export const CurrentUser = createParamDecorator(
  (
    data: keyof JwtPayload | undefined,
    ctx: ExecutionContext
  ): JwtPayload | JwtPayload[keyof JwtPayload] => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>()
    return data ? request.user[data] : request.user
  }
)
