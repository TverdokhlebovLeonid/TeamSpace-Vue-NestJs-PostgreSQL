import {type ExecutionContext} from '@nestjs/common'
import {Reflector} from '@nestjs/core'
import {JwtAuthGuard} from '@/common/guards/jwt-auth.guard'

function httpContext(): ExecutionContext {
  return {
    getType: () => 'http',
    getHandler: () => ({}),
    getClass: () => ({})
  } as ExecutionContext
}

describe('JwtAuthGuard', () => {
  const getAllAndOverride = jest.fn()
  const guard = new JwtAuthGuard({getAllAndOverride} as unknown as Reflector)

  beforeEach(() => {
    getAllAndOverride.mockReset()
  })

  it('skips JWT for non-http contexts', () => {
    const context = {getType: () => 'ws'} as unknown as ExecutionContext
    expect(guard.canActivate(context)).toBe(true)
    expect(getAllAndOverride).not.toHaveBeenCalled()
  })

  it('skips JWT for public routes', () => {
    getAllAndOverride.mockReturnValue(true)
    expect(guard.canActivate(httpContext())).toBe(true)
  })
})
