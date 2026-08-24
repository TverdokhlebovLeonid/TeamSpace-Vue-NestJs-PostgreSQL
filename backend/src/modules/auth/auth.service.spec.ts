import {UnauthorizedException} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import {JwtService} from '@nestjs/jwt'
import {Test} from '@nestjs/testing'
import {UserRole} from '@/common/enums/user-role.enum'
import {AuthService} from '@/modules/auth/auth.service'
import {UsersService} from '@/modules/users/users.service'
import {createUser} from '../../../test/helpers'

describe('AuthService', () => {
  let service: AuthService
  const findByUsername = jest.fn()
  const findById = jest.fn()
  const verifyPassword = jest.fn()
  const signAsync = jest.fn()
  const verifyAsync = jest.fn()

  beforeEach(async () => {
    findByUsername.mockReset()
    findById.mockReset()
    verifyPassword.mockReset()
    signAsync.mockReset()
    verifyAsync.mockReset()
    signAsync.mockImplementation((_payload: unknown, options: {secret: string}) =>
      Promise.resolve(options.secret === 'access-secret' ? 'access-token' : 'refresh-token')
    )
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {provide: UsersService, useValue: {findByUsername, findById, verifyPassword}},
        {provide: JwtService, useValue: {signAsync, verifyAsync}},
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: () => ({
              accessSecret: 'access-secret',
              refreshSecret: 'refresh-secret',
              accessTtl: '15m',
              refreshTtl: '7d'
            })
          }
        }
      ]
    }).compile()
    service = module.get(AuthService)
  })

  it('logs in with a valid password and returns both tokens', async () => {
    findByUsername.mockResolvedValue(createUser())
    verifyPassword.mockResolvedValue(true)
    await expect(service.login({username: 'alice', password: 'secret123'})).resolves.toEqual({
      access: 'access-token',
      refresh: 'refresh-token'
    })
  })

  it('rejects login for an unknown user', async () => {
    findByUsername.mockResolvedValue(null)
    await expect(service.login({username: 'missing', password: 'x'})).rejects.toBeInstanceOf(
      UnauthorizedException
    )
  })

  it('rejects login for a wrong password', async () => {
    findByUsername.mockResolvedValue(createUser())
    verifyPassword.mockResolvedValue(false)
    await expect(service.login({username: 'alice', password: 'nope'})).rejects.toBeInstanceOf(
      UnauthorizedException
    )
  })

  it('refreshes tokens when the refresh JWT is valid and the user exists', async () => {
    const user = createUser({id: 'user-1'})
    verifyAsync.mockResolvedValue({sub: user.id, username: user.username, role: UserRole.USER})
    findById.mockResolvedValue(user)
    await expect(service.refresh('refresh-jwt')).resolves.toEqual({
      access: 'access-token',
      refresh: 'refresh-token'
    })
  })

  it('rejects refresh for an invalid token or a deleted user', async () => {
    verifyAsync.mockRejectedValue(new Error('expired'))
    await expect(service.refresh('bad')).rejects.toBeInstanceOf(UnauthorizedException)

    verifyAsync.mockResolvedValue({sub: 'gone', username: 'x', role: UserRole.USER})
    findById.mockResolvedValue(null)
    await expect(service.refresh('stale')).rejects.toBeInstanceOf(UnauthorizedException)
  })
})
