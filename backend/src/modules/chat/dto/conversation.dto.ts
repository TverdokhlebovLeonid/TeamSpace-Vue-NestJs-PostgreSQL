import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger'
import {ConversationType} from '@/common/enums/chat.enum'
import {MessageDto} from '@/modules/chat/dto/message.dto'
export class ConversationParticipantDto {
  @ApiProperty({format: 'uuid'})
  id!: string

  @ApiProperty()
  username!: string

  @ApiProperty()
  firstName!: string

  @ApiProperty()
  lastName!: string
}

export class ConversationDto {
  @ApiProperty({format: 'uuid'})
  id!: string

  @ApiProperty({enum: ConversationType, enumName: 'ConversationType'})
  type!: ConversationType

  @ApiProperty({nullable: true, type: String})
  title!: string | null

  @ApiProperty({type: [ConversationParticipantDto]})
  participants!: ConversationParticipantDto[]

  @ApiPropertyOptional({type: MessageDto, nullable: true})
  lastMessage!: MessageDto | null

  @ApiProperty({format: 'date-time'})
  updatedAt!: string
}
