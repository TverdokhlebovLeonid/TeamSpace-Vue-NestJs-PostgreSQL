import {ApiProperty} from '@nestjs/swagger'
import type {User} from '@/modules/users/user.entity'
export class ContactDto {
  @ApiProperty({format: 'uuid'})
  id!: string

  @ApiProperty()
  username!: string

  @ApiProperty()
  firstName!: string

  @ApiProperty()
  lastName!: string

  static fromEntity(user: User): ContactDto {
    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName
    }
  }
}
