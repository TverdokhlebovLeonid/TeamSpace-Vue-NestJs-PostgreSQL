import {Body, Controller, Get, Param, ParseUUIDPipe, Post, Query} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags
} from '@nestjs/swagger'
import {CurrentUser} from '@/common/decorators/current-user.decorator'
import {ChatGateway} from '@/modules/chat/chat.gateway'
import {ChatService} from '@/modules/chat/chat.service'
import {ConversationDto} from '@/modules/chat/dto/conversation.dto'
import {CreateDirectDto} from '@/modules/chat/dto/create-direct.dto'
import {CreateGroupDto} from '@/modules/chat/dto/create-group.dto'
import {MessageDto} from '@/modules/chat/dto/message.dto'
import {MessagesQueryDto} from '@/modules/chat/dto/messages-query.dto'
import {SendMessageDto} from '@/modules/chat/dto/send-message.dto'

@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway
  ) {}

  @Get('conversations')
  @ApiOperation({summary: 'List conversations of the current user'})
  @ApiOkResponse({type: [ConversationDto]})
  listConversations(@CurrentUser('sub') userId: string): Promise<ConversationDto[]> {
    return this.chatService.listConversations(userId)
  }

  @Post('conversations/group')
  @ApiOperation({summary: 'Create a group conversation'})
  @ApiCreatedResponse({type: ConversationDto})
  createGroup(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateGroupDto
  ): Promise<ConversationDto> {
    return this.chatService.createGroup(userId, dto.title, dto.memberIds)
  }

  @Post('conversations/direct')
  @ApiOperation({summary: 'Open (or create) a 1:1 conversation with another user'})
  @ApiCreatedResponse({type: ConversationDto})
  createDirect(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateDirectDto
  ): Promise<ConversationDto> {
    return this.chatService.createOrGetDirect(userId, dto.userId)
  }

  @Get('conversations/:id/messages')
  @ApiOperation({summary: 'Get messages of a conversation (newest-cursor pagination)'})
  @ApiOkResponse({type: [MessageDto]})
  getMessages(
    @CurrentUser('sub') userId: string,
    @Param('id', new ParseUUIDPipe()) conversationId: string,
    @Query() query: MessagesQueryDto
  ): Promise<MessageDto[]> {
    return this.chatService.getMessages(conversationId, userId, query)
  }

  @Post('messages')
  @ApiOperation({summary: 'Send a message over REST (also broadcast to live sockets)'})
  @ApiCreatedResponse({type: MessageDto})
  async sendMessage(
    @CurrentUser('sub') userId: string,
    @Body() dto: SendMessageDto
  ): Promise<MessageDto> {
    const {message, recipientIds} = await this.chatService.createMessage(
      dto.conversationId,
      userId,
      dto.content
    )
    this.chatGateway.broadcastMessage(message, recipientIds)
    return message
  }
}
