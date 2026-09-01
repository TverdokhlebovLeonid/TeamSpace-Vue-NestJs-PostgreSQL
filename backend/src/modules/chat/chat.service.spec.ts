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
})
