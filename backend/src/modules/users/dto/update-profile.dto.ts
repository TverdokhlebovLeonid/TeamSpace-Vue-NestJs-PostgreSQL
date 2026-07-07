import {ApiProperty} from '@nestjs/swagger'
import {IsEnum} from 'class-validator'
import {UserLanguage} from '@/common/enums/user-role.enum'
export class UpdateProfileDto {
  @ApiProperty({enum: UserLanguage, enumName: 'UserLanguage'})
  @IsEnum(UserLanguage)
  language!: UserLanguage
}
