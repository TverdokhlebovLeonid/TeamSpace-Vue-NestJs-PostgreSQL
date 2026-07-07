import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger'
import {IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength} from 'class-validator'
import {UserRole} from '@/common/enums/user-role.enum'
export class CreateUserDto {
  @ApiProperty({minLength: 3, maxLength: 150, example: 'jdoe'})
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  @Matches(/^[\w.@+-]+$/, {
    message: 'Username may contain letters, digits and . @ + - _ only.'
  })
  username!: string

  @ApiPropertyOptional({format: 'email', example: 'jdoe@example.com'})
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiProperty({minLength: 8, example: 'StrongPass123'})
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string

  @ApiPropertyOptional({enum: UserRole, enumName: 'UserRole', default: UserRole.USER})
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole

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
}
