import {getRepositoryToken} from '@nestjs/typeorm'
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import {Test} from '@nestjs/testing'
import * as bcrypt from 'bcryptjs'
import {Not} from 'typeorm'
import {UserLanguage, UserRole} from '@/common/enums/user-role.enum'
import {User} from '@/modules/users/user.entity'
import {UsersService} from '@/modules/users/users.service'
import {createUser, mockRepository} from '../../../test/helpers'

jest.mock('bcryptjs', () => ({
  hash: jest.fn((password: string) => Promise.resolve(`hash:${password}`)),
  compare: jest.fn((password: string, hash: string) => Promise.resolve(hash === `hash:${password}`))
}))

describe('UsersService', () => {
  let service: UsersService
  const users = mockRepository()

  beforeEach(async () => {
    users.findOne.mockReset()
    users.find.mockReset()
    users.save.mockReset()
    users.create.mockReset()
    users.count.mockReset()
    users.create.mockImplementation((entity: unknown) => entity)
    users.save.mockImplementation((entity: unknown) => Promise.resolve(entity))
    jest.mocked(bcrypt.hash).mockClear()
    jest.mocked(bcrypt.compare).mockClear()
    const module = await Test.createTestingModule({
      providers: [UsersService, {provide: getRepositoryToken(User), useValue: users}]
    }).compile()
    service = module.get(UsersService)
  })

  describe('lookup and create', () => {
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
      await expect(
        service.create({username: 'alice', password: 'Secret123'})
      ).rejects.toBeInstanceOf(ConflictException)
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

  describe('profile and password', () => {
    it('updates only language on profile change', async () => {
      const user = createUser({language: UserLanguage.EN})
      users.findOne.mockResolvedValue(user)
      const updated = await service.updateProfile(user.id, {language: UserLanguage.RU})
      expect(updated.language).toBe(UserLanguage.RU)
      expect(updated.username).toBe(user.username)
    })

    it('rejects changePassword when the current password is wrong', async () => {
      users.findOne.mockResolvedValue(createUser({passwordHash: 'hash:other'}))
      await expect(
        service.changePassword('id', {currentPassword: 'nope', newPassword: 'NewPass12'})
      ).rejects.toBeInstanceOf(UnauthorizedException)
    })

    it('hashes the new password on success', async () => {
      const user = createUser({passwordHash: 'hash:oldpass'})
      users.findOne.mockResolvedValue(user)
      await service.changePassword(user.id, {currentPassword: 'oldpass', newPassword: 'NewPass12'})
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPass12', 12)
      expect(users.save).toHaveBeenCalledWith(
        expect.objectContaining({passwordHash: 'hash:NewPass12'})
      )
    })

    it('verifies passwords as true and false', async () => {
      const user = createUser({passwordHash: 'hash:secret'})
      await expect(service.verifyPassword(user, 'secret')).resolves.toBe(true)
      await expect(service.verifyPassword(user, 'wrong')).resolves.toBe(false)
    })
  })

  describe('admin update and role', () => {
    it('rejects a username taken by another user', async () => {
      const user = createUser({id: 'a', username: 'alice'})
      users.findOne
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(createUser({id: 'b', username: 'bob'}))
      await expect(service.updateByAdmin('a', {username: 'bob'}, 'admin-1')).rejects.toBeInstanceOf(
        ConflictException
      )
    })

    it('persists an empty email when the field is provided', async () => {
      const user = createUser({email: 'old@example.com'})
      users.findOne.mockResolvedValue(user)
      const updated = await service.updateByAdmin(user.id, {email: ''}, 'admin-1')
      expect(updated.email).toBe('')
    })

    it('blocks self-demotion', async () => {
      const admin = createUser({id: 'admin-1', role: UserRole.ADMIN})
      users.findOne.mockResolvedValue(admin)
      await expect(
        service.updateByAdmin('admin-1', {role: UserRole.USER}, 'admin-1')
      ).rejects.toBeInstanceOf(BadRequestException)
    })

    it('blocks demoting the last admin', async () => {
      const admin = createUser({id: 'admin-1', role: UserRole.ADMIN})
      users.findOne.mockResolvedValue(admin)
      users.count.mockResolvedValue(1)
      await expect(
        service.updateByAdmin('admin-1', {role: UserRole.USER}, 'admin-2')
      ).rejects.toThrow('Cannot demote the last admin.')
    })

    it('is a no-op when the role does not change', async () => {
      const user = createUser({role: UserRole.USER})
      users.findOne.mockResolvedValue(user)
      const result = await service.changeRole(user.id, UserRole.USER, 'admin-1')
      expect(result).toBe(user)
      expect(users.save).not.toHaveBeenCalled()
    })
  })
})
