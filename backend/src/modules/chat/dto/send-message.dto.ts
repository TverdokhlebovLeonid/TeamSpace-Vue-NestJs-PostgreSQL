import {ApiProperty} from '@nestjs/swagger'
import {IsString, IsUUID, MaxLength, MinLength} from 'class-validator'
export class SendMessageDto {
  @ApiProperty({format: 'uuid'})
  @IsUUID('4')
  conversationId!: string

  @ApiProperty({minLength: 1, maxLength: 4000})
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content!: string
}
