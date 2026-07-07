import {ApiProperty} from '@nestjs/swagger'
import {UserLanguage, UserRole} from '@/common/enums/user-role.enum'
import type {User} from '@/modules/users/user.entity'
export class UserDto {
  @ApiProperty({format: 'uuid'})
  id!: string

  @ApiProperty()
  username!: string

  @ApiProperty()
  email!: string

  @ApiProperty()
  firstName!: string

  @ApiProperty()
  lastName!: string

  @ApiProperty({enum: UserRole, enumName: 'UserRole'})
  role!: UserRole

  @ApiProperty({enum: UserLanguage, enumName: 'UserLanguage'})
  language!: UserLanguage

  static fromEntity(user: User): UserDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      language: user.language
    }
  }
}
