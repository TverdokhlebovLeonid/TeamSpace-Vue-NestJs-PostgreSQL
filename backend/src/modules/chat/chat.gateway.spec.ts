import {ConfigService} from '@nestjs/config'
import {JwtService} from '@nestjs/jwt'
import {Test} from '@nestjs/testing'
import {UserRole} from '@/common/enums/user-role.enum'
import {ChatGateway} from '@/modules/chat/chat.gateway'
import {ChatService} from '@/modules/chat/chat.service'

const OPEN = 1

function createSocket() {
  const send = jest.fn()
  const close = jest.fn()
  const once = jest.fn()
  return {
    OPEN,
    readyState: OPEN,
    send,
    close,
    once,
    isAuthed: false as boolean | undefined,
    userId: undefined as string | undefined,
    authTimer: undefined as NodeJS.Timeout | undefined,
    expiryTimer: undefined as NodeJS.Timeout | undefined
  }
}

type FakeSocket = ReturnType<typeof createSocket>

function asClient(socket: FakeSocket) {
  return socket as never
}

function parseSend(socket: FakeSocket): {event: string; data: unknown} {
  const lastCall = socket.send.mock.calls.at(-1) as [string] | undefined
  if (!lastCall) throw new Error('socket.send was not called')
  return JSON.parse(lastCall[0]) as {event: string; data: unknown}
}

describe('ChatGateway', () => {
  let gateway: ChatGateway
  const verifyAsync = jest.fn()
  const createMessage = jest.fn()
  const getMemberIds = jest.fn()

  beforeEach(async () => {
    verifyAsync.mockReset()
    createMessage.mockReset()
    getMemberIds.mockReset()
    const module = await Test.createTestingModule({
      providers: [
        ChatGateway,
        {provide: JwtService, useValue: {verifyAsync}},
        {provide: ChatService, useValue: {createMessage, getMemberIds}},
        {provide: ConfigService, useValue: {getOrThrow: () => ({accessSecret: 'access-secret'})}}
      ]
    }).compile()
    gateway = module.get(ChatGateway)
  })

  async function authSocket(userId: string) {
    const client = createSocket()
    verifyAsync.mockResolvedValue({
      sub: userId,
      username: userId,
      role: UserRole.USER
    })
    await gateway.handleAuth(asClient(client), {token: 'ok'})
    return client
  }

  describe('connection and auth', () => {
    it('closes with auth_timeout after 10 seconds', () => {
      jest.useFakeTimers()
      try {
        const client = createSocket()
        gateway.handleConnection(asClient(client))
        jest.advanceTimersByTime(10_000)
        expect(client.close).toHaveBeenCalledWith(4401, 'auth_timeout')
      } finally {
        jest.useRealTimers()
      }
    })

    it('rejects auth without a token', async () => {
      const client = createSocket()
      await gateway.handleAuth(asClient(client), {})
      expect(parseSend(client)).toEqual({event: 'auth:error', data: {reason: 'missing_token'}})
      expect(client.close).toHaveBeenCalledWith(4401, 'missing_token')
    })

    it('rejects an invalid JWT', async () => {
      const client = createSocket()
      verifyAsync.mockRejectedValue(new Error('bad'))
      await gateway.handleAuth(asClient(client), {token: 'bad'})
      expect(parseSend(client).data).toEqual({reason: 'invalid_token'})
    })

    it('emits auth:ok with the user id', async () => {
      const client = await authSocket('user-a')
      const payload = parseSend(client)
      expect(payload.event).toBe('auth:ok')
      expect((payload.data as {userId: string}).userId).toBe('user-a')
    })

    it('rejects reauth with a different identity', async () => {
      const client = await authSocket('user-a')
      verifyAsync.mockResolvedValue({
        sub: 'user-b',
        username: 'b',
        role: UserRole.USER
      })
      await gateway.handleReauth(asClient(client), {token: 'other'})
      expect(parseSend(client).data).toEqual({reason: 'identity_mismatch'})
    })
  })

  describe('message, typing and ping', () => {
    const message = {
      id: 'm1',
      conversationId: 'c1',
      senderId: 'user-a',
      content: 'hello',
      createdAt: '2026-01-01T00:00:00.000Z'
    }

    it('replies to ping with pong', () => {
      const client = createSocket()
      gateway.handlePing(asClient(client))
      const payload = parseSend(client)
      expect(payload.event).toBe('pong')
      expect(typeof (payload.data as {at: number}).at).toBe('number')
    })

    it('rejects message:send when not authenticated', async () => {
      const client = createSocket()
      await gateway.handleMessage(asClient(client), {conversationId: 'c1', content: 'hi'})
      expect(parseSend(client).data).toEqual({reason: 'not_authenticated'})
      expect(client.close).toHaveBeenCalledWith(4401, 'not_authenticated')
    })

    it('rejects message:send without content', async () => {
      const client = await authSocket('user-a')
      await gateway.handleMessage(asClient(client), {conversationId: 'c1', content: '   '})
      expect(parseSend(client)).toEqual({
        event: 'message:error',
        data: {detail: 'conversationId and content are required.'}
      })
      expect(createMessage).not.toHaveBeenCalled()
    })

    it('broadcasts message:new to conversation members', async () => {
      const sender = await authSocket('user-a')
      const recipient = await authSocket('user-b')
      createMessage.mockResolvedValue({message, recipientIds: ['user-a', 'user-b']})
      await gateway.handleMessage(asClient(sender), {conversationId: 'c1', content: 'hello'})
      expect(createMessage).toHaveBeenCalledWith('c1', 'user-a', 'hello')
      expect(parseSend(sender)).toEqual({event: 'message:new', data: message})
      expect(parseSend(recipient)).toEqual({event: 'message:new', data: message})
    })

    it('forwards typing to other members only', async () => {
      const sender = await authSocket('user-a')
      const recipient = await authSocket('user-b')
      getMemberIds.mockResolvedValue(['user-a', 'user-b'])
      await gateway.handleTyping(asClient(sender), {conversationId: 'c1'})
      expect(parseSend(recipient)).toEqual({
        event: 'typing',
        data: {conversationId: 'c1', userId: 'user-a'}
      })
      expect(parseSend(sender).event).toBe('auth:ok')
    })
  })
})
