import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import {InjectRepository} from '@nestjs/typeorm'
import * as bcrypt from 'bcryptjs'
import {Not, Repository} from 'typeorm'
import {UserLanguage, UserRole} from '@/common/enums/user-role.enum'
import {ChangePasswordDto} from '@/modules/users/dto/change-password.dto'
import {CreateUserDto} from '@/modules/users/dto/create-user.dto'
import {UpdateProfileDto} from '@/modules/users/dto/update-profile.dto'
import {UpdateUserDto} from '@/modules/users/dto/update-user.dto'
import {User} from '@/modules/users/user.entity'

const BCRYPT_ROUNDS = 12

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>
  ) {}

  findById(id: string): Promise<User | null> {
    return this.users.findOne({where: {id}})
  }

  findByUsername(username: string): Promise<User | null> {
    return this.users.findOne({where: {username}})
  }

  async getByIdOrThrow(id: string): Promise<User> {
    const user = await this.findById(id)
    if (!user) throw new NotFoundException('User not found.')
    return user
  }

  findAll(): Promise<User[]> {
    return this.users.find({order: {username: 'ASC'}})
  }

  findContacts(excludeId: string): Promise<User[]> {
    return this.users.find({where: {id: Not(excludeId)}, order: {username: 'ASC'}})
  }

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.findByUsername(dto.username)
    if (existing) throw new ConflictException('Username already taken.')
    const user = this.users.create({
      username: dto.username,
      email: dto.email ?? '',
      firstName: dto.firstName ?? '',
      lastName: dto.lastName ?? '',
      role: dto.role ?? UserRole.USER,
      language: UserLanguage.EN,
      passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS)
    })
    return this.users.save(user)
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.getByIdOrThrow(id)
    user.language = dto.language
    return this.users.save(user)
  }

  async changePassword(id: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.getByIdOrThrow(id)
    const matches = await bcrypt.compare(dto.currentPassword, user.passwordHash)
    if (!matches) throw new UnauthorizedException('Incorrect current password.')
    user.passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS)
    await this.users.save(user)
  }

  async updateByAdmin(id: string, dto: UpdateUserDto, requesterId: string): Promise<User> {
    const user = await this.getByIdOrThrow(id)

    if (dto.username !== undefined && dto.username !== user.username) {
      const existing = await this.findByUsername(dto.username)
      if (existing && existing.id !== id) throw new ConflictException('Username already taken.')
      user.username = dto.username
    }

    if (dto.email !== undefined) user.email = dto.email
    if (dto.firstName !== undefined) user.firstName = dto.firstName
    if (dto.lastName !== undefined) user.lastName = dto.lastName
    if (dto.language !== undefined) user.language = dto.language

    if (dto.role !== undefined && dto.role !== user.role) {
      if (user.role === UserRole.ADMIN && dto.role !== UserRole.ADMIN) {
        if (id === requesterId) {
          throw new BadRequestException('You cannot revoke your own admin role.')
        }
        const adminCount = await this.users.count({where: {role: UserRole.ADMIN}})
        if (adminCount <= 1) throw new BadRequestException('Cannot demote the last admin.')
      }
      user.role = dto.role
    }

    return this.users.save(user)
  }

  async changeRole(id: string, role: UserRole, requesterId: string): Promise<User> {
    const user = await this.getByIdOrThrow(id)
    if (user.role === role) return user
    if (user.role === UserRole.ADMIN && role !== UserRole.ADMIN) {
      if (id === requesterId) {
        throw new BadRequestException('You cannot revoke your own admin role.')
      }
      const adminCount = await this.users.count({where: {role: UserRole.ADMIN}})
      if (adminCount <= 1) throw new BadRequestException('Cannot demote the last admin.')
    }
    user.role = role
    return this.users.save(user)
  }

  async remove(id: string, requesterId: string): Promise<void> {
    if (id === requesterId) throw new BadRequestException('Cannot delete your own account.')
    const user = await this.getByIdOrThrow(id)
    if (user.role === UserRole.ADMIN) {
      const adminCount = await this.users.count({where: {role: UserRole.ADMIN}})
      if (adminCount <= 1) throw new BadRequestException('Cannot delete the last admin.')
    }
    await this.users.remove(user)
  }

  verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash)
  }
}
