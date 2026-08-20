import type {ExecutionContext} from '@nestjs/common'
import {ThrottlerGuard} from '@nestjs/throttler'
import {HttpThrottlerGuard} from '@/common/guards/http-throttler.guard'

describe('HttpThrottlerGuard', () => {
  const guard = Object.create(HttpThrottlerGuard.prototype) as HttpThrottlerGuard

  it('skips throttling for non-http contexts', async () => {
    const context = {getType: () => 'ws'} as unknown as ExecutionContext
    await expect(guard.canActivate(context)).resolves.toBe(true)
  })

  it('delegates HTTP requests to ThrottlerGuard', async () => {
    const canActivate = jest.spyOn(ThrottlerGuard.prototype, 'canActivate').mockResolvedValue(true)
    const context = {getType: () => 'http'} as unknown as ExecutionContext
    await expect(guard.canActivate(context)).resolves.toBe(true)
    expect(canActivate).toHaveBeenCalled()
    canActivate.mockRestore()
  })
})
