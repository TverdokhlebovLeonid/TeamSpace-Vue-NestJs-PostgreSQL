import {UserLanguage, UserRole} from '@/common/enums/user-role.enum'
import {User} from '@/modules/users/user.entity'

export function createUser(overrides: Partial<User> = {}): User {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    username: 'alice',
    email: 'alice@example.com',
    firstName: 'Alice',
    lastName: 'Doe',
    passwordHash: 'hashed',
    role: UserRole.USER,
    language: UserLanguage.EN,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides
  }
}

export function mockRepository() {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn((entity: unknown) => Promise.resolve(entity)),
    create: jest.fn((entity: unknown) => entity),
    count: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn()
  }
}
