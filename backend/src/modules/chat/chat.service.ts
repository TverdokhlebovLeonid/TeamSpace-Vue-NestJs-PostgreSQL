import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import {InjectRepository} from '@nestjs/typeorm'
import {In, Repository} from 'typeorm'
import {ConversationMemberRole, ConversationType} from '@/common/enums/chat.enum'
import {ConversationDto, ConversationParticipantDto} from '@/modules/chat/dto/conversation.dto'
import {MessageDto} from '@/modules/chat/dto/message.dto'
import {MessagesQueryDto} from '@/modules/chat/dto/messages-query.dto'
import {ConversationMember} from '@/modules/chat/entities/conversation-member.entity'
import {Conversation} from '@/modules/chat/entities/conversation.entity'
import {Message} from '@/modules/chat/entities/message.entity'
import {User} from '@/modules/users/user.entity'

const DEFAULT_MESSAGE_LIMIT = 30

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversations: Repository<Conversation>,
    @InjectRepository(ConversationMember)
    private readonly members: Repository<ConversationMember>,
    @InjectRepository(Message)
    private readonly messages: Repository<Message>,
    @InjectRepository(User)
    private readonly users: Repository<User>
  ) {}

  private static directKey(a: string, b: string): string {
    return [a, b].sort().join(':')
  }

  async createGroup(
    creatorId: string,
    title: string,
    memberIds: string[]
  ): Promise<ConversationDto> {
    const uniqueIds = [...new Set([creatorId, ...memberIds])]
    const found = await this.users.find({where: {id: In(uniqueIds)}})
    if (found.length !== uniqueIds.length) {
      throw new BadRequestException('One or more members do not exist.')
    }

    const conversation = await this.conversations.save(
      this.conversations.create({type: ConversationType.GROUP, title, createdBy: creatorId})
    )
    await this.members.save(
      uniqueIds.map((userId) =>
        this.members.create({
          conversationId: conversation.id,
          userId,
          role: userId === creatorId ? ConversationMemberRole.OWNER : ConversationMemberRole.MEMBER
        })
      )
    )
    return this.getConversationView(conversation.id, creatorId)
  }

  async createOrGetDirect(userId: string, otherUserId: string): Promise<ConversationDto> {
    if (userId === otherUserId) {
      throw new BadRequestException('Cannot start a conversation with yourself.')
    }
    const other = await this.users.findOne({where: {id: otherUserId}})
    if (!other) throw new NotFoundException('User not found.')

    const directKey = ChatService.directKey(userId, otherUserId)
    const existing = await this.conversations.findOne({where: {directKey}})
    if (existing) return this.getConversationView(existing.id, userId)

    const conversation = await this.conversations.save(
      this.conversations.create({
        type: ConversationType.DIRECT,
        title: null,
        createdBy: userId,
        directKey
      })
    )
    await this.members.save([
      this.members.create({
        conversationId: conversation.id,
        userId,
        role: ConversationMemberRole.MEMBER
      }),
      this.members.create({
        conversationId: conversation.id,
        userId: otherUserId,
        role: ConversationMemberRole.MEMBER
      })
    ])
    return this.getConversationView(conversation.id, userId)
  }

  async listConversations(userId: string): Promise<ConversationDto[]> {
    const memberships = await this.members.find({where: {userId}})
    const conversationIds = memberships.map((m) => m.conversationId)
    if (!conversationIds.length) return []
    const views = await Promise.all(
      conversationIds.map((id) => this.getConversationView(id, userId))
    )
    return views.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  async getMessages(
    conversationId: string,
    userId: string,
    query: MessagesQueryDto
  ): Promise<MessageDto[]> {
    await this.assertMember(conversationId, userId)
    const limit = query.limit ?? DEFAULT_MESSAGE_LIMIT

    const qb = this.messages
      .createQueryBuilder('message')
      .where('message.conversation_id = :conversationId', {conversationId})
      .orderBy('message.created_at', 'DESC')
      .take(limit)

    if (query.before) {
      const cursor = await this.messages.findOne({where: {id: query.before}})
      if (cursor) qb.andWhere('message.created_at < :cursor', {cursor: cursor.createdAt})
    }

    const rows = await qb.getMany()
    return rows.reverse().map((message) => MessageDto.fromEntity(message))
  }

  async createMessage(
    conversationId: string,
    senderId: string,
    content: string
  ): Promise<{message: MessageDto; recipientIds: string[]}> {
    await this.assertMember(conversationId, senderId)
    const trimmed = content.trim()
    if (!trimmed) throw new BadRequestException('Message cannot be empty.')

    const saved = await this.messages.save(
      this.messages.create({conversationId, senderId, content: trimmed})
    )
    await this.conversations.update(conversationId, {updatedAt: new Date()})

    const recipientIds = await this.getMemberIds(conversationId)
    return {message: MessageDto.fromEntity(saved), recipientIds}
  }

  async getMemberIds(conversationId: string): Promise<string[]> {
    const members = await this.members.find({where: {conversationId}})
    return members.map((member) => member.userId)
  }

  async assertMember(conversationId: string, userId: string): Promise<void> {
    const membership = await this.members.findOne({where: {conversationId, userId}})
    if (!membership) throw new ForbiddenException('You are not a member of this conversation.')
  }

  private async getConversationView(
    conversationId: string,
    viewerId: string
  ): Promise<ConversationDto> {
    const conversation = await this.conversations.findOne({where: {id: conversationId}})
    if (!conversation) throw new NotFoundException('Conversation not found.')

    const members = await this.members.find({
      where: {conversationId},
      relations: {user: true}
    })
    const participants: ConversationParticipantDto[] = members
      .filter((member) => member.user)
      .map((member) => ({
        id: member.user.id,
        username: member.user.username,
        firstName: member.user.firstName,
        lastName: member.user.lastName
      }))

    const lastMessage = await this.messages.findOne({
      where: {conversationId},
      order: {createdAt: 'DESC'}
    })

    return {
      id: conversation.id,
      type: conversation.type,
      title: this.resolveTitle(conversation, participants, viewerId),
      participants,
      lastMessage: lastMessage ? MessageDto.fromEntity(lastMessage) : null,
      updatedAt: conversation.updatedAt.toISOString()
    }
  }

  private resolveTitle(
    conversation: Conversation,
    participants: ConversationParticipantDto[],
    viewerId: string
  ): string | null {
    if (conversation.type === ConversationType.GROUP) return conversation.title
    const other = participants.find((participant) => participant.id !== viewerId)
    if (!other) return null
    const fullName = `${other.firstName} ${other.lastName}`.trim()
    return fullName || other.username
  }
}
