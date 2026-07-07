import {Logger} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import {JwtService} from '@nestjs/jwt'
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets'
import type {Server, WebSocket} from 'ws'
import type {UserRole} from '@/common/enums/user-role.enum'
import type {JwtPayload} from '@/common/types/authenticated-request'
import type {JwtConfig} from '@/config/configuration'
import {ChatService} from '@/modules/chat/chat.service'
import type {MessageDto} from '@/modules/chat/dto/message.dto'

const WS_CLOSE_UNAUTHORIZED = 4401
const AUTH_TIMEOUT_MS = 10_000

interface AuthedSocket extends WebSocket {
  userId?: string
  role?: UserRole
  tokenExp?: number
  isAuthed?: boolean
  authTimer?: NodeJS.Timeout
  expiryTimer?: NodeJS.Timeout
}

type AccessPayload = JwtPayload & {exp?: number}

@WebSocketGateway({path: '/api/ws'})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name)
  private readonly accessSecret: string
  private readonly sockets = new Map<string, Set<AuthedSocket>>()

  @WebSocketServer()
  server!: Server

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
    configService: ConfigService
  ) {
    this.accessSecret = configService.getOrThrow<JwtConfig>('jwt').accessSecret
  }

  handleConnection(client: AuthedSocket): void {
    client.isAuthed = false
    client.authTimer = setTimeout(() => {
      if (!client.isAuthed) this.closeUnauthorized(client, 'auth_timeout')
    }, AUTH_TIMEOUT_MS)
  }

  handleDisconnect(client: AuthedSocket): void {
    this.clearTimers(client)
    this.unregister(client)
  }

  @SubscribeMessage('auth')
  async handleAuth(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: {token?: string} | undefined
  ): Promise<void> {
    await this.authenticate(client, payload?.token)
  }

  @SubscribeMessage('reauth')
  async handleReauth(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: {token?: string} | undefined
  ): Promise<void> {
    await this.authenticate(client, payload?.token, client.userId)
  }

  @SubscribeMessage('message:send')
  async handleMessage(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: {conversationId?: string; content?: string} | undefined
  ): Promise<void> {
    if (!this.ensureAuthenticated(client)) return
    const conversationId = payload?.conversationId
    const content = payload?.content
    if (!conversationId || typeof content !== 'string' || !content.trim()) {
      this.send(client, 'message:error', {detail: 'conversationId and content are required.'})
      return
    }
    try {
      const {message, recipientIds} = await this.chatService.createMessage(
        conversationId,
        client.userId!,
        content
      )
      this.broadcastMessage(message, recipientIds)
    } catch (error) {
      this.send(client, 'message:error', {
        detail: error instanceof Error ? error.message : 'Failed to send message.'
      })
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthedSocket): void {
    this.send(client, 'pong', {at: Date.now()})
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: {conversationId?: string} | undefined
  ): Promise<void> {
    if (!this.ensureAuthenticated(client) || !payload?.conversationId) return
    const recipientIds = await this.chatService.getMemberIds(payload.conversationId)
    if (!recipientIds.includes(client.userId!)) return
    for (const recipientId of recipientIds) {
      if (recipientId === client.userId) continue
      this.sendToUser(recipientId, 'typing', {
        conversationId: payload.conversationId,
        userId: client.userId
      })
    }
  }

  broadcastMessage(message: MessageDto, recipientIds: string[]): void {
    for (const recipientId of recipientIds) {
      this.sendToUser(recipientId, 'message:new', message)
    }
  }

  private async authenticate(
    client: AuthedSocket,
    token: string | undefined,
    expectedUserId?: string
  ): Promise<void> {
    if (!token) {
      this.closeUnauthorized(client, 'missing_token')
      return
    }
    let decoded: AccessPayload
    try {
      decoded = await this.jwtService.verifyAsync<AccessPayload>(token, {
        secret: this.accessSecret
      })
    } catch {
      this.closeUnauthorized(client, 'invalid_token')
      return
    }
    if (expectedUserId && decoded.sub !== expectedUserId) {
      this.closeUnauthorized(client, 'identity_mismatch')
      return
    }

    if (client.authTimer) {
      clearTimeout(client.authTimer)
      client.authTimer = undefined
    }
    if (!client.isAuthed) client.once('close', () => this.unregister(client))
    client.userId = decoded.sub
    client.role = decoded.role
    client.tokenExp = decoded.exp
    client.isAuthed = true
    this.register(client)
    this.scheduleExpiry(client)
    this.send(client, 'auth:ok', {
      userId: decoded.sub,
      role: decoded.role,
      expiresAt: decoded.exp ? decoded.exp * 1000 : null
    })
  }

  private scheduleExpiry(client: AuthedSocket): void {
    if (client.expiryTimer) {
      clearTimeout(client.expiryTimer)
      client.expiryTimer = undefined
    }
    if (!client.tokenExp) return
    const delay = client.tokenExp * 1000 - Date.now()
    if (delay <= 0) {
      this.closeUnauthorized(client, 'token_expired')
      return
    }
    client.expiryTimer = setTimeout(() => this.closeUnauthorized(client, 'token_expired'), delay)
  }

  private ensureAuthenticated(client: AuthedSocket): boolean {
    if (!client.isAuthed || !client.userId) {
      this.closeUnauthorized(client, 'not_authenticated')
      return false
    }
    if (client.tokenExp && client.tokenExp * 1000 <= Date.now()) {
      this.closeUnauthorized(client, 'token_expired')
      return false
    }
    return true
  }

  private register(client: AuthedSocket): void {
    if (!client.userId) return
    const set = this.sockets.get(client.userId) ?? new Set<AuthedSocket>()
    set.add(client)
    this.sockets.set(client.userId, set)
  }

  private unregister(client: AuthedSocket): void {
    if (!client.userId) return
    const set = this.sockets.get(client.userId)
    if (!set) return
    set.delete(client)
    if (set.size === 0) this.sockets.delete(client.userId)
  }

  private sendToUser(userId: string, event: string, data: unknown): void {
    const set = this.sockets.get(userId)
    if (!set) return
    for (const socket of set) {
      this.send(socket, event, data)
    }
  }

  private send(client: AuthedSocket, event: string, data: unknown): void {
    if (client.readyState === client.OPEN) client.send(JSON.stringify({event, data}))
  }

  private closeUnauthorized(client: AuthedSocket, reason: string): void {
    this.send(client, 'auth:error', {reason})
    this.clearTimers(client)
    try {
      client.close(WS_CLOSE_UNAUTHORIZED, reason)
    } catch (error) {
      this.logger.debug(`Failed to close socket: ${String(error)}`)
    }
  }

  private clearTimers(client: AuthedSocket): void {
    if (client.authTimer) {
      clearTimeout(client.authTimer)
      client.authTimer = undefined
    }
    if (client.expiryTimer) {
      clearTimeout(client.expiryTimer)
      client.expiryTimer = undefined
    }
  }
}
