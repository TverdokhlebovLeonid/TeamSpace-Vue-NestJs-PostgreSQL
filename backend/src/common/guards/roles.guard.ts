import {CanActivate, type ExecutionContext, ForbiddenException, Injectable} from '@nestjs/common'
import {Reflector} from '@nestjs/core'
import {ROLES_KEY} from '@/common/decorators/roles.decorator'
import {UserRole} from '@/common/enums/user-role.enum'
import type {AuthenticatedRequest} from '@/common/types/authenticated-request'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ])
    if (!requiredRoles?.length) return true
    const {user} = context.switchToHttp().getRequest<AuthenticatedRequest>()
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Admin role required.')
    }
    return true
  }
}
