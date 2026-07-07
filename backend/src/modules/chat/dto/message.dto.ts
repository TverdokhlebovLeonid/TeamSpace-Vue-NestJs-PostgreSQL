import {ApiProperty} from '@nestjs/swagger'
import {Message} from '@/modules/chat/entities/message.entity'
export class MessageDto {
  @ApiProperty({format: 'uuid'})
  id!: string

  @ApiProperty({format: 'uuid'})
  conversationId!: string

  @ApiProperty({format: 'uuid'})
  senderId!: string

  @ApiProperty()
  content!: string

  @ApiProperty({format: 'date-time'})
  createdAt!: string

  static fromEntity(message: Message): MessageDto {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      createdAt: message.createdAt.toISOString()
    }
  }
}
