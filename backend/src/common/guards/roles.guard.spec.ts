import {type ExecutionContext, ForbiddenException} from '@nestjs/common'
import {Reflector} from '@nestjs/core'
import {UserRole} from '@/common/enums/user-role.enum'
import {RolesGuard} from '@/common/guards/roles.guard'

function httpContext(role?: UserRole): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({user: role ? {role} : undefined})
    })
  } as unknown as ExecutionContext
}

describe('RolesGuard', () => {
  const getAllAndOverride = jest.fn()
  const guard = new RolesGuard({getAllAndOverride} as unknown as Reflector)

  it('allows when no roles metadata is set', () => {
    getAllAndOverride.mockReturnValue(undefined)
    expect(guard.canActivate(httpContext(UserRole.USER))).toBe(true)
  })

  it('forbids USER on admin routes', () => {
    getAllAndOverride.mockReturnValue([UserRole.ADMIN])
    expect(() => guard.canActivate(httpContext(UserRole.USER))).toThrow(ForbiddenException)
  })

  it('allows ADMIN on admin routes', () => {
    getAllAndOverride.mockReturnValue([UserRole.ADMIN])
    expect(guard.canActivate(httpContext(UserRole.ADMIN))).toBe(true)
  })
})
