import {UnauthorizedException} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import {Test} from '@nestjs/testing'
import {UserRole} from '@/common/enums/user-role.enum'
import {JwtStrategy} from '@/modules/auth/jwt.strategy'
import {UsersService} from '@/modules/users/users.service'
import {createUser} from '../../../test/helpers'

describe('JwtStrategy', () => {
  let strategy: JwtStrategy
  const findById = jest.fn()

  beforeEach(async () => {
    findById.mockReset()
    const module = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {getOrThrow: () => ({accessSecret: 'test-access-secret'})}
        },
        {provide: UsersService, useValue: {findById}}
      ]
    }).compile()
    strategy = module.get(JwtStrategy)
  })

  it('returns identity from the database, not the token', async () => {
    findById.mockResolvedValue(
      createUser({id: 'user-1', username: 'db-name', role: UserRole.ADMIN})
    )
    await expect(
      strategy.validate({sub: 'user-1', username: 'stale', role: UserRole.USER})
    ).resolves.toEqual({sub: 'user-1', username: 'db-name', role: UserRole.ADMIN})
  })

  it('rejects when the user was deleted', async () => {
    findById.mockResolvedValue(null)
    await expect(
      strategy.validate({sub: 'missing', username: 'x', role: UserRole.USER})
    ).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('rejects when findById returns no user for the payload', async () => {
    findById.mockResolvedValue(undefined)
    await expect(
      strategy.validate({sub: 'gone', username: 'x', role: UserRole.USER})
    ).rejects.toBeInstanceOf(UnauthorizedException)
  })
})
