import {getRepositoryToken} from '@nestjs/typeorm'
import {ConflictException, NotFoundException} from '@nestjs/common'
import {Test} from '@nestjs/testing'
import {Not} from 'typeorm'
import {UserLanguage, UserRole} from '@/common/enums/user-role.enum'
import {User} from '@/modules/users/user.entity'
import {UsersService} from '@/modules/users/users.service'
import {createUser, mockRepository} from '../../../test/helpers'

jest.mock('bcryptjs', () => ({
  hash: jest.fn((password: string) => Promise.resolve(`hash:${password}`)),
  compare: jest.fn()
}))

describe('UsersService lookup and create', () => {
  let service: UsersService
  const users = mockRepository()

  beforeEach(async () => {
    users.findOne.mockReset()
    users.find.mockReset()
    users.save.mockReset()
    users.create.mockReset()
    users.create.mockImplementation((entity: unknown) => entity)
    users.save.mockImplementation((entity: unknown) => Promise.resolve(entity))
    const module = await Test.createTestingModule({
      providers: [UsersService, {provide: getRepositoryToken(User), useValue: users}]
    }).compile()
    service = module.get(UsersService)
  })

  it('throws 404 when the user is missing', async () => {
    users.findOne.mockResolvedValue(null)
    await expect(service.getByIdOrThrow('missing')).rejects.toBeInstanceOf(NotFoundException)
  })

  it('creates a user with hashed password and default role/language', async () => {
    users.findOne.mockResolvedValue(null)
    const result = await service.create({username: 'alice', password: 'Secret123'})
    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'alice',
        role: UserRole.USER,
        language: UserLanguage.EN,
        passwordHash: 'hash:Secret123'
      })
    )
    expect(result.passwordHash).toBe('hash:Secret123')
  })

  it('rejects a taken username', async () => {
    users.findOne.mockResolvedValue(createUser())
    await expect(service.create({username: 'alice', password: 'Secret123'})).rejects.toBeInstanceOf(
      ConflictException
    )
  })

  it('excludes the current user from contacts', async () => {
    users.find.mockResolvedValue([])
    await service.findContacts('user-1')
    expect(users.find).toHaveBeenCalledWith({
      where: {id: Not('user-1')},
      order: {username: 'ASC'}
    })
  })

  it('lists all users ordered by username', async () => {
    users.find.mockResolvedValue([createUser()])
    await expect(service.findAll()).resolves.toHaveLength(1)
    expect(users.find).toHaveBeenCalledWith({order: {username: 'ASC'}})
  })
})
