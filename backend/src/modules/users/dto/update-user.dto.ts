import {ApiPropertyOptional} from '@nestjs/swagger'
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf
} from 'class-validator'
import {UserLanguage, UserRole} from '@/common/enums/user-role.enum'

export class UpdateUserDto {
  @ApiPropertyOptional({minLength: 3, maxLength: 150, example: 'jdoe'})
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  @Matches(/^[\w.@+-]+$/, {
    message: 'Username may contain letters, digits and . @ + - _ only.'
  })
  username?: string

  @ApiPropertyOptional({format: 'email', example: 'jdoe@example.com'})
  @IsOptional()
  @ValidateIf((_, value) => value !== '')
  @IsEmail()
  email?: string

  @ApiPropertyOptional({maxLength: 150})
  @IsOptional()
  @IsString()
  @MaxLength(150)
  firstName?: string

  @ApiPropertyOptional({maxLength: 150})
  @IsOptional()
  @IsString()
  @MaxLength(150)
  lastName?: string

  @ApiPropertyOptional({enum: UserRole, enumName: 'UserRole'})
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole

  @ApiPropertyOptional({enum: UserLanguage, enumName: 'UserLanguage'})
  @IsOptional()
  @IsEnum(UserLanguage)
  language?: UserLanguage
}
