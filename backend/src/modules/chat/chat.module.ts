import {Module} from '@nestjs/common'
import {JwtModule} from '@nestjs/jwt'
import {TypeOrmModule} from '@nestjs/typeorm'
import {ChatController} from '@/modules/chat/chat.controller'
import {ChatGateway} from '@/modules/chat/chat.gateway'
import {ChatService} from '@/modules/chat/chat.service'
import {ConversationMember} from '@/modules/chat/entities/conversation-member.entity'
import {Conversation} from '@/modules/chat/entities/conversation.entity'
import {Message} from '@/modules/chat/entities/message.entity'
import {User} from '@/modules/users/user.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, ConversationMember, Message, User]),
    JwtModule.register({})
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway]
})
export class ChatModule {}
