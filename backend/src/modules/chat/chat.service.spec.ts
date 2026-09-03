import {getRepositoryToken} from '@nestjs/typeorm'
import {BadRequestException, ForbiddenException, NotFoundException} from '@nestjs/common'
import {Test} from '@nestjs/testing'
import {ConversationMemberRole, ConversationType} from '@/common/enums/chat.enum'
import {ChatService} from '@/modules/chat/chat.service'
import {ConversationMember} from '@/modules/chat/entities/conversation-member.entity'
import {Conversation} from '@/modules/chat/entities/conversation.entity'
import {Message} from '@/modules/chat/entities/message.entity'
import {User} from '@/modules/users/user.entity'
import {createUser, mockRepository} from '../../../test/helpers'

const creator = createUser({id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'creator'})
const member = createUser({id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', username: 'member'})

function createQueryBuilderMock(rows: unknown[]) {
  const where = jest.fn()
  const orderBy = jest.fn()
  const take = jest.fn()
  const andWhere = jest.fn()
  const getMany = jest.fn(() => Promise.resolve(rows))
  const qb = {where, orderBy, take, andWhere, getMany}
  where.mockReturnValue(qb)
  orderBy.mockReturnValue(qb)
  take.mockReturnValue(qb)
  andWhere.mockReturnValue(qb)
  return qb
}

describe('ChatService', () => {
  let service: ChatService
  const conversations = mockRepository()
  const members = mockRepository()
  const messages = mockRepository()
  const users = mockRepository()

  beforeEach(async () => {
    for (const repo of [conversations, members, messages, users]) {
      repo.findOne.mockReset()
      repo.find.mockReset()
      repo.save.mockReset()
      repo.create.mockReset()
      repo.create.mockImplementation((entity: unknown) => entity)
      repo.save.mockImplementation((entity: unknown) => Promise.resolve(entity))
      repo.update.mockReset()
      repo.createQueryBuilder.mockReset()
    }
    const module = await Test.createTestingModule({
      providers: [
        ChatService,
        {provide: getRepositoryToken(Conversation), useValue: conversations},
        {provide: getRepositoryToken(ConversationMember), useValue: members},
        {provide: getRepositoryToken(Message), useValue: messages},
        {provide: getRepositoryToken(User), useValue: users}
      ]
    }).compile()
    service = module.get(ChatService)
  })

  function mockConversationView(conversation: {
    id: string
    type: ConversationType
    title: string | null
    updatedAt: Date
  }) {
    conversations.findOne.mockResolvedValue(conversation)
    members.find.mockResolvedValue([
      {userId: creator.id, user: creator, role: ConversationMemberRole.OWNER},
      {userId: member.id, user: member, role: ConversationMemberRole.MEMBER}
    ])
    messages.findOne.mockResolvedValue(null)
  }

  describe('group', () => {
    it('adds the creator as OWNER and others as MEMBER', async () => {
      users.find.mockResolvedValue([creator, member])
      const saved = {
        id: 'conv-1',
        type: ConversationType.GROUP,
        title: 'Team',
        createdBy: creator.id,
        updatedAt: new Date('2026-01-01')
      }
      conversations.save.mockResolvedValue(saved)
      mockConversationView(saved)
      await service.createGroup(creator.id, 'Team', [member.id])
      expect(members.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({userId: creator.id, role: ConversationMemberRole.OWNER}),
          expect.objectContaining({userId: member.id, role: ConversationMemberRole.MEMBER})
        ])
      )
    })

    it('deduplicates member ids', async () => {
      users.find.mockResolvedValue([creator, member])
      const saved = {
        id: 'conv-1',
        type: ConversationType.GROUP,
        title: 'Team',
        createdBy: creator.id,
        updatedAt: new Date()
      }
      conversations.save.mockResolvedValue(saved)
      mockConversationView(saved)
      await service.createGroup(creator.id, 'Team', [member.id, member.id, creator.id])
      expect(members.create).toHaveBeenCalledTimes(2)
    })

    it('rejects missing members', async () => {
      users.find.mockResolvedValue([creator])
      await expect(service.createGroup(creator.id, 'Team', [member.id])).rejects.toBeInstanceOf(
        BadRequestException
      )
    })

    it('forbids a non-member', async () => {
      members.findOne.mockResolvedValue(null)
      await expect(service.assertMember('conv-1', 'stranger')).rejects.toBeInstanceOf(
        ForbiddenException
      )
    })
  })

  describe('direct', () => {
    it('rejects a conversation with yourself', async () => {
      await expect(service.createOrGetDirect(creator.id, creator.id)).rejects.toBeInstanceOf(
        BadRequestException
      )
    })

    it('rejects a missing other user', async () => {
      users.findOne.mockResolvedValue(null)
      await expect(service.createOrGetDirect(creator.id, member.id)).rejects.toBeInstanceOf(
        NotFoundException
      )
    })

    it('returns the existing conversation for a directKey', async () => {
      users.findOne.mockResolvedValue(member)
      const existing = {
        id: 'conv-direct',
        type: ConversationType.DIRECT,
        title: null,
        updatedAt: new Date('2026-01-02')
      }
      mockConversationView(existing)
      const view = await service.createOrGetDirect(creator.id, member.id)
      expect(view.id).toBe('conv-direct')
      expect(conversations.save).not.toHaveBeenCalled()
    })

    it('stores a sorted directKey for a new conversation', async () => {
      users.findOne.mockResolvedValue(member)
      const saved = {
        id: 'conv-new',
        type: ConversationType.DIRECT,
        title: null,
        createdBy: creator.id,
        updatedAt: new Date()
      }
      conversations.findOne.mockResolvedValueOnce(null)
      conversations.save.mockResolvedValue(saved)
      mockConversationView(saved)
      await service.createOrGetDirect(creator.id, member.id)
      const expectedKey = [creator.id, member.id].sort().join(':')
      expect(conversations.create).toHaveBeenCalledWith(
        expect.objectContaining({directKey: expectedKey, type: ConversationType.DIRECT})
      )
    })
  })

  describe('messages', () => {
    it('forbids sending when the user is not a member', async () => {
      members.findOne.mockResolvedValue(null)
      await expect(service.createMessage('conv-1', 'stranger', 'hi')).rejects.toBeInstanceOf(
        ForbiddenException
      )
    })

    it('rejects whitespace-only content', async () => {
      members.findOne.mockResolvedValue({conversationId: 'conv-1', userId: creator.id})
      await expect(service.createMessage('conv-1', creator.id, '   ')).rejects.toBeInstanceOf(
        BadRequestException
      )
    })

    it('trims content and updates conversation.updatedAt', async () => {
      members.findOne.mockResolvedValue({conversationId: 'conv-1', userId: creator.id})
      messages.save.mockResolvedValue({
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: creator.id,
        content: 'hello',
        createdAt: new Date('2026-01-01')
      })
      members.find.mockResolvedValue([{userId: creator.id}, {userId: member.id}])
      const result = await service.createMessage('conv-1', creator.id, '  hello  ')
      expect(messages.create).toHaveBeenCalledWith(expect.objectContaining({content: 'hello'}))
      const updateCall = conversations.update.mock.calls[0] as [string, {updatedAt: Date}]
      expect(updateCall[0]).toBe('conv-1')
      expect(updateCall[1].updatedAt).toBeInstanceOf(Date)
      expect(result.recipientIds).toEqual([creator.id, member.id])
    })

    it('returns messages in chronological order with default limit 30', async () => {
      members.findOne.mockResolvedValue({conversationId: 'conv-1', userId: creator.id})
      const newer = {
        id: 'm2',
        conversationId: 'conv-1',
        senderId: creator.id,
        content: 'second',
        createdAt: new Date('2026-01-02')
      }
      const older = {
        id: 'm1',
        conversationId: 'conv-1',
        senderId: creator.id,
        content: 'first',
        createdAt: new Date('2026-01-01')
      }
      const qb = createQueryBuilderMock([newer, older])
      messages.createQueryBuilder.mockReturnValue(qb)
      const rows = await service.getMessages('conv-1', creator.id, {})
      expect(qb.take).toHaveBeenCalledWith(30)
      expect(rows.map((row) => row.content)).toEqual(['first', 'second'])
    })

    it('applies a before cursor when the message exists', async () => {
      members.findOne.mockResolvedValue({conversationId: 'conv-1', userId: creator.id})
      const cursor = {id: 'm2', createdAt: new Date('2026-01-02')}
      messages.findOne.mockResolvedValue(cursor)
      const qb = createQueryBuilderMock([])
      messages.createQueryBuilder.mockReturnValue(qb)
      await service.getMessages('conv-1', creator.id, {before: 'm2'})
      expect(qb.andWhere).toHaveBeenCalledWith('message.created_at < :cursor', {
        cursor: cursor.createdAt
      })
    })
  })
})
