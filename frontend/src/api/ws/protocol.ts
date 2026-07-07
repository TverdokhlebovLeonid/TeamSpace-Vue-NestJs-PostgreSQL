import type {components} from '@/api/schema'
export type ChatMessage = components['schemas']['MessageDto']
export interface WsEnvelope<T = unknown> {
  event: string
  data: T
}

export const ClientEvent = {
  Auth: 'auth',
  Reauth: 'reauth',
  SendMessage: 'message:send',
  Typing: 'typing',
  Ping: 'ping'
} as const

export const ServerEvent = {
  AuthOk: 'auth:ok',
  AuthError: 'auth:error',
  NewMessage: 'message:new',
  MessageError: 'message:error',
  Typing: 'typing',
  Pong: 'pong'
} as const

export interface AuthOkPayload {
  userId: string
  role: string
  expiresAt: number | null
}

export interface AuthErrorPayload {
  reason: string
}

export interface TypingPayload {
  conversationId: string
  userId: string
}
